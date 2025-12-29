import { motion } from 'framer-motion';
import logoImage from '@/assets/playarts-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div 
        className={`${sizeMap[size]} relative`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full animate-pulse-glow" />
        <motion.div 
          className="absolute -inset-1 rounded-full border border-primary/20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <img 
          src={logoImage} 
          alt="PlayArts" 
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_hsl(75,100%,55%,0.7)]"
        />
      </motion.div>
      
      {showText && (
        <div className="flex flex-col">
          <motion.span 
            className="font-display text-lg font-bold text-primary neon-text tracking-wider"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            PLAYARTS
          </motion.span>
          <motion.span 
            className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Passport
          </motion.span>
        </div>
      )}
    </div>
  );
}
