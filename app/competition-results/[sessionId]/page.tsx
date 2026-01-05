import { Suspense } from 'react';
import CompetitionResults from '@/components/CompetitionResults';

export default async function CompetitionResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading competition results...</p>
        </div>
      </div>
    }>
      <CompetitionResults sessionId={sessionId} />
    </Suspense>
  );
}
