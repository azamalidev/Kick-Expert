'use client';

import { useEffect } from 'react';
import { SupabaseProvider } from '../lib/supabase/provider';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {

  }, []);

  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <Toaster position="top-center" />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}