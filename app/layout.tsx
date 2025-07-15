'use client';

import { useEffect } from 'react';
import { SupabaseProvider } from '../lib/supabase/provider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {

  }, []);

  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}