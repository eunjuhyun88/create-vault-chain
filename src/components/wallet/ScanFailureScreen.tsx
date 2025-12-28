import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIService } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';

interface ScanFailureScreenProps {
  service: AIService;
  errorType: 'connection' | 'timeout' | 'permission' | 'unknown';
  onRetry: () => void;
  onClose: () => void;
}

const errorMessages = {
  connection: {
    title: 'CONNECTION LOST',
    description: 'Unable to establish connection with the AI service session.',
    icon: WifiOff,
  },
  timeout: {
    title: 'SCAN TIMEOUT',
    description: 'The scanning operation took too long and was terminated.',
    icon: AlertTriangle,
  },
  permission: {
    title: 'ACCESS DENIED',
    description: 'PlayArts needs permission to scan this page content.',
    icon: AlertTriangle,
  },
  unknown: {
    title: 'SCAN FAILED',
    description: 'An unexpected error occurred during the scan.',
    icon: AlertTriangle,
  },
};

export function ScanFailureScreen({ service, errorType, onRetry, onClose }: ScanFailureScreenProps) {
  const error = errorMessages[errorType];
  const ErrorIcon = error.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 w-[320px] text-center relative overflow-hidden"
      >
        {/* Background Effect */}
        <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center mx-auto mb-4"
          >
            <ErrorIcon className="w-10 h-10 text-destructive" />
          </motion.div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-destructive mb-2">
            {error.title}
          </h3>

          {/* Service Badge */}
          <div className="flex justify-center mb-4">
            <ServiceBadge service={service} size="md" />
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-6">
            {error.description}
          </p>

          {/* Error Details */}
          <div className="glass-card p-3 mb-6 text-left border-destructive/20">
            <p className="text-[10px] text-muted-foreground mb-1">Error Details</p>
            <code className="text-[10px] text-destructive font-mono">
              ERR_{errorType.toUpperCase()}_SCAN_FAILED
            </code>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full h-10 font-display tracking-wider"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              RETRY SCAN
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-10 border-primary/30"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          {/* Tips */}
          <div className="mt-4 text-[10px] text-muted-foreground">
            <p className="mb-1">Troubleshooting tips:</p>
            <ul className="text-left space-y-1 pl-4">
              <li>• Make sure the AI service page is fully loaded</li>
              <li>• Check your internet connection</li>
              <li>• Try refreshing the AI service page</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
