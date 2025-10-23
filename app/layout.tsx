'use client';

import { useEffect } from 'react';
import { SupabaseProvider } from '../lib/supabase/provider';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { metadata } from './metadata';

function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Update favicon dynamically only once on mount
    const updateFavicon = () => {
      try {
        // Check if favicon already exists
        const existingIcon = document.querySelector('link[rel="icon"]');
        if (existingIcon && existingIcon.getAttribute('href')?.includes('logo.png')) {
          return; // Favicon already set, don't update
        }

        // Remove old favicon links only if they're not our logo
        const existingIcons = document.querySelectorAll('link[rel*="icon"]');
        existingIcons.forEach(icon => {
          const href = icon.getAttribute('href');
          if (!href?.includes('logo.png')) {
            icon.remove();
          }
        });

        // Add new favicon with cache busting
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/logo.png?v=1';
        link.sizes = 'any';
        document.head.appendChild(link);

        // Add shortcut icon
        const shortcut = document.createElement('link');
        shortcut.rel = 'shortcut icon';
        shortcut.type = 'image/png';
        shortcut.href = '/logo.png?v=1';
        document.head.appendChild(shortcut);

        // Add apple touch icon
        const apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        apple.href = '/logo.png?v=1';
        document.head.appendChild(apple);
      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    // Run only once on mount
    updateFavicon();
  }, []);

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
        {/* Favicon with cache busting */}
        <link rel="icon" href="/logo.png?v=1" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png?v=1" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=1" />
        {/* Remove old favicon.ico if it exists */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🏆</text></svg>" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}