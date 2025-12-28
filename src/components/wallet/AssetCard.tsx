import { motion } from 'framer-motion';
import { ScannedAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { Clock, Check, Loader2, Plus, Image, Video, FileText } from 'lucide-react';
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
      {/* Scan Lines for Ghost State */}
      {isGhost && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="scan-line" />
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
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
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className={`w-10 h-10 ${isGhost ? 'text-primary/30' : 'text-primary/50'}`} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isGhost ? (
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SCANNING</span>
            </div>
          ) : isCaptured ? (
            <div className="flex items-center gap-1 bg-success/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-success border border-success/30">
              <Check className="w-3 h-3" />
              <span>CAPTURED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] text-primary border border-primary/30">
              <Check className="w-3 h-3" />
              <span>MINTED</span>
            </div>
          )}
        </div>

        {/* Type Icon Overlay */}
        <div className="absolute bottom-2 left-2">
          <TypeIcon className="w-4 h-4 text-white/70 drop-shadow-lg" />
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

        <p className="text-xs text-foreground/80 line-clamp-2 font-mono leading-relaxed">
          {asset.prompt}
        </p>

        {/* Actions */}
        {showActions && isCaptured && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 h-8 text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onMint?.(asset.id);
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to Wallet
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
