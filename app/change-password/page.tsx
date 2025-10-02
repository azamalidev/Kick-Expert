"use client";

import { Suspense } from 'react';
import ChangePassword from '@/components/ChangePassword';

export default function ChangePasswordPage() {
  return (
    <div className="px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ChangePassword />
      </Suspense>
    </div>
  );
}
 
