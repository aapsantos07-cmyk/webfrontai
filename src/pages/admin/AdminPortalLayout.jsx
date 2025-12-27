import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Briefcase, ClipboardList, Users, CreditCard,
  BarChart3, Brain, FileSpreadsheet, History, Shield, Sliders,
  Menu, X, ArrowRight
} from 'lucide-react';

export default function AdminPortalLayout() {
  const location = useLocation();
  const { clients, setClients, adminSettings, setAdminSettings, handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'projects', label: 'Projects / Pipeline', icon: Briefcase, path: '/admin/projects' },
    { id: 'tasks', label: 'Project Tasks', icon: ClipboardList, path: '/admin/tasks' },
    { id: 'clients', label: 'Clients List', icon: Users, path: '/admin/clients' },
    { id: 'financials', label: 'Financials', icon: CreditCard, path: '/admin/financials' },
    { id: 'analytics', label: 'Website Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'data', label: 'Data & AI Models', icon: Brain, path: '/admin/data' },
    { id: 'reports', label: 'Reporting Tools', icon: FileSpreadsheet, path: '/admin/reports' },
    { id: 'logs', label: 'Activity Logs', icon: History, path: '/admin/logs' },
    { id: 'users', label: 'User Roles', icon: Shield, path: '/admin/users' },
    { id: 'settings', label: 'Configuration', icon: Sliders, path: '/admin/settings' }
  ];

  // Determine active tab based on current location
  const activeTab = menuItems.find(item => location.pathname.startsWith(item.path))?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-black text-white font-sans border-l-0 lg:border-l-4 lg:border-red-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="font-bold text-red-500">ADMIN PANEL</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">
          ADMIN<span className="text-white">_PANEL</span>
        </h2>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-4 px-4 py-2 border-t border-zinc-800 pt-4"
        >
          Log Out <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        <Outlet context={{ clients, setClients, adminSettings, setAdminSettings }} />
      </div>
    </div>
  );
}
