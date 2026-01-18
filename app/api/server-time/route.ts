import { NextResponse } from "next/server";

// Returns the server's current timestamp
// Used by clients to synchronize their clocks with the server
export async function GET() {
    const serverTime = Date.now();

    return NextResponse.json({
        serverTime: serverTime,
        serverTimeISO: new Date(serverTime).toISOString()
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
    });
}
