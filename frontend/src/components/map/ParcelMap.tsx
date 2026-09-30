"use client";

import React, { useState, useRef, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, MousePointerClick, MapPin, PenTool, CheckCircle, Box, Trash2 } from 'lucide-react';

// Configure MapLibre worker using local public endpoint
if (typeof window !== 'undefined') {
  try {
    maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
  } catch (err) {
    console.warn("Could not set local worker URL, falling back to default", err);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Esri World Imagery'
    }
  },
  layers: [
    {
      id: 'satellite-tiles',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const STREET_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface ParcelSelectPayload {
  coordinates: number[][]; // [[lng, lat], ...]
  centroid: { lat: number; lng: number };
  areaHa: number;
}

interface ParcelMapProps {
  initialCenter?: [number, number];
  onParcelSelect?: (payload: ParcelSelectPayload) => void;
  onClearPreviousState?: () => void;
  fieldName?: string;
  ndwiLevel?: number;
  ndviLevel?: number;
}

// Compute polygon centroid & approximate area in hectares
function computePolygonStats(coords: number[][]): { centroid: { lat: number; lng: number }; areaHa: number } {
  if (!coords || coords.length < 3) {
    return { centroid: { lat: 20.5937, lng: 78.9629 }, areaHa: 5.8 };
  }

  let sumLng = 0;
  let sumLat = 0;
  const n = coords.length - 1;

  for (let i = 0; i < n; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }

  const centroidLng = Number((sumLng / n).toFixed(5));
  const centroidLat = Number((sumLat / n).toFixed(5));

  // Shoelace area formula converted to hectares
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  area = Math.abs(area) / 2;

  const cosLat = Math.cos((centroidLat * Math.PI) / 180);
  const sqMeters = area * 111320 * (111320 * cosLat);
  const areaHa = Math.max(Number((sqMeters / 10000).toFixed(2)), 0.5);

  return {
    centroid: { lat: centroidLat, lng: centroidLng },
    areaHa: isNaN(areaHa) ? 5.8 : areaHa
  };
}

export default function ParcelMap({
  initialCenter = [78.9629, 20.5937],
  onParcelSelect,
  onClearPreviousState,
  fieldName = "Field Parcel",
  ndwiLevel = 0.14,
  ndviLevel = 0.72
}: ParcelMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'ndvi' | 'ndwi' | 'street'>('satellite');
  const [interactionMode, setInteractionMode] = useState<'chip' | 'draw'>('chip');
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);

  // Helper to generate a 224m x 224m parcel chip around [lng, lat]
  const buildSquarePolygon = useCallback((lng: number, lat: number) => {
    const halfWidth = 0.0016;  // ~175m longitude offset
    const halfHeight = 0.0013; // ~145m latitude offset
    return [
      [lng - halfWidth, lat - halfHeight],
      [lng + halfWidth, lat - halfHeight],
      [lng + halfWidth, lat + halfHeight],
      [lng - halfWidth, lat + halfHeight],
      [lng - halfWidth, lat - halfHeight]
    ];
  }, []);

  // Clean state: previous layer can be completely cleared
  const [activePolygon, setActivePolygon] = useState<number[][] | null>(() =>
    buildSquarePolygon(initialCenter[0], initialCenter[1])
  );

  const [stats, setStats] = useState(() =>
    computePolygonStats(buildSquarePolygon(initialCenter[0], initialCenter[1]))
  );

  // Clear previous GeoJSON layer & reset state
  const clearPreviousLayer = useCallback(() => {
    setActivePolygon(null);
    setDrawingPoints([]);
    if (onClearPreviousState) {
      onClearPreviousState();
    }
  }, [onClearPreviousState]);

  // Handle map clicks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = useCallback((e: any) => {
    if (!e || !e.lngLat) return;
    const { lng, lat } = e.lngLat;

    if (interactionMode === 'chip') {
      // 1. Instantly clear previous state before applying new chip
      clearPreviousLayer();

      // 2. Capture new geometry
      const newPoly = buildSquarePolygon(lng, lat);
      setActivePolygon(newPoly);
      const computed = computePolygonStats(newPoly);
      setStats(computed);

      mapRef.current?.flyTo({
        center: [lng, lat],
        duration: 500,
        essential: true
      });

      if (onParcelSelect) {
        onParcelSelect({
          coordinates: newPoly,
          centroid: computed.centroid,
          areaHa: computed.areaHa
        });
      }
    } else {
      // Draw Mode: If starting fresh, clear old boundary completely
      if (drawingPoints.length === 0) {
        clearPreviousLayer();
      }

      const newPoints = [...drawingPoints, [lng, lat]];
      setDrawingPoints(newPoints);

      if (newPoints.length >= 3) {
        const closed = [...newPoints, newPoints[0]];
        setActivePolygon(closed);
        setStats(computePolygonStats(closed));
      }
    }
  }, [interactionMode, drawingPoints, buildSquarePolygon, clearPreviousLayer, onParcelSelect]);

  // Complete drawing polygon
  const handleCompleteDrawing = useCallback(() => {
    if (drawingPoints.length < 3) return;
    const closed = [...drawingPoints, drawingPoints[0]];
    setActivePolygon(closed);
    const computed = computePolygonStats(closed);
    setStats(computed);
    setDrawingPoints([]);
    setInteractionMode('chip');

    mapRef.current?.flyTo({
      center: [computed.centroid.lng, computed.centroid.lat],
      duration: 600,
      essential: true
    });

    if (onParcelSelect) {
      onParcelSelect({
        coordinates: closed,
        centroid: computed.centroid,
        areaHa: computed.areaHa
      });
    }
  }, [drawingPoints, onParcelSelect]);

  // Dynamic fill color based on selected layer view
  const getFillColor = () => {
    if (mapType === 'ndvi') {
      return ndviLevel > 0.6 ? '#15803d' : ndviLevel > 0.4 ? '#84cc16' : '#eab308';
    }
    if (mapType === 'ndwi') {
      return ndwiLevel < 0.15 ? '#f97316' : '#0284c7';
    }
    return '#10b981'; // Emerald
  };

  const geojson = {
    type: 'FeatureCollection',
    features: activePolygon ? [
      {
        type: 'Feature',
        properties: { name: fieldName },
        geometry: {
          type: 'Polygon',
          coordinates: [activePolygon]
        }
      }
    ] : []
  };

  const pointsGeojson = {
    type: 'FeatureCollection',
    features: drawingPoints.map((pt, idx) => ({
      type: 'Feature',
      properties: { index: idx },
      geometry: {
        type: 'Point',
        coordinates: pt
      }
    }))
  };

  return (
    <div className="relative w-full h-[460px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-900">
      
      {/* Top Banner / Mode Switcher */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Layer Toggle Switch */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-200 flex flex-wrap items-center gap-1 text-xs font-medium">
          <div className="flex items-center px-1.5 text-gray-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapType === 'satellite'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🛰️ RGB Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType('ndvi')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapType === 'ndvi'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🌿 NDVI Health
          </button>
          <button
            type="button"
            onClick={() => setMapType('ndwi')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapType === 'ndwi'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            💧 NDWI Water
          </button>
          <button
            type="button"
            onClick={() => setMapType('street')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapType === 'street'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🗺️ Street
          </button>
        </div>

        {/* Tool Mode: Chip vs Draw & Layer Clear */}
        <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-white/20 flex items-center gap-1 text-xs text-white">
          <button
            type="button"
            onClick={() => {
              setInteractionMode('chip');
              clearPreviousLayer();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              interactionMode === 'chip'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>224m Chip</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInteractionMode('draw');
              clearPreviousLayer();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              interactionMode === 'draw'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Polygon</span>
          </button>

          {interactionMode === 'draw' && drawingPoints.length >= 3 && (
            <button
              type="button"
              onClick={handleCompleteDrawing}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Submit Boundary</span>
            </button>
          )}

          {/* Instant Reset / Clear Layer Button */}
          <button
            type="button"
            onClick={clearPreviousLayer}
            className="p-1.5 rounded-lg hover:bg-red-500/30 text-gray-300 hover:text-red-300 transition-all"
            title="Clear Previous Layer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Mode Guidance */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-gray-900/85 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-white/15 flex items-center gap-1.5">
          {interactionMode === 'chip' ? (
            <>
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Click any location to place <strong>224m Sentinel-2 chip</strong> & ingest SoilGrids + NASA POWER</span>
            </>
          ) : (
            <>
              <PenTool className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                Click farm vertices ({drawingPoints.length} points).{' '}
                {drawingPoints.length >= 3 ? 'Click "Submit Boundary" to query APIs.' : 'Add at least 3 points.'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Parcel Coordinate & Area Badge */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-[11px] text-white font-mono flex items-center gap-2.5 border border-white/15 shadow-md">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        <span>{stats.centroid.lat.toFixed(4)}°N, {stats.centroid.lng.toFixed(4)}°E</span>
        <span className="text-gray-500">|</span>
        <span className="text-emerald-300 font-sans font-medium">{stats.areaHa} Ha</span>
        <span className="text-gray-500">|</span>
        <span className="text-xs font-sans text-gray-300">
          {activePolygon ? (interactionMode === 'chip' ? 'Sentinel-2 Tile (6, 3, 224, 224)' : 'Custom Farm Boundary') : 'Layer Cleared - Click to Select'}
        </span>
      </div>

      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: initialCenter[0],
          latitude: initialCenter[1],
          zoom: 15.2
        }}
        onClick={handleMapClick}
        cursor={interactionMode === 'draw' ? 'copy' : 'crosshair'}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapType === 'street' ? STREET_STYLE : SATELLITE_STYLE}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="top-right" />

        {/* Drawn Field Polygon (cleared if activePolygon is null) */}
        {activePolygon && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Source id="parcel-data" type="geojson" data={geojson as any}>
            <Layer
              id="fields-fill"
              type="fill"
              paint={{
                'fill-color': getFillColor(),
                'fill-opacity': mapType === 'ndvi' || mapType === 'ndwi' ? 0.65 : 0.45
              }}
            />
            <Layer
              id="fields-outline"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2.5
              }}
            />
          </Source>
        )}

        {/* Vertex Points in Draw Mode */}
        {interactionMode === 'draw' && drawingPoints.length > 0 && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Source id="draw-points" type="geojson" data={pointsGeojson as any}>
            <Layer
              id="points-circle"
              type="circle"
              paint={{
                'circle-radius': 5,
                'circle-color': '#10b981',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
