import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Building2, Phone, Settings, CreditCard, Home, DollarSign, FileText, Users, 
  BarChart3, Wrench, LineChart, TrendingUp, Lightbulb, Scale,
  Menu, X, Star, Bot, MapPin, ChevronRight, Keyboard,
  Command, MessageCircle, LogOut
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { useTheme } from '../context/ThemeContext';
import { LanguagePicker } from './LanguagePicker';
import { LogoMark } from '@/components/LogoMark';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Building2, shortcut: 'D' },
  { path: '/units', label: 'Units', icon: Home, shortLabel: 'Units', shortcut: 'U' },
  { path: '/rent', label: 'Rent', icon: DollarSign, shortLabel: 'Rent', shortcut: 'R' },
  { path: '/leases', label: 'Leases', icon: FileText, shortcut: 'L' },
  { path: '/leads', label: 'Leads', icon: Users, shortcut: 'Q' },
  { path: '/listings', label: 'Listings', icon: FileText, shortLabel: 'List', shortcut: 'I' },
  { path: '/maintenance', label: 'Maint.', icon: Wrench, shortLabel: 'Maint.', shortcut: 'M' },
  { path: '/messages', label: 'Msgs', icon: Phone, shortLabel: 'Msgs', shortcut: 'G' },
];

const systemItems = [
  { path: '/assistant', label: 'Assistant', icon: Bot, shortLabel: 'Bot', shortcut: 'A' },
  { path: '/reports', label: 'Reports', icon: BarChart3, shortcut: 'P' },
  { path: '/nyc-compliance', label: 'NYC', icon: Scale, shortLabel: 'NYC', shortcut: 'Y' },
  { path: '/config', label: 'Settings', icon: Settings, shortLabel: 'Settings', shortcut: ',' },
  { path: '/billing', label: 'Services', icon: CreditCard, shortLabel: 'Services', shortcut: 'S' },
];

const aiFeatures = [
  { path: '/market-insights', label: 'Market', icon: TrendingUp, shortLabel: 'Market', shortcut: 'K' },
  { path: '/recommendations', label: 'Recs', icon: Lightbulb, shortLabel: 'Recs', shortcut: 'E' },
];

const advancedItems = [
  { path: '/concierge', label: 'Concierge', icon: Star, shortLabel: 'Concierge', shortcut: 'C' },
];

// Keyboard shortcuts help modal
function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = [
    { key: '⌘K / Ctrl+K', description: 'Open command palette' },
    { key: '⌘/ / Ctrl+/', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close modals / menus' },
    ...navItems.map(item => ({ key: `⌘${item.shortcut}`, description: `Go to ${item.label}` })),
    ...systemItems.slice(0, 3).map(item => ({ key: `⌘${item.shortcut}`, description: `Go to ${item.label}` })),
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Keyboard className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <span className="text-slate-600 dark:text-slate-300">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded border border-slate-200 dark:border-slate-600">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Sidebar() {
  const { user, payments, maintenanceRequests, leads } = useApp();
  const { userData, signOut } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Telegram menu item - visible until setup is complete
  const telegramItem = { path: '/config', label: 'Telegram', icon: MessageCircle, shortLabel: 'TG', shortcut: 'T', badge: 'Setup' };

  // Compute notification counts
  const overduePayments = payments?.filter(p => p.status === 'overdue' || p.status === 'late').length || 0;
  const openMaintenance = maintenanceRequests?.filter(r => r.status === 'open').length || 0;
  const oneDayAgo = new Date(Date.now() - 86400000);
  const newLeads = leads?.filter(l => new Date(l.createdAt || 0) > oneDayAgo).length || 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Navigation shortcuts
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const allItems = [...navItems, ...systemItems, ...aiFeatures];
        const item = allItems.find(i => i.shortcut?.toLowerCase() === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          navigate(item.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Check if Telegram bot is connected (remove the duplicate below)
  const isTelegramConnected = !!(userData?.bot_phone_number || user?.botPhoneNumber);

  // Format address for display
  const formatAddress = useCallback((address: string | null | undefined): string => {
    if (!address) return 'Add your property address';
    
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const street = parts[0];
      const cityState = parts.slice(1, 3).join(', ');
      return `${street}, ${cityState}`;
    }
    return address.length > 35 ? address.substring(0, 35) + '...' : address;
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check if Telegram is configured
  const isTelegramConfigured = !!(userData?.bot_phone_number || user?.botPhoneNumber);
  const shouldShowTelegram = !isTelegramConfigured;
  
  const renderNavItem = (item: typeof navItems[0] & { badge?: string }, isCompact: boolean = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const label = isCompact && item.shortLabel ? item.shortLabel : item.label;
    
    // Determine notification dot
    let showDot = false;
    let dotColor = '';
    let showBadge = false;
    let badgeText = item.badge || '';
    
    if (item.path === '/rent' && overduePayments > 0) {
      showDot = true;
      dotColor = 'bg-red-500';
    } else if (item.path === '/maintenance' && openMaintenance > 0) {
      showDot = true;
      dotColor = 'bg-amber-500';
    } else if (item.path === '/leads' && newLeads > 0) {
      showDot = true;
      dotColor = 'bg-green-500';
    } else if (item.badge) {
      showBadge = true;
    }
    
    return (
      <li key={`${item.path}-${item.label}`}>
        <NavLink
          to={item.path}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 sm:px-4 text-sm font-medium 
            transition-all duration-200 min-h-[44px] touch-manipulation
            rounded-lg mx-2
            ${isActive
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-r-2 border-amber-500'
              : badgeText ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-lb-text-secondary hover:text-lb-text-primary dark:text-lb-text-secondary dark:hover:text-lb-text-primary hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }
            ${isCompact ? 'flex-col gap-1 py-2 text-xs justify-center mx-0' : ''}
          `}
        >
          <div className="relative">
            <Icon className={`flex-shrink-0 ${isActive ? 'text-amber-500' : badgeText ? 'text-blue-500' : 'text-lb-text-muted dark:text-lb-text-muted'} ${isCompact ? 'w-5 h-5' : 'w-5 h-5'}`} />
            {showDot && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${dotColor} rounded-full animate-pulse border-2 border-white dark:border-slate-900`} />
            )}
          </div>
          <span className={`${isCompact ? 'text-[10px]' : 'flex-1'} truncate`}>{label}</span>
          
          {showBadge && !isCompact && (
            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
              {badgeText}
            </span>
          )}
          
          {!isCompact && item.shortcut && !badgeText && (
            <kbd className="hidden xl:block px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
              ⌘{item.shortcut}
            </kbd>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Header - Fixed at top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-50 flex items-center justify-between px-4">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 group"
          aria-label="Go to dashboard"
        >
          <LogoMark size={36} showWordmark={true} />
        </NavLink>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="Keyboard shortcuts"
          >
            <Command className="w-5 h-5" />
          </button>
          
          <div className="lg:hidden">
            <LanguagePicker />
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 min-h-screen flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 group"
            aria-label="Go to dashboard"
          >
            <LogoMark size={36} showWordmark={true} />
          </NavLink>
          
          <div className="mt-4">
            <LanguagePicker />
          </div>
        </div>

        {/* Property Address Header */}
        <AnimatePresence>
          {userData?.property_address && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 mx-4 mt-2 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Property</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={userData.property_address}>
                    {formatAddress(userData.property_address)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">Main</p>
            <ul className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
            </ul>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">System</p>
            <ul className="space-y-0.5">
              {systemItems.map((item) => renderNavItem(item))}
              {shouldShowTelegram && renderNavItem(telegramItem)}
            </ul>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">AI Features</p>
            <ul className="space-y-0.5">
              {aiFeatures.map((item) => renderNavItem(item))}
            </ul>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">Advanced</p>
            <ul className="space-y-0.5">
              {advancedItems.map((item) => renderNavItem(item))}
            </ul>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <NavLink 
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
          >
            {/* Avatar with initials */}
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                {user?.lastName?.charAt(0).toUpperCase() || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {/* Name */}
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'}
              </p>
              {/* Property address */}
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {formatAddress(userData?.property_address || user?.propertyAddress)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </NavLink>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className={`lg:hidden fixed inset-y-0 left-0 w-[80%] max-w-[300px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={36} showWordmark={true} />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto h-[calc(100vh-280px)]">
          <AnimatePresence>
            {userData?.property_address && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-3 mb-4 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Property</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={userData.property_address}>
                      {formatAddress(userData.property_address)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">Main</p>
            <ul className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
            </ul>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">System</p>
            <ul className="space-y-0.5">
              {systemItems.map((item) => renderNavItem(item))}
              {shouldShowTelegram && renderNavItem(telegramItem)}
            </ul>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">AI Features</p>
            <ul className="space-y-0.5">
              {aiFeatures.map((item) => renderNavItem(item))}
            </ul>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-lb-text-muted uppercase tracking-wider mb-2 px-3">Advanced</p>
            <ul className="space-y-0.5">
              {advancedItems.map((item) => renderNavItem(item))}
            </ul>
          </div>
        </nav>

        {/* Mobile User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <NavLink 
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
          >
            {/* Avatar with initials */}
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                {user?.lastName?.charAt(0).toUpperCase() || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {/* Name */}
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'}
              </p>
              {/* Property address */}
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {formatAddress(userData?.property_address || user?.propertyAddress)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </NavLink>
          
          {/* Mobile Sign Out Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-40 safe-area-inset-bottom">
        <ul className="flex justify-around items-center py-1 px-2">
          {navItems.slice(0, 4).map((item) => renderNavItem(item, true))}
          <li>
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
    </>
  );
}

export default Sidebar;
