import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  as = 'button',
  href,
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center 
    font-medium transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-[0.98]
  `;

  const variantClasses = {
    primary: `
      bg-amber-500 hover:bg-amber-400 active:bg-amber-600
      text-slate-900
      focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30
    `,
    secondary: `
      bg-slate-200 hover:bg-slate-300 active:bg-slate-300
      dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-800
      text-slate-700 dark:text-slate-200
      focus:ring-slate-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
    `,
    outline: `
      bg-transparent
      border-2 border-slate-300 dark:border-slate-600
      hover:border-amber-500 dark:hover:border-amber-400
      text-slate-700 dark:text-slate-300
      hover:text-amber-600 dark:hover:text-amber-400
      focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
    `,
    ghost: `
      bg-transparent
      hover:bg-slate-100 dark:hover:bg-slate-800
      text-slate-600 dark:text-slate-400
      hover:text-slate-900 dark:hover:text-slate-200
      focus:ring-slate-400 focus:ring-offset-white dark:focus:ring-offset-slate-900
    `,
    danger: `
      bg-red-600 hover:bg-red-500 active:bg-red-700
      text-white
      focus:ring-red-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      shadow-lg shadow-red-500/20 hover:shadow-red-500/30
    `,
    success: `
      bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
      text-white
      focus:ring-emerald-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30
    `,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
    icon: 'p-2 rounded-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  const content = (
    <>
      {loading && (
        <Loader2 className="animate-spin -ml-0.5 h-4 w-4 flex-shrink-0" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </>
  );

  if (as === 'a' && href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {content}
    </motion.button>
  );
}

// Icon button variant
interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition' | 'children'> {
  icon: React.ReactNode;
  label: string;
}

export function IconButton({ icon, label, className = '', ...props }: IconButtonProps) {
  return (
    <Button
      {...props}
      size="icon"
      className={`relative group ${className}`}
    >
      {icon}
      <span className="sr-only">{label}</span>
      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </Button>
  );
}

// Button group
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  attached?: boolean;
}

export function ButtonGroup({ children, className = '', attached = false }: ButtonGroupProps) {
  return (
    <div className={`flex ${attached ? '-space-x-px' : 'gap-2'} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        if (attached) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          return React.cloneElement(child as React.ReactElement<ButtonProps>, {
            className: `
              ${child.props.className || ''}
              ${isFirst ? 'rounded-r-none' : ''}
              ${isLast ? 'rounded-l-none' : 'rounded-none'}
            `,
          });
        }
        
        return child;
      })}
    </div>
  );
}

export default Button;