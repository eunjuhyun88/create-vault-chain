import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScannedAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { Shield, Hash, Lock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MintingModalProps {
  asset: ScannedAsset;
  onComplete: () => void;
  onClose: () => void;
}

const stages = [
  { id: 'hash', label: 'Computing Hashes', icon: Hash },
  { id: 'encrypt', label: 'Encrypting Data', icon: Lock },
  { id: 'chain', label: 'Registering On-Chain', icon: Shield },
  { id: 'complete', label: 'ACP Minted', icon: Check },
];

export function MintingModal({ asset, onComplete, onClose }: MintingModalProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(interval);
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && isComplete) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 w-[340px] relative overflow-hidden"
      >
        {/* Hologram Scan Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10"
            animate={{ 
              y: ['-100%', '100%'],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Asset Preview */}
          <div className="relative h-32 rounded-lg overflow-hidden mb-4 border border-primary/20">
            {asset.previewUrl ? (
              <img 
                src={asset.previewUrl} 
                alt="Asset" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-2 left-2">
              <ServiceBadge service={asset.sourceAI} size="sm" />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-primary text-center mb-1">
            {isComplete ? 'MATERIALIZATION COMPLETE' : 'MATERIALIZING ASSET'}
          </h3>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {isComplete ? 'Your asset is now a verified Passport' : 'Creating your AI Context Passport'}
          </p>

          {/* Progress Stages */}
          <div className="space-y-3 mb-6">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = currentStage === index;
              const isDone = currentStage > index;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : isDone
                      ? 'border-success/40 bg-success/5'
                      : 'border-muted/30 bg-muted/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDone ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <motion.div
                        className="mt-1 h-1 bg-primary/20 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.1 }}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Button */}
          {isComplete ? (
            <Button
              className="w-full h-12 font-display tracking-wider"
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              VIEW PASSPORT
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full h-10 border-primary/30 text-muted-foreground"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
