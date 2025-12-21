import './globals.css';
import { metadata } from './metadata';
import Providers from '@/components/Providers';

export { metadata };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon - serve logo.png directly with cache busting */}
        <link rel="icon" href="/logo.png?v=2" type="image/png" sizes="any" />
        <link rel="icon" href="/logo.png?v=2" type="image/png" sizes="192x192" />
        <link rel="icon" href="/logo.png?v=2" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/logo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}