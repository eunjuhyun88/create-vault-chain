import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { ServiceBadge } from './ServiceBadge';
import { Radio, Wifi } from 'lucide-react';

export function ScanOverlay() {
  const { session } = useWallet();

  if (!session.isActive || !session.currentService) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-50 glass-card border-b border-primary/30 px-4 py-3"
    >
      {/* Scan Line Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 w-5 h-5 bg-primary/30 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Active Session
            </span>
            <span className="text-primary font-display text-sm font-semibold">
              SCANNING
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ServiceBadge service={session.currentService} size="sm" />
          <div className="flex items-center gap-1 text-primary">
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-mono">{session.scanningCount}</span>
          </div>
        </div>
      </div>

      {/* Animated Border */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ 
          x: ['-100%', '100%'],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ width: '50%' }}
      />
    </motion.div>
  );
}
