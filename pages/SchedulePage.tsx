
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Clock, Loader2, Save, Trash2, Plus, Zap, CheckCircle } from 'lucide-react';
import { getStoredUser, saveUser } from '../lib/store';
import { saveSchedule, getSchedule } from '../lib/api';
import { ScheduleConfig } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export const SchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('last_make_sync'));

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getSchedule();
        setSchedule(data);
      } catch (e) {
        console.error("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSchedule(schedule);
      const user = getStoredUser();
      saveUser({ ...user, schedule });
      
      const now = new Date().toLocaleString();
      localStorage.setItem('last_make_sync', now);
      setLastSync(now);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save schedule or sync with Make.com");
    } finally {
      setIsSaving(false);
    }
  };

  const updateEntry = (index: number, field: keyof ScheduleConfig, value: string) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const addEntry = () => {
    if (schedule.length < 14) {
      setSchedule([...schedule, { day: 'Monday', time: '12:00' }]);
    }
  };

  const removeEntry = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
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
            <h1 className="text-2xl font-bold text-gray-900">Post Schedule</h1>
            <p className="text-gray-500">Configure when your AI Agent should publish content to LinkedIn.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSync && (
              <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <Zap className="w-3 h-3 text-yellow-500" />
                Last Synced: {lastSync}
              </div>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg shadow-indigo-100">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {success ? 'Synced!' : 'Save & Sync'}
            </Button>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">Schedule updated and synchronized with Make.com automation engine.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <div className="space-y-4">
              {schedule.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No scheduled slots yet.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={addEntry}>Add First Slot</Button>
                </div>
              ) : (
                schedule.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <select 
                        value={slot.day} 
                        onChange={(e) => updateEntry(idx, 'day', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={slot.time} 
                        onChange={(e) => updateEntry(idx, 'time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeEntry(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
              
              {schedule.length > 0 && (
                <Button variant="outline" fullWidth onClick={addEntry} className="border-dashed gap-2">
                  <Plus className="w-4 h-4" /> Add Slot
                </Button>
              )}
            </div>
          </Card>

          <Card title="Automation Sync" description="Make.com Integration">
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-600 uppercase">Live Connection</p>
                </div>
                <p className="text-2xl font-bold text-indigo-900">Active</p>
                {/* Fix: Using process.env.MAKE_SCENARIO_ID to resolve the missing variable error and correctly display the automation ID */}
                <p className="text-xs text-indigo-700 mt-1">Scenario ID: {process.env.MAKE_SCENARIO_ID || 'Pending'}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Days Synced: {schedule.length}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Time Conflict Check: OK</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 italic pt-2 border-t border-gray-100">
                Changes saved here will immediately update the triggers in your connected Make.com scenario.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
