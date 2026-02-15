"use client";
import React, { useState, useRef } from 'react';
import { useNavigate } from 'next/router';
import { Upload, Briefcase, Linkedin, Calendar, CheckCircle2, ChevronRight, ChevronLeft, Loader2, FileText, AlertCircle, Clock, Zap, ShieldCheck, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/Layout';
import { saveUser, getStoredUser } from '../lib/store';
import { uploadResume, upsertProfile, syncSchedules, startAgent } from '../lib/api';
import { ScheduleConfig } from '../types';
import { supabase } from "../lib/supabase";

const STEPS = [
  { id: 'resume', title: 'Upload Resume' },
  { id: 'profile', title: 'Role & Skills' },
  { id: 'topics', title: 'Topics' },
  { id: 'connect', title: 'Connect LinkedIn' },
  { id: 'schedule', title: 'Schedule' },
  { id: 'enable', title: 'Review & Enable' },
];

  const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Topics specific state
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');

  const [formData, setFormData] = useState({
    role: '',
    skills: '',
    topics: [] as string[],
    linkedInConnected: false,
    resumeUploaded: false,
    resumeUrl: '',
    schedule: [
      { day: 'Monday', time: '09:00' },
      { day: 'Wednesday', time: '09:00' },
      { day: 'Friday', time: '10:00' },
    ] as ScheduleConfig[]
  });

  const handleNext = async () => {
    setError(null);

    if (currentStep === 0 && !formData.resumeUploaded) {
      setError("Please upload your resume to continue.");
      return;
    }
    if (currentStep === 1 && (!formData.role.trim() || !formData.skills.trim())) {
      setError("Please provide your role and skills.");
      return;
    }
    if (currentStep === 2 && formData.topics.length < 1) {
      setError("Please select or add at least 1 topic.");
      return;
    }
    if (currentStep === 3 && !formData.linkedInConnected) {
      setError("Please connect your LinkedIn account.");
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || '00000000-0000-0000-0000-000000000000';

      await upsertProfile({
        user_id: userId,
        role: formData.role,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        topics: formData.topics
      });

      await syncSchedules(userId, formData.schedule);
      
      await startAgent({ ...formData, id: userId });

      saveUser({
        ...getStoredUser(),
        role: formData.role,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        topics: formData.topics,
        schedule: formData.schedule,
        linkedInConnected: formData.linkedInConnected
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      setError("Failed to enable automation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
      setError(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setUploadProgress(0);
    setStatusText('Uploading...');
    try {
      const response = await uploadResume(file, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) setStatusText('Gemini is analyzing your expertise...');
      });

      const parsed = response.parsedData;
      setFormData(prev => ({
        ...prev,
        resumeUploaded: true,
        resumeUrl: response.url,
        role: parsed.role || prev.role,
        skills: (parsed.skills || []).join(', ') || prev.skills,
        // We don't auto-select topics yet, just prepare the suggestions
      }));
      setSuggestedTopics(parsed.suggestedTopics || []);
    } catch (err) {
      setError("Failed to process resume.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setFormData(prev => {
      const isSelected = prev.topics.includes(topic);
      return {
        ...prev,
        topics: isSelected 
          ? prev.topics.filter(t => t !== topic) 
          : [...prev.topics, topic]
      };
    });
  };

  const addCustomTopic = () => {
    const trimmed = customTopic.trim();
    if (trimmed && !formData.topics.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, trimmed]
      }));
      setCustomTopic('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center py-6">
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${formData.resumeUploaded ? 'bg-green-50' : 'bg-indigo-50'}`}>
              {loading ? <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /> : formData.resumeUploaded ? <CheckCircle2 className="w-10 h-10 text-green-600" /> : <Upload className="w-10 h-10 text-indigo-600" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Resume Context</h3>
            <p className="text-gray-500 mb-8 max-sm mx-auto">Gemini uses your resume to generate posts that sound exactly like you.</p>
            <div className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${formData.resumeUploaded ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-indigo-400'}`} onClick={() => !loading && fileInputRef.current?.click()}>
              {loading ? (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-indigo-600 mb-2">{statusText}</span>
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : formData.resumeUploaded ? (
                <div className="flex flex-col items-center text-green-700">
                  <FileText className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">Resume Analyzed & Data Extracted</span>
                  <p className="text-xs mt-1 text-green-600 opacity-70">We've pre-filled the next steps for you.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <p className="font-medium mb-1 text-gray-900">Upload PDF / DOCX</p>
                  <Button variant="outline" size="sm" className="mt-4">Choose File</Button>
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 mb-4">
              <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 leading-relaxed">
                We've extracted these details from your resume. Please verify or update them to reflect your LinkedIn branding goals.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Designation</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Skills & Expertise</label>
              <textarea 
                placeholder="e.g. React, Node.js, AWS, System Design"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                value={formData.skills} 
                onChange={(e) => setFormData({...formData, skills: e.target.value})} 
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-bold text-gray-900 text-lg">Choose Your Content Topics</h3>
            
            {suggestedTopics.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">AI suggested topics based on your resume:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTopics.map(topic => (
                    <button 
                      key={topic} 
                      type="button"
                      onClick={() => toggleTopic(topic)} 
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.topics.includes(topic) 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' 
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                <p className="text-sm italic">No suggested topics found. Please add your own below.</p>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Add Custom Topic</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                  placeholder="e.g. Remote Work Culture"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Button variant="secondary" onClick={addCustomTopic} disabled={!customTopic.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              
              {formData.topics.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Selected for Automation:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.topics.map(t => (
                      <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                        {t}
                        <button onClick={() => toggleTopic(t)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center py-10 animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${formData.linkedInConnected ? 'bg-green-50' : 'bg-[#0077b5]/10'}`}>
              <Linkedin className={`w-10 h-10 ${formData.linkedInConnected ? 'text-green-600' : 'text-[#0077b5]'}`} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">LinkedIn Bridge</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">Connecting your account allows Gemini to post directly on your behalf.</p>
            <Button size="lg" className={`${formData.linkedInConnected ? 'bg-green-600' : 'bg-[#0077b5]'} shadow-lg`} onClick={() => setFormData({...formData, linkedInConnected: true})} disabled={formData.linkedInConnected}>
              {formData.linkedInConnected ? 'Account Linked Successfully' : 'Connect LinkedIn Account'}
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-fade-in">
             <p className="text-sm text-gray-500 mb-4 font-medium">Review your automated posting windows:</p>
             {formData.schedule.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="flex-1 font-bold text-gray-800">{slot.day}</span>
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-indigo-600 font-extrabold text-sm">{slot.time}</span>
                </div>
              ))}
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-800">
                <ShieldCheck className="w-4 h-4 inline mr-1" />
                You can fully customize this schedule later in the Dashboard settings.
              </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <Zap className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-extrabold text-indigo-900">Automation Ready</h3>
              <p className="text-sm text-indigo-700 mt-2">By clicking below, your AI agent will activate and post its first entry to LinkedIn immediately based on your resume data.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-gray-700">Safety Guard On</span>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-gray-700">Role Verified</span>
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleCompleteOnboarding} disabled={loading} className="h-16 text-lg font-bold shadow-xl shadow-indigo-100">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <PlayIcon className="w-6 h-6 mr-2" />}
              Enable & Launch Automation
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <Card className="shadow-2xl border-indigo-50 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Onboarding Progress</span>
               <span className="text-sm font-bold text-indigo-600">{STEPS[currentStep].title}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>
          
          <div className="p-8 min-h-[400px]">
            {renderStepContent()}
            {error && <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-shake"><AlertCircle className="w-5 h-5" />{error}</div>}
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || loading} className="font-bold">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {currentStep < STEPS.length - 1 && (
              <Button onClick={handleNext} disabled={loading} className="font-bold min-w-[140px] shadow-md">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
export default Onboarding;
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
);
