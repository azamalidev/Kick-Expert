import React, { Suspense } from 'react';
import ClientSuccess from './ClientSuccess';

export const dynamic = 'force-dynamic';

function Fallback() {
  return (
    <div className="flex items-center justify-center px-4 py-24">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <p className="text-gray-600">Finalizing payment...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      {/* Client component uses useSearchParams and other client hooks */}
      <ClientSuccess />
    </Suspense>
  );
}
