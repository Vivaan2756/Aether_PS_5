'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';
import Header from '@/components/pest-risk/Header';
import FarmContextCard from '@/components/pest-risk/FarmContextCard';
import MainRiskCard from '@/components/pest-risk/MainRiskCard';
import ShapContributionCard from '@/components/pest-risk/ShapContributionCard';
import EnvironmentalGrid from '@/components/pest-risk/EnvironmentalGrid';
import SatelliteHealthSection from '@/components/pest-risk/SatelliteHealthSection';
import SoilAndProvenanceCards from '@/components/pest-risk/SoilAndProvenanceCards';
import FieldMapCard from '@/components/pest-risk/FieldMapCard';
import FieldRecommendations from '@/components/pest-risk/FieldRecommendations';
import DataStatusBar from '@/components/pest-risk/DataStatusBar';
import FieldSelectorModal from '@/components/pest-risk/FieldSelectorModal';
import LoadingSkeleton from '@/components/pest-risk/LoadingSkeleton';
import { FarmerPredictRequest, PestRiskResponse, predictPestRisk } from '@/lib/pestRiskApi';

const DEFAULT_REQUEST: FarmerPredictRequest = {
  latitude: 29.0588,
  longitude: 76.0856,
  crop: 'Wheat',
  crop_stage: 'Vegetative',
  previous_pest_incidence: 1,
};

export default function PestRiskPage() {
  const [requestParams, setRequestParams] = useState<FarmerPredictRequest>(DEFAULT_REQUEST);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PestRiskResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchPrediction = async (params: FarmerPredictRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await predictPestRisk(params);
      setResult(response);
      setRequestParams(params);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while analyzing real environmental data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial prediction on validated agricultural coordinate
  useEffect(() => {
    fetchPrediction(DEFAULT_REQUEST);
  }, []);

  const handleModalSubmit = (newParams: FarmerPredictRequest) => {
    setIsModalOpen(false);
    fetchPrediction(newParams);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 1. Header */}
        <Header
          onOpenSelector={() => setIsModalOpen(true)}
          isLoading={isLoading}
          hasResult={result !== null}
        />

        {/* Error Alert Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-950">
                Environmental Telemetry Unavailable
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed">{error}</p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-50 transition-colors shadow-2xs"
                >
                  Select another agricultural location
                </button>
                <button
                  type="button"
                  onClick={() => fetchPrediction(requestParams)}
                  className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Farm Context Bar */}
        <FarmContextCard
          crop={result?.crop || requestParams.crop}
          cropStage={result?.crop_stage || requestParams.crop_stage}
          latitude={result?.location.latitude || requestParams.latitude}
          longitude={result?.location.longitude || requestParams.longitude}
          previousPestIncidence={requestParams.previous_pest_incidence}
          onOpenSelector={() => setIsModalOpen(true)}
        />

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Dashboard Content */}
        {!isLoading && result && (
          <div className="space-y-6">
            {/* 3. Main 2-Column Analytics Section (Risk Card + SHAP Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <MainRiskCard data={result} />
              <ShapContributionCard factors={result.top_factors} />
            </div>

            {/* 4. Environmental Conditions Grid */}
            <EnvironmentalGrid data={result.environmental_data} />

            {/* 5. Satellite Vegetation Health Section */}
            <SatelliteHealthSection
              data={result.environmental_data}
              satelliteSource={result.data_sources.satellite}
            />

            {/* 6. Soil Conditions & Satellite Provenance */}
            <SoilAndProvenanceCards
              soilData={{
                soil_ph: result.environmental_data.soil_ph,
                soil_nitrogen: result.environmental_data.soil_nitrogen,
                soil_moisture: result.environmental_data.soil_moisture,
              }}
              dataSources={result.data_sources}
            />

            {/* 7. Field Location Map & Field Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <FieldMapCard
                latitude={result.location.latitude}
                longitude={result.location.longitude}
                crop={result.crop}
                riskLevel={result.risk_level}
                percentage={result.risk_percentage}
              />
              <FieldRecommendations
                recommendations={result.recommendations}
                riskLevel={result.risk_level}
              />
            </div>

            {/* 8. Data Status Bar */}
            <DataStatusBar dataSources={result.data_sources} hasResult={true} />
          </div>
        )}

        {/* Footer Disclaimer & Architecture Disclosure */}
        <footer className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">
            Aether Precision Pest Risk Intelligence Platform
          </p>
          <p className="text-[11px] text-slate-400">
            Real environmental data ingested from Open-Meteo Weather, Copernicus Sentinel-2 STAC L2A, and ISRIC SoilGrids. Outbreak classifier evaluated via XGBoost with TreeSHAP factor attributions.
          </p>
        </footer>
      </div>

      {/* Field Selector Modal */}
      <FieldSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isLoading={isLoading}
        currentValues={requestParams}
      />
    </div>
  );
}
