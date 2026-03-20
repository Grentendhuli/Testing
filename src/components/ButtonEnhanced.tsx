import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from './ui/Toast';

export interface ButtonEnhancedProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
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
  /** Show success state after action completes */
  showSuccess?: boolean;
  /** Show error state on action failure */
  showError?: boolean;
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Validate before allowing click */
  validate?: () => boolean | string;
  /** Async action handler - will manage loading/success/error states */
  onAsyncAction?: () => Promise<void>;
  /** Delay before resetting to idle state (ms) */
  resetDelay?: number;
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export function ButtonEnhanced({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading: externalLoading,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  as = 'button',
  href,
  showSuccess = true,
  showError = true,
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  validate,
  onAsyncAction,
  resetDelay = 2000,
}: ButtonEnhancedProps) {
  const [state, setState] = useState<ButtonState>('idle');
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const isLoading = state === 'loading' || externalLoading;
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isDisabled = disabled || isLoading;

  const handleClick = useCallback(async () => {
    // Validation
    if (validate) {
      const validationResult = validate();
      if (typeof validationResult === 'string') {
        showErrorToast('Validation Error', validationResult);
        return;
      }
      if (!validationResult) {
        return;
      }
    }

    // Handle async action
    if (onAsyncAction) {
      setState('loading');
      try {
        await onAsyncAction();
        setState('success');
        if (showSuccess) {
          showSuccessToast(successMessage);
        }
        setTimeout(() => setState('idle'), resetDelay);
      } catch (err) {
        setState('error');
        if (showError) {
          showErrorToast(errorMessage, err instanceof Error ? err.message : undefined);
        }
        setTimeout(() => setState('idle'), resetDelay);
      }
    } else if (onClick) {
      onClick();
    }
  }, [validate, onAsyncAction, onClick, showSuccess, showError, successMessage, errorMessage, showSuccessToast, showErrorToast, resetDelay]);

  const baseClasses = `
    inline-flex items-center justify-center 
    font-medium transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-[0.98]
    relative overflow-hidden
  `;

  const variantClasses = {
    primary: `
      bg-amber-500 hover:bg-amber-400 active:bg-amber-600
      text-slate-900
      focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30
      ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-500 shadow-emerald-500/20' : ''}
      ${isError ? 'bg-red-500 hover:bg-red-500 shadow-red-500/20' : ''}
    `,
    secondary: `
      bg-slate-200 hover:bg-slate-300 active:bg-slate-300
      dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-800
      text-slate-700 dark:text-slate-200
      focus:ring-slate-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      ${isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
      ${isError ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
    `,
    outline: `
      bg-transparent
      border-2 border-slate-300 dark:border-slate-600
      hover:border-amber-500 dark:hover:border-amber-400
      text-slate-700 dark:text-slate-300
      hover:text-amber-600 dark:hover:text-amber-400
      focus:ring-amber-500 focus:ring-offset-white dark:focus:ring-offset-slate-900
      ${isSuccess ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400' : ''}
      ${isError ? 'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400' : ''}
    `,
    ghost: `
      bg-transparent
      hover:bg-slate-100 dark:hover:bg-slate-800
      text-slate-600 dark:text-slate-400
      hover:text-slate-900 dark:hover:text-slate-200
      focus:ring-slate-400 focus:ring-offset-white dark:focus:ring-offset-slate-900
      ${isSuccess ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : ''}
      ${isError ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
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

  const renderContent = () => (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="animate-spin h-4 w-4 flex-shrink-0" />
          <span>Loading...</span>
        </motion.span>
      ) : isSuccess ? (
        <motion.span
          key="success"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </motion.span>
      ) : isError ? (
        <motion.span
          key="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4 flex-shrink-0" />
          <span>Failed</span>
        </motion.span>
      ) : (
        <motion.span
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2"
        >
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (as === 'a' && href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      >
        {renderContent()}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={classes}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {renderContent()}
    </motion.button>
  );
}

// Async action button with built-in loading/error handling
interface AsyncButtonProps extends Omit<ButtonEnhancedProps, 'onClick' | 'onAsyncAction'> {
  action: () => Promise<void>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
}

export function AsyncButton({
  action,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Failed',
  children,
  ...props
}: AsyncButtonProps) {
  return (
    <ButtonEnhanced
      {...props}
      onAsyncAction={action}
      successMessage={successText}
      errorMessage={errorText}
    >
      {children}
    </ButtonEnhanced>
  );
}

// Confirm button - requires confirmation before action
interface ConfirmButtonProps extends ButtonEnhancedProps {
  confirmTitle?: string;
  confirmMessage?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmButton({
  confirmTitle = 'Are you sure?',
  confirmMessage,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  onConfirm,
  variant = 'danger',
  children,
  ...props
}: ConfirmButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <ButtonEnhanced
        {...props}
        variant={variant}
        onClick={() => setShowConfirm(true)}
      >
        {children}
      </ButtonEnhanced>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {confirmTitle}
                </h3>
              </div>
              
              {confirmMessage && (
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {confirmMessage}
                </p>
              )}

              <div className="flex gap-3">
                <ButtonEnhanced
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowConfirm(false)}
                >
                  {cancelButtonText}
                </ButtonEnhanced>
                <ButtonEnhanced
                  variant={variant}
                  fullWidth
                  onAsyncAction={async () => {
                    await onConfirm();
                    setShowConfirm(false);
                  }}
                >
                  {confirmButtonText}
                </ButtonEnhanced>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ButtonEnhanced;
