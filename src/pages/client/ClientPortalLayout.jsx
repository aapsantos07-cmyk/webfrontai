import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Briefcase, FolderOpen, MessageSquare, CreditCard,
  BookOpen, Settings, ArrowRight
} from 'lucide-react';
import { AnimatedIcon } from '../../components/icons/AnimatedIcon';

export default function ClientPortalLayout({ onUpdateClient }) {
  const location = useLocation();
  const { currentClientData: clientData, handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/overview' },
    { id: 'projects', label: 'Projects', icon: Briefcase, path: '/dashboard/projects' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, path: '/dashboard/documents' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/messages' },
    { id: 'invoices', label: 'Invoices', icon: CreditCard, path: '/dashboard/invoices' },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, path: '/dashboard/knowledge' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' }
  ];

  // Determine active tab based on current location
  const activeTab = menuItems.find(item => location.pathname.startsWith(item.path))?.id || 'overview';

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col lg:flex-row relative">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="font-bold">WEBFRONT_OS</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          <AnimatedIcon name="Menu" size={28} reverse={mobileMenuOpen} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-zinc-800 bg-zinc-900/30 flex-col p-6 fixed lg:relative z-20 h-full backdrop-blur-md lg:backdrop-blur-none bg-black/90 lg:bg-transparent`}>
        <h2 className="text-xl font-bold tracking-tighter mb-8 hidden lg:block">
          WEBFRONT<span className="text-blue-500">_OS</span>
        </h2>
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-zinc-800 text-white shadow-lg border-l-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30 border-l-2 border-transparent'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : ''} />
              <span className={activeTab === item.id ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mt-auto px-4 py-4 border-t border-zinc-800"
        >
          Log Out <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-black h-[calc(100vh-60px)] lg:h-screen">
        <Outlet context={{ clientData, onUpdateClient }} />
      </div>
    </div>
  );
}
