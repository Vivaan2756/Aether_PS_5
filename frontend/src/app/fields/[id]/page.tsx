import React from 'react';
import dynamic from 'next/dynamic';
import YieldCard from '@/components/dashboard/YieldCard';
import AdvisoryList from '@/components/dashboard/AdvisoryList';
import Link from 'next/link';

const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center border border-gray-200 text-gray-400">
      Loading Satellite Map...
    </div>
  )
});

export default function FieldDetailsPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link href="/" className="text-emerald-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Field #{params.id} Analysis</h1>
          <p className="text-gray-500 mt-1">Detailed telemetry and yield forecasting</p>
        </header>

        <div className="grid gap-8">
          <ParcelMap fieldName={`Field #${params.id}`} />

          <YieldCard forecast={4.8} lower={4.2} upper={5.4} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mock telemetry cards */}
            <div className="p-6 bg-white rounded-xl shadow border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-2">Soil Moisture</h3>
              <p className="text-3xl font-bold text-blue-600">32%</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-2">Nitrogen Level</h3>
              <p className="text-3xl font-bold text-orange-600">Low</p>
            </div>
          </div>

          <AdvisoryList advisories={[
            { level: 'high', message: 'Nitrogen levels are low. Consider top dressing.' },
            { level: 'medium', message: 'Expected rainfall next week. Delay irrigation.' }
          ]} />
        </div>
      </div>
    </main>
  );
}
