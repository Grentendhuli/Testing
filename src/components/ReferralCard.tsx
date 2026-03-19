import { useState, useEffect } from 'react';
import { Gift, Copy, Check, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';

interface ReferralCardProps {
  variant?: 'sidebar' | 'banner' | 'compact';
}

export function ReferralCard({ variant = 'sidebar' }: ReferralCardProps) {
  const { userData } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  
  // Generate referral link based on user ID
  const referralLink = userData?.id 
    ? `${window.location.origin}/signup?ref=${userData.id}`
    : '';

  useEffect(() => {
    // Check if user is on free tier
    const isFreeTier = !userData?.subscription_tier || userData.subscription_tier === 'free';
    
    if (!isFreeTier) {
      setIsDismissed(true);
      return;
    }

    // Check if already dismissed this session
    const sessionDismissed = sessionStorage.getItem('referral-dismissed');
    if (sessionDismissed) {
      setIsDismissed(true);
      return;
    }

    // Show occasionally - 30% chance per session
    const shouldShow = Math.random() < 0.3;
    if (shouldShow) {
      // Delay showing for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, [userData]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('referral-dismissed', 'true');
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Try LandlordBot - Free Property Management',
          text: 'I\'ve been using LandlordBot to manage my rental properties. It\'s completely free and has AI-powered features!',
          url: referralLink,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (isDismissed || !isVisible) return null;

  // Compact variant for inline display
  if (variant === 'compact') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  Share & Earn Rewards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Invite friends and unlock premium features
                </p>
                
                {referralLink && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-amber-500/50 transition-colors"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> <span>Copied!</span></>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> <span>Copy Link</span></>
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Share
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20 px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    Share LandlordBot with Friends
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invite other landlords and unlock premium features when they sign up
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {referralLink && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> <span>Copied!</span></>
                    ) : (
                      <><Copy className="w-4 h-4" /> <span>Copy Link</span></>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Sidebar variant (default)
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                Refer & Earn
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Share LandlordBot with fellow landlords. When they sign up, you'll both get premium features unlocked!
          </p>
          
          {referralCount > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                {referralCount} friend{referralCount !== 1 ? 's' : ''} joined
              </span>
            </div>
          )}
          
          {referralLink && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
              
              <button
                onClick={handleShare}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Share with Friends
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReferralCard;
