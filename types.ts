
export type PlanType = 'starter' | 'professional' | 'brand-pro' | 'dev';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  features: string[];
  postLimit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  linkedInConnected: boolean;
  role?: string;
  skills?: string[];
  topics?: string[];
  tone?: string;
  notifications?: boolean;
  schedule?: ScheduleConfig[];
  // Fix: Added missing properties used in AgentStatusPage.tsx to track agent state
  agentActive?: boolean;
  agentStatus?: 'running' | 'paused' | 'error' | 'idle';
  lastAgentRun?: string;
}

export interface ScheduleConfig {
  day: string;
  time: string;
}

export type JobStatus = 'scheduled' | 'processing' | 'posted' | 'failed';

export interface AgentJob {
  id: string;
  userId: string;
  scheduledTime: string; // ISO string
  status: JobStatus;
  topic: string;
  type: 'text' | 'image' | 'carousel';
  generatedContent?: string;
  linkedInPostId?: string;
  error?: string;
}

export interface StatMetric {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down';
}
