import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kick Expert - Football Trivia',
  description: 'Test your football knowledge with Kick Expert trivia',
  icons: {
    icon: [
      {
        url: '/logo.png?v=1',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/logo.png?v=1',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/logo.png?v=1',
        sizes: 'any',
        type: 'image/png',
      },
    ],
    shortcut: '/logo.png?v=1',
    apple: '/logo.png?v=1',
  },
  openGraph: {
    title: 'Kick Expert - Football Trivia',
    description: 'Test your football knowledge with Kick Expert trivia',
    images: ['/logo.png?v=1'],
  },
};
