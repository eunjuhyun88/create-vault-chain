import { motion } from 'framer-motion';
import { Gift, Zap, ChevronRight, Sparkles } from 'lucide-react';

interface CampaignFooterProps {
  onClick?: () => void;
}

export function CampaignFooter({ onClick }: CampaignFooterProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="px-3 py-2 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-primary/30"
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-2.5 h-2.5 text-warning-foreground" />
            </motion.div>
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary font-['Orbitron']">SCAN & EARN</span>
              <span className="px-1.5 py-0.5 bg-success/20 text-success text-[10px] font-medium rounded-full animate-pulse">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Zap className="w-3 h-3 text-warning" />
              <span className="text-[11px] text-muted-foreground">
                +50 PLART per verified passport
              </span>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </button>
    </motion.div>
  );
}
