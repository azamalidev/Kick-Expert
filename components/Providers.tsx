'use client';

import { SupabaseProvider } from '@/lib/supabase/provider';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SupabaseProvider>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 2500,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 3000,
                    },
                    loading: {
                        duration: Infinity,
                    },
                }}
            />
            {children}
        </SupabaseProvider>
    );
}
