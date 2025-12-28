import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, ChevronRight, Sparkles, Target, Users, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Campaign {
  id: string;
  title: string;
  reward: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  current: number;
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
    icon: <Gift className="w-5 h-5 text-primary" />,
    progress: 65,
    target: 100,
    current: 65,
    status: 'live',
  },
  {
    id: 'referral',
    title: 'REFERRAL BONUS',
    reward: '+200 PLART',
    icon: <Users className="w-5 h-5 text-primary" />,
    progress: 30,
    target: 10,
    current: 3,
    status: 'live',
  },
  {
    id: 'weekly-challenge',
    title: 'WEEKLY CHALLENGE',
    reward: '+500 PLART',
    icon: <Trophy className="w-5 h-5 text-primary" />,
    progress: 80,
    target: 50,
    current: 40,
    status: 'ending',
  },
  {
    id: 'first-mint',
    title: 'FIRST MINT',
    reward: '+100 PLART',
    icon: <Target className="w-5 h-5 text-primary" />,
    progress: 0,
    target: 1,
    current: 0,
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

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'live':
        return (
          <span className="px-1.5 py-0.5 bg-success/20 text-success text-[10px] font-medium rounded-full animate-pulse">
            LIVE
          </span>
        );
      case 'ending':
        return (
          <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[10px] font-medium rounded-full">
            ENDING SOON
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full">
            SOON
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="px-3 py-2 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-primary/30"
    >
      <button
        onClick={onClick}
        className="w-full group"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCampaign.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                    {currentCampaign.icon}
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
                    <span className="text-xs font-semibold text-primary font-['Orbitron']">
                      {currentCampaign.title}
                    </span>
                    {getStatusBadge(currentCampaign.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Zap className="w-3 h-3 text-warning" />
                    <span className="text-[11px] text-muted-foreground">
                      {currentCampaign.reward} per completion
                    </span>
                  </div>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <Progress 
                value={currentCampaign.progress} 
                className="h-1.5 flex-1 bg-muted/50"
              />
              <span className="text-[10px] text-muted-foreground font-mono min-w-[60px] text-right">
                {currentCampaign.current}/{currentCampaign.target}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {campaigns.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </button>
    </motion.div>
  );
}
