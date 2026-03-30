import { NextResponse } from 'next/server';
import { getEbayAuthUrl } from '@/lib/ebay/client';

export async function GET() {
  try {
    const authUrl = getEbayAuthUrl();
    return NextResponse.json({ auth_url: authUrl });
  } catch (err) {
    console.error('[eBay Auth] Error generating auth URL:', err);
    return NextResponse.json(
      { error: 'Failed to generate eBay auth URL' },
      { status: 500 }
    );
  }
}
