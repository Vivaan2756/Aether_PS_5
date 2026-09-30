"""
kisan_model.py  -  single source of truth for the Kisan Vikas yield model.

Used in TWO places (same file, so training and backend can never drift apart):
  1. Kaggle notebook : builds/trains KisanYieldModel and calls save_checkpoint()
  2. Backend (FastAPI): YieldPredictor("kisan_yield.pth").predict(image, tabular)

Backend requirements: torch, terratorch, numpy   (no internet / no pretrained download needed:
the fine-tuned weights are inside the .pth).
"""
import math
import os
import warnings
from datetime import datetime, timezone

import numpy as np
import torch
import torch.nn as nn

FORMAT_VERSION = 2

# --------------------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------------------
def _build_backbone(name, pretrained):
    from terratorch.registry import BACKBONE_REGISTRY
    return BACKBONE_REGISTRY.build(name, pretrained=pretrained)

def find_blocks(backbone):
    """Return the ModuleList of transformer blocks inside the Prithvi backbone."""
    if hasattr(backbone, "blocks"):
        return backbone.blocks
    for _, m in backbone.named_modules():
        if isinstance(m, nn.ModuleList) and len(m) >= 12:
            return m
    raise RuntimeError("Could not locate transformer blocks in backbone")

class KisanYieldModel(nn.Module):
    """
    Prithvi-EO-2.0 (satellite time series)  +  tabular tokens (weather/soil/crop)
      -> attention pooling -> small multimodal transformer -> (mean, log_variance)

    forward(img, tab) -> (mu, log_var), both (B,1), in NORMALISED target units.
      img : (B, C=6, T=3, 224, 224)  band-normalised
      tab : (B, tabular_dim)         standardised
    """
    def __init__(self, tabular_dim=7, d_model=256, n_queries=8, n_layers=2, n_heads=4,
                 dropout=0.1, backbone_name="prithvi_eo_v2_300", embed_dim=1024,
                 pretrained_backbone=False):
        super().__init__()
        self.backbone = _build_backbone(backbone_name, pretrained_backbone)

        # learned queries pool the ~588 patch tokens into n_queries summary tokens
        self.queries = nn.Parameter(torch.randn(1, n_queries, embed_dim) * 0.02)
        self.pool = nn.MultiheadAttention(embed_dim, 8, batch_first=True)
        self.img_proj = nn.Sequential(nn.LayerNorm(embed_dim), nn.Linear(embed_dim, d_model))

        # every scalar covariate becomes its own token: value * w_i + b_i
        self.tab_w = nn.Parameter(torch.randn(tabular_dim, d_model) * 0.02)
        self.tab_b = nn.Parameter(torch.zeros(tabular_dim, d_model))
        self.reg_token = nn.Parameter(torch.zeros(1, 1, d_model))

        layer = nn.TransformerEncoderLayer(d_model, n_heads, d_model * 4, dropout,
                                           activation="gelu", batch_first=True, norm_first=True)
        self.fusion = nn.TransformerEncoder(layer, n_layers, enable_nested_tensor=False)
        self.out_norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, 2)          # -> [mean, log_variance]

    def encode_image(self, x):
        f = self.backbone(x)
        if isinstance(f, (list, tuple)):
            f = f[-1]
        if f.dim() == 4:                            # (B,C,H,W) -> (B,N,C)
            f = f.flatten(2).transpose(1, 2)
        return f                                    # (B,N,embed_dim)

    def forward(self, img, tab):
        f = self.encode_image(img)
        B = f.size(0)
        pooled, _ = self.pool(self.queries.expand(B, -1, -1), f, f)
        img_tok = self.img_proj(pooled)                                  # (B,Q,d)
        tab_tok = tab.unsqueeze(-1) * self.tab_w + self.tab_b            # (B,F,d)
        z = self.fusion(torch.cat([self.reg_token.expand(B, -1, -1), img_tok, tab_tok], dim=1))
        out = self.head(self.out_norm(z[:, 0]))
        return out[:, 0:1], out[:, 1:2].clamp(-6.0, 4.0)

# --------------------------------------------------------------------------------------
# Checkpoint format  (plain python types + tensors only -> safe with weights_only=True)
# --------------------------------------------------------------------------------------
def save_checkpoint(path, model, model_config, normalization, metrics=None,
                    version="v1", half=False, notes=""):
    """
    normalization must contain (plain lists/floats/str):
      band_names, band_means, band_stds, num_frames, image_size,
      tab_cols, tab_mean, tab_std, y_mean, y_std, y_unit
    """
    sd = {}
    for k, v in model.state_dict().items():
        v = v.detach().cpu()
        sd[k] = v.half() if (half and v.is_floating_point()) else v
    torch.save({
        "format_version": FORMAT_VERSION,
        "model_class": "KisanYieldModel",
        "model_config": dict(model_config),
        "normalization": normalization,
        "metrics": {k: float(v) for k, v in (metrics or {}).items()},
        "version": str(version),
        "notes": notes,
        "created_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "state_dict": sd,
    }, path)
    print(f"saved {path}  ({os.path.getsize(path) / 1e6:.0f} MB)")

def load_checkpoint(path, device="cpu"):
    ck = torch.load(path, map_location="cpu", weights_only=True)   # no arbitrary code execution
    if ck.get("format_version") != FORMAT_VERSION:
        raise ValueError(f"Unsupported checkpoint format {ck.get('format_version')}")
    model = KisanYieldModel(**ck["model_config"], pretrained_backbone=False)
    sd = {k: (v.float() if v.is_floating_point() else v) for k, v in ck["state_dict"].items()}
    model.load_state_dict(sd)
    return model.to(device).eval(), ck

# --------------------------------------------------------------------------------------
# Inference wrapper for the backend
# --------------------------------------------------------------------------------------
class YieldPredictor:
    """
    p = YieldPredictor("kisan_yield_seed0.pth")           # or a list of .pth files = ensemble
    p.predict(image, tabular)
        image   : np.ndarray (C=6, T=3, H, W) RAW reflectance, same scale as training,
                  band order = norm["band_names"]  (NaN = cloud/no-data is allowed)
        tabular : dict {col: value}  (keys = norm["tab_cols"])  or a list in that order
    """
    def __init__(self, ckpt_paths, device=None, use_fp16=None):
        if isinstance(ckpt_paths, (str, os.PathLike)):
            ckpt_paths = [ckpt_paths]
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.use_fp16 = (self.device.type == "cuda") if use_fp16 is None else use_fp16
        self.models, first = [], None
        for p in ckpt_paths:
            m, ck = load_checkpoint(p, self.device)
            self.models.append(m)
            first = first or ck                      # ensemble members share the same normalisation
        self.norm = first["normalization"]
        self.version = first["version"]
        self.metrics = first["metrics"]

    # ---- preprocessing (must mirror training exactly) ----
    def _prep_image(self, arr):
        n = self.norm
        a = np.asarray(arr, dtype=np.float32)
        C, T, S = len(n["band_means"]), n["num_frames"], n["image_size"]
        if a.ndim != 4 or a.shape[0] != C or a.shape[1] != T:
            raise ValueError(f"image must be shaped ({C},{T},H,W) with bands {n['band_names']}; got {a.shape}")
        h, w = a.shape[-2:]
        if h < S or w < S:
            raise ValueError(f"image must be at least {S}x{S}; got {h}x{w}")
        t0, l0 = (h - S) // 2, (w - S) // 2
        a = a[..., t0:t0 + S, l0:l0 + S]
        mean = np.asarray(n["band_means"], np.float32)[:, None, None, None]
        std = np.asarray(n["band_stds"], np.float32)[:, None, None, None]
        a = np.nan_to_num((a - mean) / std, nan=0.0)                # cloud/no-data -> "average" pixel
        return torch.from_numpy(a)

    def _prep_tab(self, tab):
        n = self.norm
        cols = n["tab_cols"]
        if isinstance(tab, dict):
            missing = [c for c in cols if tab.get(c) is None]
            if missing:
                warnings.warn(f"missing covariates {missing}; using training mean")
            vals = [tab[c] if tab.get(c) is not None else n["tab_mean"][i] for i, c in enumerate(cols)]
        else:
            vals = list(tab)
            if len(vals) != len(cols):
                raise ValueError(f"expected {len(cols)} covariates {cols}")
        v = (np.asarray(vals, np.float32) - np.asarray(n["tab_mean"], np.float32)) / np.asarray(n["tab_std"], np.float32)
        return torch.from_numpy(v)

    @torch.inference_mode()
    def predict(self, image, tabular, tta=True):
        n = self.norm
        x = self._prep_image(image).unsqueeze(0).to(self.device)
        t = self._prep_tab(tabular).unsqueeze(0).to(self.device)
        views = [x] + ([x.flip(-1), x.flip(-2)] if tta else [])       # flips = valid for satellite tiles
        mus, vars_ = [], []
        for m in self.models:
            for v in views:
                with torch.autocast(self.device.type, dtype=torch.float16, enabled=self.use_fp16):
                    mu, lv = m(v, t)
                mus.append(mu.float().item())
                vars_.append(math.exp(lv.float().item()))
        mus, vars_ = np.array(mus), np.array(vars_)
        mu = mus.mean()
        var = vars_.mean() + mus.var()          # aleatoric + disagreement between models/views
        y = float(mu * n["y_std"] + n["y_mean"])
        sd = float(math.sqrt(var) * n["y_std"])
        y = max(y, 0.0)
        rel = sd / max(y, 1e-6)
        return {
            "yield": round(y, 3),
            "unit": n.get("y_unit", "t/ha"),
            "uncertainty_std": round(sd, 3),
            "range_80": [round(max(y - 1.2816 * sd, 0.0), 3), round(y + 1.2816 * sd, 3)],
            "confidence": "high" if rel < 0.10 else "medium" if rel < 0.20 else "low",
            "n_models": len(self.models),
            "model_version": self.version,
        }

def build_advisory(pred, ndwi=None, pest_prob=None, expected_yield=None):
    """Turns model output + the rule engine from your slides into ranked actions."""
    actions = []
    if ndwi is not None and ndwi < 0.15:
        actions.append({"type": "irrigation", "priority": 1,
                        "message": f"Water stress detected (NDWI {ndwi:.2f} < 0.15). Irrigate within 48 hours."})
    if pest_prob is not None and pest_prob > 0.75:
        actions.append({"type": "pest_control", "priority": 1,
                        "message": f"High pest outbreak risk ({pest_prob:.0%}). Inspect the field and plan targeted treatment."})
    if expected_yield and pred["range_80"][1] < 0.85 * expected_yield:
        actions.append({"type": "yield_alert", "priority": 2,
                        "message": f"Predicted yield {pred['yield']} {pred['unit']} is well below the district average "
                                   f"({expected_yield}). Check crop health and inputs."})
    if pred["confidence"] == "low":
        actions.append({"type": "data_quality", "priority": 3,
                        "message": "Low prediction confidence (cloudy imagery or unusual field). Treat as an estimate."})
    return sorted(actions, key=lambda a: a["priority"])
