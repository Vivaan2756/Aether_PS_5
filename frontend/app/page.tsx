"use client";

import React, { useState, useEffect } from "react";

import {
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  Menu,
  X,
  Send,
  Cpu,
  Sprout,
  Satellite,
  ShieldCheck,
  TrendingUp,
  Droplets,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function KisanVikasLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promptInput, setPromptInput] = useState("");
  const [promptResponse, setPromptResponse] = useState<string | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState(false);

  // Modals
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    villageState: "",
    solution: "Localized Crop Yield Forecasting",
  });

  // Hero Slider Data matching Kisan Vikas Problem Statement with user uploaded farm images
  const heroSlides = [
    {
      title: "AI-Powered Crop Yield & Pest Outbreak Prediction for Every Acre",
      highlight: "Crop Yield & Pest Outbreak",
      description:
        "Trained on open-source Sentinel-2 satellite imagery, real-time soil health data, and historical weather patterns to deliver sub-hectare harvest predictions and localized advisories.",
      btnText: "Launch Farmer Dashboard",
      btnLink: "#kisan_ai",
      bgImage: "/images/farm_workers_field.jpg",
    },
    {
      title: "Detect pest threats up to 14 days before visible crop damage occurs",
      highlight: "14 days before visible crop damage",
      description:
        "Our epidemiological AI models correlate micro-climate humidity, spore index, and canopy temperature to stop Yellow Rust, Aphids, and Blight outbreaks before they destroy your yield.",
      btnText: "Check Pest Risk Alerts",
      btnLink: "#kisan_ai",
      bgImage: "/images/tractor_spraying_field.jpg",
    },
    {
      title: "Correlate orbital satellite telemetry with plot-level soil health",
      highlight: "orbital satellite telemetry",
      description:
        "Harness open Sentinel-2 and Landsat multispectral bands to measure NDVI biomass, soil moisture deficit, and automated drip irrigation schedules down to the exact hour.",
      btnText: "Explore Satellite Telemetry",
      btnLink: "#pillars",
      bgImage: "/images/farm_workers_field.jpg",
    },
    {
      title: "Predict upcoming harvest yields with time-series deep learning",
      highlight: "Predict upcoming harvest yields",
      description:
        "Empowering smallholders, cooperative societies, and agronomists with pre-harvest acreage intelligence, localized fertilizer allocation, and seasonal market hedging.",
      btnText: "Forecast Your Farm Yield",
      btnLink: "#kisan_ai",
      bgImage: "/images/tractor_spraying_field.jpg",
    },
  ];

  // Auto-advance hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handlePromptSubmit = (q: string) => {
    setPromptInput(q);
    setIsPromptLoading(true);
    setPromptResponse(null);
    setTimeout(() => {
      setIsPromptLoading(false);
      if (q.toLowerCase().includes("wheat") || q.toLowerCase().includes("punjab")) {
        setPromptResponse(
          `🌾 KisanAI Inference [Punjab Wheat Belt]: Sentinel-2 NDVI Biomass index is 0.82 (Healthy). 10-day rainfall anomaly: -14mm deficit. Soil moisture at 15cm root-depth is 61% (Adequate). Projected Yield: 4.86 tonnes/hectare (+18.2% above district 5-year average). Action: Schedule 2.5 hours pulse drip irrigation on Wednesday; postpone chemical spraying.`
        );
      } else if (q.toLowerCase().includes("pest") || q.toLowerCase().includes("rust") || q.toLowerCase().includes("aphid")) {
        setPromptResponse(
          `⚠️ KisanAI Epidemiological Alert [Sector 4]: Relative humidity (>81%) and canopy temperatures (23°-27°C) meet biological threshold for Yellow Rust fungal spore germination within 5-7 days. Outbreak Risk: 28% (Medium Warning). Action: Apply preventive organic neem-oil extract (5ml/L) or targeted bio-fungicide spray before Friday.`
        );
      } else {
        setPromptResponse(
          `🌱 KisanAI Telemetry Analysis for "${q}": Correlated Sentinel-2 multispectral vegetation index, local soil N-P-K ratios, and ECMWF 15-day weather forecast. Vegetative Vigour: Optimal (0.79). 14-day pest outbreak probability is low (5%). Expected harvest output: +16.4% above baseline. Localized recommendation: Maintain current irrigation cycle.`
        );
      }
    }, 700);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setDemoModalOpen(false);
      alert("Dhanyawaad! The Kisan Vikas Agronomy team will connect with you to activate your localized farm dashboard.");
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-[#7ac15c] selection:text-white">
      {/* ============================================================ */}
      {/* 1. TOP HEADER / NAVIGATION - KISAN VIKAS BRAND */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo & Brand Name - Left Corner */}
          <a href="#" className="flex items-center gap-3.5 group">
            {/* Brand New Modern Kisan Vikas Agritech SVG Logo */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#053b26] via-[#094d33] to-[#032618] p-2 flex items-center justify-center text-white shadow-lg shadow-emerald-950/20 border border-emerald-400/40 group-hover:scale-105 group-hover:border-[#7ac15c] group-hover:rotate-2 transition-all">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="kvLeafLeft" x1="14" y1="18" x2="32" y2="46" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7ac15c" />
                    <stop offset="1" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="kvLeafRight" x1="48" y1="14" x2="32" y2="46" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a3e635" />
                    <stop offset="1" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="kvSun" x1="32" y1="6" x2="32" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fde047" />
                    <stop offset="1" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                {/* Orbital Satellite Telemetry Wave */}
                <path d="M10 32C10 20 20 10 32 10C44 10 54 20 54 32" stroke="#7ac15c" strokeWidth="2" strokeDasharray="3 3" opacity="0.65" />
                {/* Golden Precision Beacon / Sun */}
                <circle cx="32" cy="11" r="3.5" fill="url(#kvSun)" />
                <circle cx="32" cy="11" r="5.5" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
                {/* Dynamic Vikas 'V' Growth Stem */}
                <path d="M32 54V38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                {/* Left Dynamic Leaf */}
                <path d="M32 38C22 36 15 26 18 16C26 16 32 26 32 38Z" fill="url(#kvLeafLeft)" stroke="#ffffff" strokeWidth="1.5" />
                {/* Right Ascending Leaf */}
                <path d="M32 38C42 36 49 22 46 12C38 12 32 24 32 38Z" fill="url(#kvLeafRight)" stroke="#ffffff" strokeWidth="1.5" />
                {/* Center Vitality Nerve */}
                <path d="M32 36V22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
                {/* Ground Furrow Base */}
                <path d="M18 52C26 55 38 55 46 52" stroke="#7ac15c" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 leading-none pl-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#053b26]">Kisan</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#7ac15c]">Vikas</span>
              <span className="relative flex h-2 w-2 ml-1 self-start">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7ac15c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7ac15c]"></span>
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[15px] font-semibold text-slate-700">
            {/* Products Dropdown */}
            <div className="relative group cursor-pointer py-2">
              <span className="flex items-center gap-1 hover:text-[#7ac15c] transition-colors">
                AI Capabilities <ChevronDown className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform" />
              </span>
              <div className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                <a href="#kisan_ai" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#7ac15c]" />
                    Localized Yield Forecasting
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Time-series predictive models for upcoming harvest yields</div>
                </a>
                <a href="#kisan_ai" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#7ac15c]" />
                    Pest &amp; Disease Early Warning
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">14-day advance alert for Yellow Rust, Blight &amp; Aphids</div>
                </a>
                <a href="#pillars" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Satellite className="w-4 h-4 text-[#7ac15c]" />
                    Sentinel-2 Satellite Telemetry
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Sub-hectare NDVI biomass &amp; canopy chlorophyll mapping</div>
                </a>
                <a href="#pillars" className="block p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#7ac15c]" />
                    Precision Irrigation &amp; Soil Health
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Soil moisture telemetry &amp; hour-by-hour drip schedules</div>
                </a>
              </div>
            </div>

            <a href="#kisan_ai" className="hover:text-[#7ac15c] transition-colors">
              KisanAI Sandbox
            </a>

            <a href="#impact" className="hover:text-[#7ac15c] transition-colors">
              Field Accuracy
            </a>

            <a href="#pillars" className="hover:text-[#7ac15c] transition-colors">
              Core Architecture
            </a>

            <a href="#about" className="hover:text-[#7ac15c] transition-colors">
              About Kisan Vikas
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="text-slate-600 hover:text-[#7ac15c] p-2 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="cropin-btn cropin-btn-primary text-sm py-2.5 px-6 shadow-md"
            >
              <span>Launch Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-3.5 h-3.5 fill-white">
                <path fillRule="evenodd" d="m194.5 21 179 179-19 19H26v-38h281.5L171 44.5zm70 240h48L254 319.5a2632 2632 0 0 1-59.5 58.5c-.6 0-6.2-5.2-24-23z"></path>
              </svg>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-3 shadow-lg">
            <a href="#kisan_ai" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800 font-semibold">KisanAI Sandbox</a>
            <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800 font-semibold">Model Accuracy</a>
            <a href="#pillars" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800 font-semibold">Core Architecture</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-800 font-semibold">About Kisan Vikas</a>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = '/dashboard';
                }}
                className="cropin-btn cropin-btn-primary w-full text-center py-2.5"
              >
                Launch Dashboard
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 2. HERO BANNER SLIDER - WITH BACKGROUND CHANGING ANIMATION */}
      {/* ============================================================ */}
      <section className="relative min-h-[620px] lg:min-h-[720px] bg-slate-100 flex items-center overflow-hidden">
        {/* Background Image Carousel with Smooth Cross-Fade & Ken Burns Movement (No Black Overlay) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.bgImage}
                alt={slide.title}
               
               
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[7000ms] ease-out ${
                  currentSlide === index ? "scale-108 translate-x-1" : "scale-100"
                }`}
               
              />
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-20 lg:py-28">
          <div
            key={currentSlide}
            className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              {heroSlides[currentSlide].title.split(heroSlides[currentSlide].highlight)[0]}
              <span className="text-[#7ac15c] font-black">
                {heroSlides[currentSlide].highlight}
              </span>
              {heroSlides[currentSlide].title.split(heroSlides[currentSlide].highlight)[1]}
            </h1>

            <p className="text-lg sm:text-xl text-white/95 leading-relaxed mb-8 max-w-2xl font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {heroSlides[currentSlide].description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="cropin-btn cropin-btn-primary text-base py-3.5 px-8 shadow-xl"
              >
                <span>{heroSlides[currentSlide].btnText}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-4 h-4 fill-white">
                  <path fillRule="evenodd" d="m194.5 21 179 179-19 19H26v-38h281.5L171 44.5zm70 240h48L254 319.5a2632 2632 0 0 1-59.5 58.5c-.6 0-6.2-5.2-24-23z"></path>
                </svg>
              </button>

              <a
                href="#kisan_ai"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/40 bg-black/20 hover:bg-black/40 text-white font-semibold transition-colors text-sm backdrop-blur-xs shadow-sm"
              >
                <span>Try KisanAI Live</span>
                <Sparkles className="w-4 h-4 text-[#7ac15c]" />
              </a>
            </div>
          </div>

          {/* Slider Controls with Animated Countdown Progress Fill */}
          <div className="flex items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="flex gap-2.5 items-center bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`relative overflow-hidden h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-10 bg-white/40" : "w-3 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {currentSlide === idx && (
                    <div
                      key={currentSlide}
                      className="absolute inset-0 bg-[#7ac15c] rounded-full animate-progress-fill"
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 flex items-center justify-center backdrop-blur-sm transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BODY SECTION 1: KISAN AI LIVE TELEMETRY & QUERY SANDBOX (GREEN WITH SQUARES GRID) */}
      {/* ============================================================ */}
      <section id="kisan_ai" className="relative py-24 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 shadow-inner text-white border-b border-emerald-800/50 overflow-hidden">
        {/* Animated Squares Grid Glow & Ambient Light Orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-36 -left-36 w-96 h-96 bg-[#7ac15c]/15 rounded-full blur-3xl pointer-events-none animate-aura-float" />
        <div className="absolute -bottom-36 -right-36 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none animate-aura-float [animation-delay:3.5s]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left copy matching reference image */}
            <div className="lg:col-span-5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-sm">
                Ask your fields. <br />
                <span className="text-[#7ac15c]">Get answers you can act on.</span>
              </h2>

              <p className="text-lg font-bold text-emerald-100 mt-4">
                KisanAI, the agentic AI layer for crop yield &amp; pest prediction.
              </p>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                Grounded in 15 years of verified field data, open-source Sentinel-2 satellite imagery, and ground soil sensors across 400+ crops.
              </p>
              <p className="text-emerald-200/80 text-sm mt-3 font-medium">
                No demo call. No sales gate. Instant field risk score. Sign up and Try for Free Now.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#00a3e0] hover:bg-[#0284c7] text-white font-semibold text-sm shadow-xl shadow-sky-950/40 hover:scale-105 active:scale-95 transition-all group"
                >
                  <span>Read more</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="cropin-btn cropin-btn-primary py-3.5 px-6 text-sm shadow-xl shadow-emerald-950/50 hover:scale-105 transition-all"
                >
                  <span>Connect Farm GPS</span>
                </button>
              </div>
            </div>

            {/* Right Interactive KisanAI Console (White Card) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:shadow-[0_25px_65px_rgba(0,0,0,0.35)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#7ac15c] animate-pulse" />
                  <span className="font-bold text-slate-900 text-sm">KisanAI Real-Time Field Telemetry Sandbox</span>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] bg-emerald-50 text-[#053b26] font-semibold px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-[#7ac15c] animate-ping" />
                  Sentinel-2 + Landsat Grid
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "Predict Wheat yield in Punjab with current rainfall anomaly",
                  "Check Yellow Rust & Aphid outbreak risk for Sector 4 over next 14 days",
                  "Generate localized drip irrigation schedule for black cotton soil",
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptSubmit(sample)}
                    className="text-xs bg-slate-50 hover:bg-[#7ac15c] hover:text-white text-slate-700 px-3.5 py-2 rounded-full border border-slate-200 hover:border-[#7ac15c] transition-all text-left hover:scale-105 active:scale-95 shadow-xs"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit(promptInput)}
                  placeholder="Ask your fields anything (e.g. wheat yield forecast, yellow rust risk, drip hours)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-full py-3.5 pl-5 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7ac15c] focus:bg-white transition-all"
                />
                <button
                  onClick={() => handlePromptSubmit(promptInput || "Wheat yield forecast Punjab")}
                  className="absolute right-2 p-2.5 rounded-full bg-[#7ac15c] text-white hover:bg-[#68ab4b] transition-transform hover:scale-105 active:scale-95"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {(isPromptLoading || promptResponse) && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-sm text-slate-800 leading-relaxed shadow-sm animate-in fade-in">
                  {isPromptLoading ? (
                    <div className="flex items-center gap-2 text-[#053b26]">
                      <div className="w-4 h-4 border-2 border-[#7ac15c] border-t-transparent rounded-full animate-spin" />
                      <span>Processing Sentinel-2 multispectral bands and localized weather telemetry...</span>
                    </div>
                  ) : (
                    <div>{promptResponse}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BODY SECTION 2: KISAN VIKAS IMPACT & FIELD ACCURACY (COUNTERS) */}
      {/* ============================================================ */}
      <section id="impact" className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Proven accuracy across diverse agro-climatic zones
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Empowering farmers and agricultural scientists by translating orbital satellite streams and soil sensor networks into localized, high-impact decisions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { stat: "30M+", label: "Acres monitored via Sentinel-2 & Landsat", color: "text-[#7ac15c]" },
              { stat: "94.2%", label: "Pest & disease prediction accuracy", color: "text-[#053b26]" },
              { stat: "+26.8%", label: "Average localized yield increase", color: "text-[#7ac15c]" },
              { stat: "82%", label: "Reduction in pesticide waste & chemical costs", color: "text-[#053b26]" },
              { stat: "35%", label: "Rise in net smallholder household profit", color: "text-[#7ac15c]", span: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group cursor-default ${
                  item.span ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <div className={`text-4xl sm:text-5xl font-black ${item.color} group-hover:scale-105 transition-transform duration-300 inline-block`}>
                  {item.stat}
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-700 leading-snug">
                  {item.label}
                </div>
                <div className="w-8 h-1 bg-[#7ac15c]/30 rounded-full mx-auto mt-4 group-hover:w-16 group-hover:bg-[#7ac15c] transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BODY SECTION 3: CORE ARCHITECTURE - 3 TECHNOLOGY PILLARS (LIGHT GREEN #7ac15c BG) */}
      {/* ============================================================ */}
      <section id="pillars" className="py-24 bg-emerald-50/50 border-b border-emerald-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#053b26] leading-tight">
              Kisan Vikas Core Architecture for Precision Agriculture
            </h2>
            <p className="text-[#053b26]/90 mt-3 text-sm sm:text-base font-medium max-w-2xl mx-auto">
              An end-to-end intelligence framework correlating orbital remote sensing, time-series meteorological forecasting, and crop-specific pathology models.
            </p>
          </div>

          <div className="space-y-12">
            {/* Block 1: Geospatial Satellite Analysis */}
            <div className="cropin-card bg-white p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 border border-white/60">
              <div className="lg:col-span-6">
                <div className="text-2xl font-black text-[#053b26] mb-3 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#7ac15c] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#053b26] transition-all duration-300">
                    <Satellite className="w-5 h-5 text-[#7ac15c]" />
                  </div>
                  <span>Geospatial Satellite Telemetry</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  Correlating open-source Sentinel-2 multispectral and Landsat thermal imagery
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  Continuous sub-hectare vegetation health analysis utilizing Normalized Difference Vegetation Index (NDVI) and Red-Edge chlorophyll bands to track crop vigor, canopy moisture deficit, and emergence uniformity.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="cropin-btn cropin-btn-dark text-sm py-2.5 px-6 group/btn shadow-md"
                >
                  <span>Explore Satellite Telemetry</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="lg:col-span-6 relative h-64 lg:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src="/images/satellite_farm_ai.jpg"
                  alt="Geospatial Satellite Telemetry"
                 
                 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#053b26] border border-emerald-300 shadow-sm animate-float-slow">
                  🛰️ Sentinel-2 10m NDVI Grid
                </div>
              </div>
            </div>

            {/* Block 2: Time-Series Climate & Soil Telemetry */}
            <div className="cropin-card bg-white p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 border border-white/60">
              <div className="lg:col-span-6 order-2 lg:order-1 relative h-64 lg:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src="/images/soil_weather_intelligence.jpg"
                  alt="Time-Series Soil & Climate Data"
                 
                 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#053b26] border border-emerald-300 shadow-sm animate-float-slow">
                  🌱 15-Year Weather & NPK Sensors
                </div>
              </div>
              <div className="lg:col-span-6 order-1 lg:order-2">
                <div className="text-2xl font-black text-[#053b26] mb-3 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#7ac15c] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#053b26] transition-all duration-300">
                    <Layers className="w-5 h-5 text-[#7ac15c]" />
                  </div>
                  <span>Time-Series Soil &amp; Climate Telemetry</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  Long-range yield forecasting trained on historical meteorological patterns
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  Fusing ground IoT soil sensors (NPK, pH, root-zone moisture at 15cm &amp; 30cm) with 15-year rainfall and temperature datasets. Our LSTM and gradient-boosted models predict harvest yield tonnage weeks before combine harvesters enter the field.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="cropin-btn cropin-btn-dark text-sm py-2.5 px-6 group/btn shadow-md"
                >
                  <span>View Yield Models</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Block 3: Crop-Specific Pest & Disease Risk Engine */}
            <div className="cropin-card bg-white p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 border border-white/60">
              <div className="lg:col-span-6">
                <div className="text-2xl font-black text-[#053b26] mb-3 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#7ac15c] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#053b26] transition-all duration-300">
                    <Cpu className="w-5 h-5 text-[#7ac15c]" />
                  </div>
                  <span>Crop-Specific Disease Risk &amp; Localized Advisory</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  14-Day advance warning windows for Yellow Rust, Blight &amp; Aphids
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  Micro-climate epidemiological algorithms calculate spore germination probabilities before visual leaf discoloration. Generates farmer-friendly SMS, WhatsApp, and dashboard advisories with precise organic bio-fungicide dosages and drip timing.
                </p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="cropin-btn cropin-btn-dark text-sm py-2.5 px-6 group/btn shadow-md"
                >
                  <span>Explore Pest Detection</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="lg:col-span-6 relative h-64 lg:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src="/images/pest_detection_ai.jpg"
                  alt="Crop Disease Risk Assessment"
                 
                 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#053b26] border border-emerald-300 shadow-sm animate-float-slow">
                  🛡️ 14-Day Epidemiological Risk Alert
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BODY SECTION 4: FOOTER CTA BANNER - KISAN VIKAS CALL TO ACTION */}
      {/* ============================================================ */}
      <section id="contact" className="relative py-20 bg-gradient-to-r from-[#053b26] via-[#074b32] to-[#042d1e] animate-gradient-shift text-white overflow-hidden">
        {/* Subtle grid and glowing aura background animations */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#7ac15c_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-[#7ac15c]/20 rounded-full blur-3xl pointer-events-none animate-aura-float" />
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#041a13]/70 rounded-full blur-3xl pointer-events-none animate-aura-float [animation-delay:4s]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold max-w-3xl mx-auto leading-tight">
            Empower Every Farmer with Predictable Yields &amp; Proactive Pest Defense
          </h2>
          <p className="mt-4 text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bridge the gap between advanced orbital satellite telemetry and on-the-ground farming decisions. Join progressive farmers and agronomists using Kisan Vikas today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="cropin-btn cropin-btn-primary py-3.5 px-8 text-base shadow-xl"
            >
              <span>Launch Farmer Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-3.5 h-3.5 fill-white">
                <path fillRule="evenodd" d="m194.5 21 179 179-19 19H26v-38h281.5L171 44.5zm70 240h48L254 319.5a2632 2632 0 0 1-59.5 58.5c-.6 0-6.2-5.2-24-23z"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. FOOTER & NEWSLETTER - KISAN VIKAS FOOTER (WHITE BG) */}
      {/* ============================================================ */}
      <footer id="about" className="bg-white border-t border-slate-200 pt-16 pb-12 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Newsletter Box */}
          <div className="p-8 rounded-3xl bg-[#f8fafc] border border-slate-200 mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#053b26]">
                Subscribe to <span className="text-[#7ac15c]">Kisan Vikas</span> Agri-Intelligence Briefs
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Receive weekly satellite soil moisture alerts, monsoon forecasts, and regional pest bulletins.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email or phone"
                className="w-full sm:w-80 px-5 py-3 rounded-full border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
              />
              <button
                onClick={() => alert("Dhanyawaad! You are now subscribed to Kisan Vikas farm advisories.")}
                className="cropin-btn cropin-btn-primary w-full sm:w-auto px-6 py-3 text-sm shadow-md hover:scale-105 transition-all"
              >
                Join Now
              </button>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#053b26] via-[#094d33] to-[#032618] p-2 flex items-center justify-center text-white border border-emerald-400/40 shadow-sm group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="32" cy="11" r="3.5" fill="#f59e0b" />
                    <path d="M32 54V38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                    <path d="M32 38C22 36 15 26 18 16C26 16 32 26 32 38Z" fill="#7ac15c" stroke="#ffffff" strokeWidth="1.5" />
                    <path d="M32 38C42 36 49 22 46 12C38 12 32 24 32 38Z" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <path d="M18 52C26 55 38 55 46 52" stroke="#7ac15c" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 font-bold text-2xl text-[#053b26]">
                  <span>Kisan</span>
                  <span className="text-[#7ac15c]">Vikas</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empowering farmers with AI-driven crop yield forecasting, satellite geospatial analysis, and localized pest outbreak prevention through a farmer-friendly dashboard.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4">
                Core AI Models
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Sub-Hectare Yield Predictor</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Yellow Rust &amp; Aphid Early Warning</a></li>
                <li><a href="#pillars" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Sentinel-2 Multispectral NDVI</a></li>
                <li><a href="#pillars" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Soil Moisture Telemetry</a></li>
                <li><a href="#pillars" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Precision Drip Irrigation Scheduling</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4">
                Supported Crops
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Wheat &amp; Paddy Rice</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Cotton &amp; Sugarcane</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Potato &amp; Tomato Horticulture</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Soybean &amp; Pulses</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Maize &amp; Millets</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4">
                Quick Access
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">About Kisan Vikas</a></li>
                <li><a href="#kisan_ai" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">KisanAI Field Sandbox</a></li>
                <li><a href="#impact" className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium">Model Verification Data</a></li>
                <li><button onClick={() => window.location.href = '/dashboard'} className="hover:text-[#7ac15c] hover:translate-x-1.5 transition-all inline-block font-medium text-left">Request Pilot Access</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>© {new Date().getFullYear()} Kisan Vikas Precision Agri-Intelligence Systems. Built for Indian Agriculture.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#7ac15c] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#7ac15c] transition-colors">Farmer Data Sovereignty</a>
              <a href="#" className="hover:text-[#7ac15c] transition-colors">Open Geospatial Standards</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* 5. MODAL: LAUNCH DASHBOARD / REQUEST FIELD PILOT */}
      {/* ============================================================ */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-bold text-[#7ac15c] uppercase tracking-wider">
                KISAN VIKAS AI PLATFORM
              </span>
              <h3 className="text-2xl font-black text-[#053b26] mt-1">
                Activate Your Farmer Dashboard
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Get real-time sub-hectare yield predictions, satellite NDVI telemetry, and 14-day pest outbreak warnings.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Farmer / Agronomist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (For WhatsApp Alerts)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="farmer@kisanvikas.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District &amp; State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ludhiana, Punjab"
                    value={formData.villageState}
                    onChange={(e) => setFormData({ ...formData, villageState: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Crop of Interest</label>
                <select
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7ac15c]"
                >
                  <option value="Wheat - Yield Forecast & Yellow Rust Alert">Wheat - Yield Forecast &amp; Yellow Rust Alert</option>
                  <option value="Paddy Rice - Blast & Brown Planthopper Advisory">Paddy Rice - Blast &amp; Brown Planthopper Advisory</option>
                  <option value="Cotton - Pink Bollworm Early Warning">Cotton - Pink Bollworm Early Warning</option>
                  <option value="Horticulture - Potato / Tomato Blight Risk">Horticulture - Potato / Tomato Blight Risk</option>
                  <option value="Multi-Crop Cooperative / Enterprise Monitoring">Multi-Crop Cooperative / Enterprise Monitoring</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formSubmitted}
                className="cropin-btn cropin-btn-primary w-full py-3 text-sm mt-2"
              >
                {formSubmitted ? "Connecting Your Farm..." : "Get Free Pilot Access"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL: SEARCH DIALOG */}
      {/* ============================================================ */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSearchModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search crops, pests, Sentinel-2 NDVI, soil parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-base focus:outline-none text-slate-800"
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Recommendations
              </div>
              {[
                { title: "Yellow Rust Epidemiological Prediction Model", link: "#kisan_ai" },
                { title: "Sentinel-2 Multi-Spectral Biomass NDVI Scouting", link: "#pillars" },
                { title: "Localized Sub-Hectare Wheat Yield Forecasting", link: "#kisan_ai" },
                { title: "Soil Moisture Gradient & Drip Irrigation Timing", link: "#pillars" },
              ]
                .filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    onClick={() => setSearchModalOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-[#053b26] transition-colors"
                  >
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}