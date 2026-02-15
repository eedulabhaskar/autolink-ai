
import { User, AgentJob } from '../types';
import { MOCK_USER, MOCK_JOBS } from '../constants';

const STORAGE_KEYS = {
  USER: 'autolink_user',
  JOBS: 'autolink_jobs'
};

export const getStoredUser = (): User => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : MOCK_USER;
};

export const saveUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getStoredJobs = (): AgentJob[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.JOBS);
  return stored ? JSON.parse(stored) : MOCK_JOBS;
};

export const saveJobs = (jobs: AgentJob[]) => {
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
};

export const addJob = (job: AgentJob) => {
  const jobs = getStoredJobs();
  const updated = [job, ...jobs];
  saveJobs(updated);
  return updated;
};
