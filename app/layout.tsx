'use client';

import { useEffect } from 'react';
import { SupabaseProvider } from '../lib/supabase/provider';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Update favicon dynamically
    const updateFavicon = () => {
      // Remove existing favicons
      const existingIcons = document.querySelectorAll('link[rel*="icon"]');
      existingIcons.forEach(icon => icon.remove());

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = '/logo.png';
      document.head.appendChild(link);

      // Add shortcut icon
      const shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      shortcut.type = 'image/png';
      shortcut.href = '/logo.png';
      document.head.appendChild(shortcut);

      // Add apple touch icon
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = '/logo.png';
      document.head.appendChild(apple);
    };

    updateFavicon();
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Kick Expert - Football Trivia</title>
      </head>
      <body>
        <SupabaseProvider>
          <Toaster position="top-center" />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}