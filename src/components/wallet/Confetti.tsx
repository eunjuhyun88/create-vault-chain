import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
];

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: -20, 
                x: `${piece.x}vw`,
                opacity: 1,
                rotate: 0,
                scale: 0
              }}
              animate={{ 
                y: '110vh',
                opacity: [1, 1, 0],
                rotate: piece.rotation + 720,
                scale: [0, 1, 1, 0.5]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reward: number;
  type?: 'task' | 'campaign' | 'claim';
}

export function CelebrationModal({ isOpen, onClose, title, reward, type = 'task' }: CelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isActive={isOpen} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ 
                scale: [0.5, 1.1, 1],
                opacity: 1,
                y: 0,
              }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ 
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="glass-card p-6 text-center max-w-[280px] border border-primary/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Icon */}
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.3,
                  repeat: 2,
                  repeatDelay: 0.5
                }}
                className="text-5xl mb-4"
              >
                {type === 'claim' ? '🎁' : type === 'campaign' ? '🏆' : '🎉'}
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-display font-bold text-foreground mb-2"
              >
                {type === 'claim' ? 'Reward Claimed!' : type === 'campaign' ? 'Campaign Joined!' : 'Task Completed!'}
              </motion.h3>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground mb-4"
              >
                {title}
              </motion.p>

              {/* Reward */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.4,
                  type: 'spring',
                  stiffness: 200,
                  damping: 10
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-warning/20 to-primary/20 border border-primary/30"
              >
                <motion.span
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 15, -15, 0]
                  }}
                  transition={{ 
                    delay: 0.6,
                    duration: 0.5,
                    repeat: 1
                  }}
                  className="text-xl"
                >
                  ⚡
                </motion.span>
                <span className="text-2xl font-display font-bold text-primary">
                  +{reward.toLocaleString()}
                </span>
                <span className="text-sm text-primary">PLART</span>
              </motion.div>

              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 1.5
                  }}
                  className="absolute w-2 h-2 bg-warning rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                />
              ))}

              {/* Close hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-[10px] text-muted-foreground mt-4"
              >
                Tap anywhere to close
              </motion.p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}