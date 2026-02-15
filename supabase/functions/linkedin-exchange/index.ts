
// --- SUPABASE EDGE FUNCTION (DEPLOY TO SUPABASE) ---
// Use `supabase functions deploy linkedin-exchange`
// Add secrets via `supabase secrets set LINKEDIN_CLIENT_ID=... LINKEDIN_CLIENT_SECRET=...`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { code, redirect_uri } = await req.json()
    // Fix: Access Deno via globalThis to bypass "Cannot find name 'Deno'" errors in the local environment
    const deno = (globalThis as any).Deno;
    const supabase = createClient(
      deno.env.get('SUPABASE_URL') ?? '',
      deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get User from Authorization Header
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Exchange Code for Access Token
    // Fix: Use the deno reference retrieved via globalThis to avoid name resolution errors
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: deno.env.get('LINKEDIN_CLIENT_ID') ?? '',
        client_secret: deno.env.get('LINKEDIN_CLIENT_SECRET') ?? '',
        redirect_uri,
      }),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token exchange failed')

    // 3. Fetch LinkedIn Profile ID using UserInfo (OpenID Connect)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })
    const profileData = await profileResponse.json()
    const linkedinId = profileData.sub; // Unique LinkedIn Profile ID

    // 4. Update Supabase Profile Table
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        linkedin_token: tokenData.access_token,
        linkedin_profile_id: linkedinId,
        linkedin_connected: true,
        linkedin_token_expires_at: expiresAt.toISOString()
      })
      .eq('user_id', user.id)

    if (dbError) throw dbError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})