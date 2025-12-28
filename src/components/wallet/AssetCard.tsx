import { motion } from 'framer-motion';
import { ScannedAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { Clock, Check, Loader2, Plus, Image, Video, FileText, Scan, Zap, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface AssetCardProps {
  asset: ScannedAsset;
  onMint?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  showActions?: boolean;
}

const typeIcons = {
  image: Image,
  video: Video,
  text: FileText,
};

export function AssetCard({ 
  asset, 
  onMint, 
  onSelect, 
  isSelected = false,
  showActions = true 
}: AssetCardProps) {
  const isGhost = asset.status === 'scanning';
  const isCaptured = asset.status === 'captured';
  const TypeIcon = typeIcons[asset.assetType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-lg border overflow-hidden cursor-pointer transition-all duration-300
        ${isGhost ? 'ghost-card' : 'solid-card'}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
      `}
      onClick={() => onSelect?.(asset.id)}
    >
      {/* Enhanced Scan Effect for Ghost State */}
      {isGhost && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {/* Multiple scan lines */}
          <motion.div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ y: ['-10%', '500%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div 
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            animate={{ y: ['-10%', '500%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.3 }}
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary" />
          {/* Glowing overlay */}
          <motion.div 
            className="absolute inset-0 bg-primary/5"
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      )}

      {/* Preview Area */}
      <div className="relative h-32 bg-muted/30 overflow-hidden">
        {asset.previewUrl ? (
          <img 
            src={asset.previewUrl} 
            alt="Asset preview" 
            className={`w-full h-full object-cover ${isGhost ? 'opacity-50 blur-sm' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {isGhost ? (
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Scan className="w-12 h-12 text-primary/50" />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-16 h-16 border border-primary/30 rounded-full border-t-primary" />
                </motion.div>
              </motion.div>
            ) : (
              <TypeIcon className="w-10 h-10 text-primary/50" />
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isGhost ? (
            <motion.div 
              className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-[10px] text-primary border border-primary/40"
              animate={{ borderColor: ['hsl(75 100% 55% / 0.4)', 'hsl(75 100% 55% / 0.8)', 'hsl(75 100% 55% / 0.4)'] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Radio className="w-3 h-3" />
              </motion.div>
              <span className="font-display font-bold tracking-wider">SCANNING</span>
            </motion.div>
          ) : isCaptured ? (
            <div className="flex items-center gap-1 bg-success/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-success border border-success/30">
              <Zap className="w-3 h-3" />
              <span className="font-display font-bold">CAPTURED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-primary border border-primary/30">
              <Check className="w-3 h-3" />
              <span className="font-display font-bold">MINTED</span>
            </div>
          )}
        </div>

        {/* Type Icon Overlay */}
        <div className="absolute bottom-2 left-2">
          <TypeIcon className="w-4 h-4 text-foreground/70 drop-shadow-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <ServiceBadge service={asset.sourceAI} size="sm" />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(asset.timestamp, { addSuffix: true })}</span>
          </div>
        </div>

        <p className={`text-xs text-foreground/80 line-clamp-2 font-mono leading-relaxed ${isGhost ? 'animate-pulse' : ''}`}>
          {isGhost ? (
            <span className="text-primary/70">Intercepting: {asset.prompt}</span>
          ) : (
            asset.prompt
          )}
        </p>

        {/* Actions */}
        {showActions && isCaptured && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 h-8 text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all group"
            onClick={(e) => {
              e.stopPropagation();
              onMint?.(asset.id);
            }}
          >
            <Plus className="w-3 h-3 mr-1 group-hover:rotate-90 transition-transform" />
            MATERIALIZE TO WALLET
          </Button>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}
