"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  User as UserIcon, 
  Save, 
  Loader2, 
  Linkedin, 
  ExternalLink, 
  CheckCircle, 
  Mail, 
  AlertCircle,
  ShieldCheck,
  Link as LinkIcon,
  Zap
} from 'lucide-react';
import { getSupabaseSettings, saveSettings } from '../lib/api';
import { generateLinkedInAuthUrl } from '../lib/linkedin';
import { User } from '../types';
import { supabase } from '../lib/supabase';

  const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: '',
    skills: [],
    topics: [],
    tone: 'Professional and Insightful',
    notifications: true,
    linkedInConnected: false
  });

  const fetchSettings = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || '00000000-0000-0000-0000-000000000000';
      setUserId(currentUserId);
      
      const data: any = await getSupabaseSettings(currentUserId);
      setFormData(prev => ({
        ...prev,
        ...data,
        name: authData?.user?.user_metadata?.full_name || data.name || 'User',
        email: data.email || authData?.user?.email || '',
        linkedInConnected: data.linkedInConnected || false
      }));
    } catch (e) {
      console.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
    if (searchParams.get('error')) {
      setError(searchParams.get('msg') || 'Failed to connect LinkedIn');
    }
  }, [searchParams]);

  const handleConnect = () => {
    // Generate OAuth URL and redirect
    if (!userId) {
      setError("User ID not found. Please refresh.");
      return;
    }
    const url = generateLinkedInAuthUrl(userId);
    window.location.href = url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your profile and account connections.</p>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Changes saved successfully!</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 pb-20">
          <Card title="Personal Profile">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 outline-none text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-500"
                    value={formData.email}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Connections" description="Link your LinkedIn account to enable automated posting.">
            <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.linkedInConnected ? 'bg-green-50' : 'bg-[#0077b5]/10'}`}>
                  <Linkedin className={`w-5 h-5 ${formData.linkedInConnected ? 'text-green-600' : 'text-[#0077b5]'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">LinkedIn Profile</p>
                  <p className="text-xs text-gray-500">
                    Status: {formData.linkedInConnected ? <span className="text-green-600 font-bold">Connected & Automated</span> : 'Not Linked'}
                  </p>
                </div>
              </div>
              <Button 
                variant={formData.linkedInConnected ? 'outline' : 'primary'} 
                size="sm" 
                type="button" 
                className="gap-2"
                onClick={handleConnect}
              >
                {formData.linkedInConnected ? 'Reconnect Profile' : 'Connect LinkedIn'}
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-700">
                You will be redirected to LinkedIn to authorize the Agent. An access token will be securely stored to automate your posts.
              </p>
            </div>
          </Card>

          <Card title="Expertise Context">
             <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 outline-none text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Topics (Comma Separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 outline-none text-sm"
                  value={formData.topics?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value.split(',').map(s => s.trim()) })}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-6">
            <Button size="lg" disabled={saving} className="min-w-[150px] gap-2 shadow-lg shadow-indigo-100">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
export default SettingsPage;