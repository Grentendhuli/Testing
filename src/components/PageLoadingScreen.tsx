import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { LogoMark } from './LogoMark';

export function PageLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6"
        >
          <LogoMark size={64} showWordmark={true} />
        </motion.div>

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading page...</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden"
        >
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '70%', '40%', '90%', '60%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
