import { NextRequest, NextResponse } from 'next/server';
import { exchangeEbayCode, setEbayUserToken } from '@/lib/ebay/client';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', req.url));
  }

  try {
    const token = await exchangeEbayCode(code);
    setEbayUserToken(token.access_token);

    // Store token in Supabase settings
    const supabase = createServerClient();
    await supabase.from('settings').upsert({
      key: 'ebay_tokens',
      value: {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(Date.now() + (token.expires_in || 7200) * 1000).toISOString(),
      },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL('/settings?ebay=connected', req.url));
  } catch (err) {
    console.error('[eBay Callback] Token exchange failed:', err);
    return NextResponse.redirect(new URL('/settings?error=token_failed', req.url));
  }
}
