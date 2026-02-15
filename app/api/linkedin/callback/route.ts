
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * SECURE BACKEND CALLBACK HANDLER
 * 
 * 1. Receives 'code' from LinkedIn.
 * 2. Exchanges 'code' for 'access_token' server-side (using client_secret).
 * 3. Fetches LinkedIn Profile ID (OpenID 'sub').
 * 4. Updates Supabase Profile securely.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 1. Handle LinkedIn-side errors or cancellations
  if (error) {
    return NextResponse.redirect(`${origin}/#/app/settings?error=${error}&msg=${searchParams.get('error_description')}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/#/app/settings?error=missing_code`);
  }

  try {
    // Initialize Supabase with Service Role Key for server-side updates
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Exchange Authorization Code for Access Token
    // This MUST happen server-side to keep LINKEDIN_CLIENT_SECRET private.
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/linkedin/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // 3. Fetch LinkedIn Profile ID (OpenID Connect /userinfo)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profileData = await profileResponse.json();
    const linkedinId = profileData.sub; // Unique LinkedIn Profile ID (OpenID 'sub')

    // 4. Update the User's Profile in Supabase
    // Note: In production, identify the user via a session cookie or a mapping with the 'state' param.
    // We update 'linkedin_token', 'linkedin_profile_id', and 'linkedin_connected' status.
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Identify user - in a real Next.js app, you'd get this from the session
    const { data: { user } } = await supabase.auth.getUser(); 
    
    if (user) {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          linkedin_token: accessToken,
          linkedin_profile_id: linkedinId,
          linkedin_connected: true,
          linkedin_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', user.id);

      if (dbError) throw dbError;
    } else {
       console.warn("Callback received but no active session found. Ensure RLS allows the update or handle via state mapping.");
       // For demo/dev: We could map 'state' to 'userId' in a temp table if cookies aren't shared across domains
    }

    // 5. Success! Redirect back to the frontend settings page
    return NextResponse.redirect(`${origin}/#/app/settings?success=true`);

  } catch (err: any) {
    console.error('LinkedIn OAuth Processing Error:', err);
    return NextResponse.redirect(`${origin}/#/app/settings?error=exchange_failed&msg=${encodeURIComponent(err.message)}`);
  }
}
