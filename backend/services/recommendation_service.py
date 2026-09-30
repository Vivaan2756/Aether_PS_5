import logging
from typing import List, Dict, Any

logger = logging.getLogger("recommendation_service")

class RecommendationService:
    def generate_recommendations(
        self,
        risk_level: str,
        crop: str,
        crop_stage: str,
        top_factors: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Generates conservative, actionable, and farmer-friendly management recommendations.
        Strictly avoids prescribing chemical dosages or guessing pest species without visual diagnosis.
        """
        recs: List[str] = []

        # 1. Base recommendations by risk level
        if risk_level == "HIGH":
            recs.append("Conduct an immediate in-person field inspection for early visible pest symptoms.")
            recs.append("Increase field scouting frequency to at least twice weekly.")
            recs.append("Check leaf undersides, plant whorls, and stems before deciding on intervention measures.")
        elif risk_level == "MEDIUM":
            recs.append("Schedule regular field scouting over the next 3-5 days.")
            recs.append("Monitor boundary areas and irrigation channels for initial signs of pest movement.")
        else: # LOW
            recs.append("Maintain standard scheduled field monitoring routines.")
            recs.append("Keep field bunds and borders clear of excess weed cover to discourage pest harborage.")

        # 2. Factor-specific contextual insights
        for factor in top_factors:
            feat = factor.get("feature", "")
            direction = factor.get("direction", "")

            if direction == "increases_risk":
                if feat in ("humidity", "rainfall"):
                    tip = "Monitor the crop closely because elevated humidity and moisture create favorable microclimates for pest and fungal proliferation."
                    if tip not in recs:
                        recs.append(tip)
                elif feat in ("temperature", "temperature_max"):
                    tip = "Warm temperatures accelerate pest life cycles; inspect newly emerged foliage and vegetative growth."
                    if tip not in recs:
                        recs.append(tip)
                elif feat == "previous_pest_incidence":
                    tip = "Prioritize inspection of field hotspots where pest activity was previously noted in past weeks."
                    if tip not in recs:
                        recs.append(tip)
                elif feat == "soil_moisture":
                    tip = "Ensure adequate field drainage to avoid prolonged waterlogged soil conditions."
                    if tip not in recs:
                        recs.append(tip)
                elif feat in ("ndvi", "ndre", "ndvi_change_7d", "ndvi_change_14d"):
                    tip = "Sudden changes in crop canopy vigor (vegetation index shifts) may indicate localized stress or feeding activity."
                    if tip not in recs:
                        recs.append(tip)
                elif feat == "crop_stage":
                    tip = f"During the {crop_stage} stage, {crop} plants are especially vulnerable to canopy and shoot stress."
                    if tip not in recs:
                        recs.append(tip)

        # Ensure recommendations are concise, non-redundant, and at most 4-5 items
        # Limit to top 4 recommendations
        return recs[:4]
