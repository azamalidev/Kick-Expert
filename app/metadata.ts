import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kick Expert - Football Trivia',
  description: 'Test your football knowledge with Kick Expert trivia',
  icons: {
    icon: [
      {
        url: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Kick Expert - Football Trivia',
    description: 'Test your football knowledge with Kick Expert trivia',
    images: ['/logo.png'],
  },
};
