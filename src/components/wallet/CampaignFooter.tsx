import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, ChevronRight, Users, Trophy, Target } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  reward: string;
  icon: React.ReactNode;
  progress: number;
  status: 'live' | 'upcoming' | 'ending';
}

interface CampaignFooterProps {
  onClick?: () => void;
}

const campaigns: Campaign[] = [
  {
    id: 'scan-earn',
    title: 'SCAN & EARN',
    reward: '+50 PLART',
    icon: <Gift className="w-4 h-4" />,
    progress: 65,
    status: 'live',
  },
  {
    id: 'referral',
    title: 'REFERRAL',
    reward: '+200 PLART',
    icon: <Users className="w-4 h-4" />,
    progress: 30,
    status: 'live',
  },
  {
    id: 'weekly',
    title: 'WEEKLY',
    reward: '+500 PLART',
    icon: <Trophy className="w-4 h-4" />,
    progress: 80,
    status: 'ending',
  },
  {
    id: 'first-mint',
    title: 'FIRST MINT',
    reward: '+100 PLART',
    icon: <Target className="w-4 h-4" />,
    progress: 0,
    status: 'upcoming',
  },
];

export function CampaignFooter({ onClick }: CampaignFooterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentCampaign = campaigns[currentIndex];

  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1.5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t border-primary/20 flex items-center justify-between group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCampaign.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
            {currentCampaign.icon}
          </div>
          
          <span className="text-[10px] font-semibold text-primary font-['Orbitron']">
            {currentCampaign.title}
          </span>
          
          {currentCampaign.status === 'live' && (
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          )}
          {currentCampaign.status === 'ending' && (
            <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
          )}
          
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Zap className="w-3 h-3 text-warning" />
            <span>{currentCampaign.reward}</span>
          </div>
          
          {/* Mini progress */}
          <div className="w-12 h-1 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/60 rounded-full"
              style={{ width: `${currentCampaign.progress}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Dots */}
        <div className="flex gap-1">
          {campaigns.map((_, idx) => (
            <span
              key={idx}
              className={`w-1 h-1 rounded-full transition-all ${
                idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}
