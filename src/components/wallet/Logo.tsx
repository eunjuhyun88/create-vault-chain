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
      <div className={`${sizeMap[size]} relative animate-pulse-glow rounded-full`}>
        <img 
          src={logoImage} 
          alt="PlayArts" 
          className="w-full h-full object-contain drop-shadow-[0_0_15px_hsl(75,100%,55%,0.6)]"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold text-primary neon-text tracking-wider">
            PLAYARTS
          </span>
          <span className="text-xs text-muted-foreground tracking-widest">
            WALLET
          </span>
        </div>
      )}
    </div>
  );
}
