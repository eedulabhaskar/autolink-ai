
import React, { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, CreditCard, Activity, LayoutDashboard, Search, Filter, 
  MoreVertical, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, 
  ExternalLink, UserCheck, Zap, Bot
} from 'lucide-react';

// --- MOCK DATA ---
const REVENUE_DATA = [
  { name: 'Mon', posts: 120, revenue: 1400 },
  { name: 'Tue', posts: 145, revenue: 1600 },
  { name: 'Wed', posts: 160, revenue: 1900 },
  { name: 'Thu', posts: 130, revenue: 1500 },
  { name: 'Fri', posts: 180, revenue: 2100 },
  { name: 'Sat', posts: 90, revenue: 800 },
  { name: 'Sun', posts: 85, revenue: 750 },
];

const PLAN_DISTRIBUTION = [
  { name: 'Starter', value: 400 },
  { name: 'Professional', value: 300 },
  { name: 'Brand Pro', value: 150 },
  { name: 'Developer', value: 50 },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#6B7280'];

const MOCK_ADMIN_USERS = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.c@tech.com', plan: 'Brand Pro', status: 'Active', joined: '2024-03-10', posts: 142 },
  { id: 'u2', name: 'Marcus Miller', email: 'marcus@growth.io', plan: 'Professional', status: 'Active', joined: '2024-03-12', posts: 89 },
  { id: 'u3', name: 'Elena Rodriguez', email: 'elena.r@design.co', plan: 'Starter', status: 'Paused', joined: '2024-03-15', posts: 12 },
  { id: 'u4', name: 'David Kim', email: 'd.kim@dev.net', plan: 'Developer', status: 'Active', joined: '2024-03-18', posts: 256 },
  { id: 'u5', name: 'James Wilson', email: 'j.wilson@corp.com', plan: 'Professional', status: 'Active', joined: '2024-03-20', posts: 54 },
];

const MOCK_SUBSCRIPTIONS = [
  { id: 'sub_1', user: 'Sarah Chen', amount: 79.00, plan: 'Brand Pro', date: '2024-04-01', status: 'Paid' },
  { id: 'sub_2', user: 'Marcus Miller', amount: 39.00, plan: 'Professional', date: '2024-04-01', status: 'Paid' },
  { id: 'sub_3', user: 'Elena Rodriguez', amount: 19.00, plan: 'Starter', date: '2024-03-28', status: 'Refunded' },
  { id: 'sub_4', user: 'David Kim', amount: 0.00, plan: 'Developer', date: '2024-04-01', status: 'Active' },
  { id: 'sub_5', user: 'James Wilson', amount: 39.00, plan: 'Professional', date: '2024-03-25', status: 'Overdue' },
];

const MOCK_SYSTEM_LOGS = [
  { id: 'l1', type: 'Generation', user: 'Sarah Chen', action: 'LinkedIn Post Generation', status: 'Success', time: '2 mins ago' },
  { id: 'l2', type: 'Automation', user: 'Marcus Miller', action: 'Make.com Webhook Trigger', status: 'Success', time: '14 mins ago' },
  { id: 'l3', type: 'Analysis', user: 'Elena Rodriguez', action: 'Resume Parsing (Gemini)', status: 'Success', time: '1 hour ago' },
  { id: 'l4', type: 'System', user: 'System', action: 'Daily Backup Completed', status: 'Success', time: '3 hours ago' },
  { id: 'l5', type: 'Error', user: 'James Wilson', action: 'LinkedIn Token Expired', status: 'Failed', time: '5 hours ago' },
];

// --- SUB-COMPONENTS ---

const OverviewSection = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Top Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6 border-indigo-50 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Revenue</p>
          <div className="p-2 bg-green-50 rounded-lg"><ArrowUpRight className="w-4 h-4 text-green-600" /></div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-2">$24,500</p>
        <span className="text-green-500 text-xs font-bold">+12.4% from last month</span>
      </Card>
      <Card className="p-6 border-indigo-50 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Active Users</p>
          <div className="p-2 bg-indigo-50 rounded-lg"><Users className="w-4 h-4 text-indigo-600" /></div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-2">1,234</p>
        <span className="text-indigo-500 text-xs font-bold">+5.2% new signups</span>
      </Card>
      <Card className="p-6 border-indigo-50 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Posts Generated</p>
          <div className="p-2 bg-yellow-50 rounded-lg"><Zap className="w-4 h-4 text-yellow-600" /></div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-2">15,402</p>
        <span className="text-gray-400 text-xs font-bold">2.4 posts/user avg</span>
      </Card>
      <Card className="p-6 border-indigo-50 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">System Health</p>
          <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-2">99.9%</p>
        <span className="text-green-500 text-xs font-bold">API Uptime OK</span>
      </Card>
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Revenue & Activity Trend" className="lg:col-span-2 min-h-[400px]">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} dot={{r: 4, fill: '#4F46E5'}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="posts" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Plan Distribution" className="min-h-[400px]">
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PLAN_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {PLAN_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {PLAN_DISTRIBUTION.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="font-medium text-gray-600">{entry.name}</span>
              </div>
              <span className="font-bold text-gray-900">{entry.value} users</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const UserManagementSection = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">User Directory</h2>
      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" /> Filter</Button>
      </div>
    </div>

    <Card className="p-0 overflow-hidden border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">User Details</th>
            <th className="px-6 py-4">Plan</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Activity</th>
            <th className="px-6 py-4">Joined</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {MOCK_ADMIN_USERS.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-xs font-semibold text-gray-700">{user.plan}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900">{user.posts} Posts</p>
              </td>
              <td className="px-6 py-4 text-xs text-gray-500">{user.joined}</td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><MoreVertical className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const SubscriptionsSection = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">Subscription Ledger</h2>
      <Button variant="primary" size="sm" className="gap-2"><CreditCard className="w-4 h-4" /> Export CSV</Button>
    </div>

    <Card className="p-0 overflow-hidden border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Transaction ID</th>
            <th className="px-6 py-4">Subscriber</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Plan Tier</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {MOCK_SUBSCRIPTIONS.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-mono text-gray-400">#{sub.id}</td>
              <td className="px-6 py-4 font-bold text-gray-900">{sub.user}</td>
              <td className="px-6 py-4 font-extrabold text-indigo-600">${sub.amount.toFixed(2)}</td>
              <td className="px-6 py-4 text-xs font-medium">{sub.plan}</td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  sub.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                  sub.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {sub.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-gray-500">{sub.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const AgentLogsSection = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-900">System Activity Pulse</h2>
      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live Monitoring</span>
      </div>
    </div>

    <Card className="p-0 overflow-hidden border-gray-100 shadow-xl shadow-indigo-50/20">
      <div className="bg-gray-900 p-4 font-mono text-xs text-indigo-400 flex items-center justify-between">
        <span>root@autolink-ai-agent:~/system-logs$ tail -f agent.log</span>
        <Activity className="w-4 h-4 animate-pulse" />
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Log Type</th>
            <th className="px-6 py-4">User / Scope</th>
            <th className="px-6 py-4">Action Event</th>
            <th className="px-6 py-4 text-center">Result</th>
            <th className="px-6 py-4 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {MOCK_SYSTEM_LOGS.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${log.type === 'Error' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                  <span className="text-xs font-bold text-gray-900">{log.type}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{log.user}</td>
              <td className="px-6 py-4 font-medium text-gray-800">{log.action}</td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-gray-400 italic">{log.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="AI Model Usage" className="bg-indigo-900 text-white border-none">
        <div className="flex items-center justify-between mb-4">
          <Bot className="w-8 h-8 text-indigo-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Gemini 3 Pro</span>
        </div>
        <p className="text-3xl font-bold">14.2k Tokens</p>
        <p className="text-sm text-indigo-200 mt-2">Consumed in last 24 hours</p>
      </Card>
      <Card title="Make.com Webhooks" className="bg-gray-900 text-white border-none">
        <div className="flex items-center justify-between mb-4">
          <Zap className="w-8 h-8 text-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Webhook Pulse</span>
        </div>
        <p className="text-3xl font-bold">942 Successful</p>
        <p className="text-sm text-gray-400 mt-2">0.0% Failure Rate Across Scenarios</p>
      </Card>
    </div>
  </div>
);

// --- MAIN DASHBOARD CONTROLLER ---

export const AdminDashboard: React.FC = () => {
  // Using path detection to mimic routing behavior within this single component
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'logs'>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewSection />;
      case 'users': return <UserManagementSection />;
      case 'billing': return <SubscriptionsSection />;
      case 'logs': return <AgentLogsSection />;
      default: return <OverviewSection />;
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'billing', label: 'Subscriptions', icon: CreditCard },
    { id: 'logs', label: 'Agent Logs', icon: Activity },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Sub-Navigation for Dashboard views */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-1 rounded-xl border border-gray-200 shadow-sm inline-flex mb-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`
                px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
                ${activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic View Rendering */}
        <div className="min-h-[600px]">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
};
