
export const LINKEDIN_CONFIG = {
  clientId: '86j7ddjv9w7b8m',
  // Redirect to the Node.js backend to handle the token exchange securely
  redirectUri: 'http://localhost:3000/api/linkedin/callback',
  scopes: ['openid', 'profile', 'email', 'w_member_social'],
};

export const generateLinkedInAuthUrl = (userId: string) => {
  // Encode userId in state to identify the user when LinkedIn calls back the server
  // We use a simple base64 encoding of a JSON object
  const statePayload = JSON.stringify({ 
    userId, 
    nonce: Math.random().toString(36).substring(2, 15) 
  });
  const state = btoa(statePayload);

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', LINKEDIN_CONFIG.clientId);
  url.searchParams.append('redirect_uri', LINKEDIN_CONFIG.redirectUri);
  url.searchParams.append('state', state);
  url.searchParams.append('scope', LINKEDIN_CONFIG.scopes.join(' '));

  return url.toString();
};
