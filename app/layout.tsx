'use client';

import { SupabaseProvider } from '../lib/supabase/provider';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { metadata } from './metadata';

function ClientWrapper({ children }: { children: React.ReactNode }) {

  return (
    <SupabaseProvider>
      <Toaster position="top-center" />
      {children}
    </SupabaseProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon - serve logo.png directly */}
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}