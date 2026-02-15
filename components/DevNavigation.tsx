
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Shield } from 'lucide-react';

export const DevNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navs = [
    { 
      label: 'Landing', 
      path: '/', 
      icon: Home,
      isActive: (currentPath: string) => currentPath === '/'
    },
    { 
      label: 'App', 
      path: '/app/dashboard', 
      icon: LayoutDashboard,
      isActive: (currentPath: string) => currentPath.startsWith('/app')
    },
    { 
      label: 'Admin', 
      path: '/admin/dashboard', 
      icon: Shield,
      isActive: (currentPath: string) => currentPath.startsWith('/admin')
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/90 backdrop-blur-sm text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-1 border border-gray-700/50">
      <span className="hidden sm:inline-block text-[10px] font-bold text-gray-500 mx-2 uppercase tracking-wider">DevNav</span>
      {navs.map((nav) => (
        <button
          key={nav.label}
          onClick={() => navigate(nav.path)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap
            ${nav.isActive(location.pathname)
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
              : 'hover:bg-gray-800 text-gray-300'}
          `}
        >
          <nav.icon className="w-3.5 h-3.5" />
          {nav.label}
        </button>
      ))}
    </div>
  );
};
