import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { competitionId, userId } = await req.json();

        if (!competitionId || !userId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        console.log(`🔧 Force activating registration for user ${userId} in competition ${competitionId}`);

        // Force update the registration to active
        const { data, error } = await supabase
            .from('competition_registrations')
            .update({
                status: 'confirmed', // ✅ Fixed: 'active' is invalid
                participation_status: 'entered',
                entered_at: new Date().toISOString()
            })
            .eq('competition_id', competitionId)
            .eq('user_id', userId)
            .select();

        if (error) {
            console.error('❌ Failed to activate registration:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('✅ Registration activated:', data);
        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('❌ Error in activate-registration:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
