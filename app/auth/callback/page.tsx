'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Get the session from URL fragments
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session?.user) {
                    // Update user's email confirmed status in your users table
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ email_confirmed: true })
                        .eq('id', session.user.id);

                    if (updateError) console.error(updateError);

                    toast.success('Email confirmed successfully! Please Login.');
                    router.push('/login?confirmed=true');
                } else {
                    throw new Error('No user session found');
                }
            } catch (error: any) {
                console.error('Auth callback error:', error);
                toast.error('Email confirmation failed. Please try again.');
                router.push('/login');
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Confirming your email...</h1>
                <p>Please wait while we verify your email address.</p>
            </div>
        </div>
    );
}