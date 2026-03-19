import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ElementType;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'units': 'Units',
  'rent': 'Rent Collection',
  'leases': 'Leases',
  'leads': 'Leads',
  'maintenance': 'Maintenance',
  'messages': 'Messages',
  'assistant': 'AI Assistant',
  'reports': 'Reports',
  'nyc-compliance': 'NYC Compliance',
  'config': 'Settings',
  'billing': 'Services',
  'market-insights': 'Market Insights',
  'recommendations': 'Recommendations',
  'profile': 'Profile',
  'team': 'Team',
  'walkthroughs': 'Walkthroughs',
  'strategy-calls': 'Strategy Calls',
  'advisor-portal': 'Advisor Portal',
  'elite-manager': 'Elite Manager',
  'elite-reports': 'Elite Reports',
  'pro-reports': 'Pro Reports',
  'concierge': 'Concierge',
};

export function Breadcrumb({ items, className = '', showHome = true }: BreadcrumbProps) {
  const location = useLocation();
  
  // Generate breadcrumb items from current path if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = '';
    
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      items.push({
        label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        icon: index === 0 ? Home : undefined,
      });
    });
    
    return items;
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav 
      className={`flex items-center text-sm text-lb-text-muted ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap gap-1">
        {showHome && location.pathname !== '/dashboard' && (
          <li>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors hover:underline underline-offset-4"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}
        
        {showHome && location.pathname !== '/dashboard' && breadcrumbItems.length > 0 && (
          <li className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1" />
          </li>
        )}
        
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={item.path} className="flex items-center">
              {isLast ? (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium text-lb-text-primary"
                  aria-current="page"
                >
                  {item.label}
                </motion.span>
              ) : (
                <>
                <Link
                  to={item.path}
                  className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors hover:underline underline-offset-4"
                >
                  {item.label}
                </Link>
                  <ChevronRight className="w-4 h-4 mx-1" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact breadcrumb for mobile
export function BreadcrumbCompact({ className = '' }: { className?: string }) {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;
  
  const currentPage = routeLabels[paths[paths.length - 1]] || 
    paths[paths.length - 1].charAt(0).toUpperCase() + paths[paths.length - 1].slice(1);
  
  const parentPath = paths.length > 1 ? `/${paths.slice(0, -1).join('/')}` : '/dashboard';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link
        to={parentPath}
        className="flex items-center gap-1 text-sm text-lb-text-muted hover:text-amber-500 transition-colors hover:underline underline-offset-4"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Back</span>
      </Link>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="text-sm font-medium text-lb-text-primary truncate">
        {currentPage}
      </span>
    </div>
  );
}

// Page header with breadcrumb
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  showBreadcrumb?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  className = '',
  showBreadcrumb = true 
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {showBreadcrumb && <Breadcrumb className="hidden sm:flex" />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-serif font-bold text-lb-text-primary"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lb-text-secondary"
            >
              {description}
            </motion.p>
          )}
        </div>
        {children && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Breadcrumb;
