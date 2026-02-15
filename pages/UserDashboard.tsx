
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Clock, CheckCircle, RefreshCw, FileText, Loader2, ArrowRight, Play, Square, Power } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getStoredUser } from '../lib/store';
import { getPosts, startAgent, stopAgent, getAgentStatus } from '../lib/api';
import { PLANS } from '../constants';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [user, setUser] = useState(getStoredUser());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(localStorage.getItem('agent_active') === 'true');
  const [loading, setLoading] = useState(true);

  const planInfo = PLANS.find(p => p.id === user.plan);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPosts(user.id);
      
      // Filter unique posted logs strictly using status and deduplicating by URL/Content
      const uniquePosted = data
        .filter((post: any) => post.status === 'posted')
        .reduce((acc: any[], current: any) => {
          const isDuplicate = acc.find(item => 
            (item.post_url && item.post_url === current.post_url) || 
            (item.content === current.content)
          );
          if (!isDuplicate) acc.push(current);
          return acc;
        }, []);

      setJobs(uniquePosted);
      const status = await getAgentStatus();
      setIsAgentActive(status.status === 'running');
    } catch (e) {
      console.error("Dashboard sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAgent = async () => {
    setIsSyncing(true);
    try {
      if (isAgentActive) {
        await stopAgent();
        setIsAgentActive(false);
      } else {
        await startAgent(user);
        setIsAgentActive(true);
        // Refresh after a short delay to see the initial post from Supabase
        setTimeout(fetchData, 1500);
      }
    } catch (error) {
      alert("Failed to update agent status.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-gray-500">
              Active on the <span className="font-bold text-indigo-600">{planInfo?.name || 'Starter'}</span> plan.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isAgentActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                <div className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isAgentActive ? 'AUTOMATION ACTIVE' : 'AUTOMATION PAUSED'}
             </div>
             <Button variant="outline" onClick={fetchData} disabled={loading}>
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>
        </div>

        {/* Master Control Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${isAgentActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-900 border-gray-200 shadow-xl'}`}>
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                 <div className={`p-4 rounded-xl ${isAgentActive ? 'bg-white/10' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Power className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-xl font-extrabold">{isAgentActive ? 'Your Agent is Active' : 'Start Your Personal Brand'}</h2>
                    <p className={`text-sm opacity-80 ${isAgentActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                       {isAgentActive ? 'Gemini is monitoring industry trends. Visit Activity Log for live posts.' : 'Enable automation to allow Gemini to post on your behalf.'}
                    </p>
                 </div>
              </div>
              <Button 
                variant={isAgentActive ? 'outline' : 'primary'} 
                size="lg" 
                className={`min-w-[200px] h-14 text-lg font-bold ${isAgentActive ? 'bg-white/10 hover:bg-white/20 border-white text-white' : 'shadow-xl shadow-indigo-100'}`}
                onClick={handleToggleAgent}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : isAgentActive ? <><Square className="w-5 h-5 mr-2" /> Stop Agent</> : <><Play className="w-5 h-5 mr-2" /> Enable Automation</>}
              </Button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center p-6 border-indigo-50">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mr-4">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Post Frequency</p>
              <p className="text-2xl font-bold text-gray-900">{user.schedule?.length || 0} Slots/Week</p>
            </div>
          </Card>
          <Card className="flex items-center p-6 border-green-50">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Published</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </Card>
          <Card className="flex items-center p-6 border-yellow-50">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Latest Insight</p>
              <p className="text-2xl font-bold text-gray-900">Analyzed</p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card title="Latest Published Posts" description="Verified successful posts pulled from your automation history.">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Post Content</th>
                  <th className="px-6 py-4">Date Published</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Syncing with Supabase...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No posts have been published yet. Enable automation to get started.</td></tr>
                ) : (
                  jobs.slice(0, 5).map((job: any) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-800">
                          Posted
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1 max-w-[350px]">{job.content}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {job.post_url ? (
                          <a 
                            href={job.post_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                          >
                             View Post <ArrowRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Syncing Link...</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 border-t pt-4">
             <Button variant="ghost" fullWidth size="sm" onClick={() => navigate('/app/logs')} className="text-indigo-600 gap-2">
                View Full Activity Log <FileText className="w-4 h-4" />
             </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
