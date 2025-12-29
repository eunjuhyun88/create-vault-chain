import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { haptic } from '@/hooks/use-haptic';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface SuccessAnimationProps {
  show: boolean;
  type?: FeedbackType;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

const iconMap = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-success/20',
    border: 'border-success/50',
    text: 'text-success',
    glow: 'shadow-[0_0_40px_hsl(120_70%_45%/0.5)]',
  },
  error: {
    bg: 'bg-destructive/20',
    border: 'border-destructive/50',
    text: 'text-destructive',
    glow: 'shadow-[0_0_40px_hsl(0_85%_50%/0.5)]',
  },
  warning: {
    bg: 'bg-warning/20',
    border: 'border-warning/50',
    text: 'text-warning',
    glow: 'shadow-[0_0_40px_hsl(45_100%_50%/0.5)]',
  },
  info: {
    bg: 'bg-primary/20',
    border: 'border-primary/50',
    text: 'text-primary',
    glow: 'shadow-[0_0_40px_hsl(75_100%_55%/0.5)]',
  },
};

export function SuccessAnimation({ 
  show, 
  type = 'success', 
  message,
  onComplete,
  duration = 2000 
}: SuccessAnimationProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (show) {
      // Trigger haptic based on type
      if (type === 'success') haptic.success();
      else if (type === 'error') haptic.error();
      else if (type === 'warning') haptic.warning();
      else haptic.medium();

      // Auto-complete after duration
      if (onComplete && duration > 0) {
        const timer = setTimeout(onComplete, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [show, type, onComplete, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Icon circle with pulse rings */}
            <div className="relative">
              {/* Pulse rings */}
              <motion.div
                className={`absolute inset-0 rounded-full ${colors.border} border-2`}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1, repeat: 2, ease: 'easeOut' }}
              />
              <motion.div
                className={`absolute inset-0 rounded-full ${colors.border} border-2`}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1, repeat: 2, ease: 'easeOut', delay: 0.3 }}
              />

              {/* Main icon container */}
              <motion.div
                className={`w-20 h-20 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center ${colors.glow}`}
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                >
                  <Icon className={`w-10 h-10 ${colors.text}`} strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            </div>

            {/* Message */}
            {message && (
              <motion.p
                className={`text-sm font-medium ${colors.text} text-center max-w-xs`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact inline version for use within components
export function InlineSuccessIndicator({ 
  show, 
  type = 'success' 
}: { 
  show: boolean; 
  type?: FeedbackType;
}) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (show) {
      if (type === 'success') haptic.success();
      else if (type === 'error') haptic.error();
    }
  }, [show, type]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Icon className={`w-4 h-4 ${colors.text}`} strokeWidth={2.5} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
