
import { parseResume, generateLinkedInPost } from './gemini';
import { ScheduleConfig, AgentJob, User } from '../types';
import { supabase } from './supabase';
import { MOCK_JOBS } from '../constants';

// We now use the local backend proxy to trigger Make.com to avoid CORS errors in browser
// Ensure your server.js is running on port 3000
const PROXY_TRIGGER_URL = 'http://localhost:3000/api/trigger-make';

export interface UploadResponse {
  url: string;
  parsedData: {
    role: string;
    skills: string[];
    summary?: string;
    suggestedTopics: string[];
  };
}

export interface AgentStatusResponse {
  status: 'running' | 'paused' | 'error' | 'idle';
  lastRun: string | null;
  healthScore: number;
}

export const upsertProfile = async (profileData: {
  user_id: string;
  role: string;
  skills: string[];
  topics: string[];
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: profileData.user_id,
      role: profileData.role,
      skills: profileData.skills.join(', '), 
      topics: profileData.topics.join(', ')
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return data;
};

/**
 * UPDATED: Saves LinkedIn connection data and ensures email is not NULL.
 */
export const updateLinkedInConnection = async (userId: string, email: string, profileUrl: string, token: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      email: email,                  // Save email to prevent NULL in DB
      linkedin_profile_url: profileUrl, // Saves Profile URL
      linkedin_token: token,           // Saves Login Access (Password/Token) as requested
      linkedin_connected: true         // Sets Connected to true
    })
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const getSupabaseSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.warn("No profile found for user.");
    return {};
  }

  return {
    email: data.email || '',
    role: data.role || '',
    skills: data.skills ? data.skills.split(', ').filter(Boolean) : [],
    topics: data.topics ? data.topics.split(', ').filter(Boolean) : [],
    linkedin_profile_url: data.linkedin_profile_url,
    linkedin_token: data.linkedin_token,
    linkedInConnected: data.linkedin_connected || false
  };
};

export const syncSchedules = async (userId: string, schedules: ScheduleConfig[]) => {
  await supabase.from('schedules').delete().eq('user_id', userId);
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedules.map(s => ({ user_id: userId, day: s.day, time: s.time })));
  if (error) throw error;
  return data;
};

export const getSupabasePosts = async (userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return MOCK_JOBS.map(job => ({
      id: job.id,
      content: job.generatedContent || `Discussion on ${job.topic}`,
      post_url: job.linkedInPostId ? `https://linkedin.com/feed/update/${job.linkedInPostId}` : '',
      status: job.status,
      created_at: job.scheduledTime
    }));
  }
  return data;
};

/**
 * TRIGGER AUTOMATION & CREATE INITIAL POST
 * Sends payload to Make.com including the credentials stored in linkedin_token.
 * Uses backend proxy to avoid CORS errors.
 */
export const startAgent = async (userData: any): Promise<{ success: boolean }> => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || userData?.id || '00000000-0000-0000-0000-000000000000';
  const email = authData?.user?.email || userData?.email || 'dev@autolink.ai';

  try {
    // Fetch latest profile from DB
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();

    const payload = {
      user_id: userId,
      email: profile?.email || email,
      role: profile?.role || userData?.role || "Professional",
      skills: profile?.skills ? profile.skills.split(', ') : (userData?.skills || []),
      topics: profile?.topics ? profile.topics.split(', ') : (userData?.topics || []),
      linkedin_url: profile?.linkedin_profile_url,
      linkedin_token: profile?.linkedin_token, // This contains the Token
      status: "active",
      timestamp: new Date().toISOString()
    };

    // 1. Update status in Database (This is the source of truth)
    await supabase.from('profiles').update({ status: 'active' }).eq('user_id', userId);
    
    // Update local storage status
    localStorage.setItem('agent_active', 'true');
    localStorage.setItem('agent_last_run', new Date().toISOString());

    // 2. Trigger Make.com Webhook via Proxy
    try {
      const response = await fetch(PROXY_TRIGGER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });
      
      if (!response.ok) {
         console.warn("Automation trigger warning:", response.status);
      }
    } catch (networkError) {
      console.warn("Proxy connection failed. Ensure server.js is running on port 3000.", networkError);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Agent Start Critical Error:", error);
    throw error;
  }
};

export const stopAgent = async (): Promise<{ success: boolean }> => {
  localStorage.setItem('agent_active', 'false');
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from('profiles').update({ status: 'paused' }).eq('user_id', user.id);
  return { success: true };
};

export const getAgentStatus = async (): Promise<AgentStatusResponse> => {
  const isActive = localStorage.getItem('agent_active') === 'true';
  return {
    status: isActive ? 'running' : 'paused',
    lastRun: localStorage.getItem('agent_last_run'),
    healthScore: 100
  };
};

export const createOrder = async (orderData: { user_email: string; user_name: string; plan_id: string; amount: number; }) => {
  const { data, error } = await supabase.from('orders').insert([orderData]);
  if (error) throw error;
  return data;
};

export const uploadResume = async (file: File, onProgress?: (p: number) => void): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (onProgress) onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        parseResume(`Extracted text from ${file.name}`)
          .then(parsed => resolve({ url: 'demo-url', parsedData: parsed }))
          .catch(reject);
      }
    }, 150);
  });
};

export const getPosts = getSupabasePosts;
export const getSettings = () => getSupabaseSettings('00000000-0000-0000-0000-000000000000');
export const saveSettings = async (settings: any) => {
  const { data: authData } = await supabase.auth.getUser();
  return upsertProfile({
    user_id: authData?.user?.id || '00000000-0000-0000-0000-000000000000',
    role: settings.role,
    skills: settings.skills || [],
    topics: settings.topics || []
  });
};
export const getLogs = async () => [];
export const getSchedule = async () => [];
export const saveSchedule = async (s: any) => ({ success: true });
export const saveTopics = async (t: any) => ({ success: true });
export const saveProfile = async (r: any, s: any) => ({ success: true });
export const connectLinkedIn = async () => ({ success: true });
