
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, RefreshCw, Loader2, Search, Filter, ExternalLink, AlertCircle } from 'lucide-react';
import { getPosts } from '../lib/api';
import { getStoredUser } from '../lib/store';

interface APIPost {
  id: string;
  content: string;
  post_url: string;
  status: string;
  created_at: string;
}

  const ActivityLogPage: React.FC = () => {
  const [posts, setPosts] = useState<APIPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      const data = await getPosts(user.id);
      
      // Filter for only 'posted' status and remove duplicates
      const actuallyPosted = data.filter((post: any) => post.status === 'posted');
      
      // Remove duplicates based on content or URL
      const uniquePosts = actuallyPosted.reduce((acc: APIPost[], current: APIPost) => {
        const isDuplicate = acc.find(item => 
          (item.post_url && item.post_url === current.post_url) || 
          (item.content === current.content)
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      setPosts(uniquePosts);
    } catch (e) {
      console.error("Failed to load logs:", e);
      setError("Unable to connect to the automation history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-500">History of unique posts actually published to LinkedIn.</p>
          </div>
          <Button variant="outline" onClick={fetchHistory} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Logs
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Posted Date</th>
                  <th className="px-6 py-4">Content Preview</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="text-gray-500">Retrieving successful posts...</span>
                      </div>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Search className="w-12 h-12 opacity-20" />
                        <span className="font-medium">No posted logs found yet.</span>
                        <p className="text-xs">Enable automation to start your posting history.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[450px] line-clamp-2 font-medium text-gray-700">
                          {post.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
                          Posted
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={post.post_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900 font-semibold transition-colors"
                        >
                          View Live
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
export default ActivityLogPage;