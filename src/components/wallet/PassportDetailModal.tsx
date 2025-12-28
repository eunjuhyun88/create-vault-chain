import { motion } from 'framer-motion';
import { PassportAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { 
  Shield, Hash, Clock, Copy, ExternalLink, Share2, 
  RefreshCw, X, Check, Image, Video 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PassportDetailModalProps {
  passport: PassportAsset;
  onClose: () => void;
}

export function PassportDetailModal({ passport, onClose }: PassportDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    toast({
      title: 'Opening MemePing',
      description: 'Share this passport across platforms.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-[360px] max-h-[90vh] overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Preview Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={passport.previewUrl}
            alt="Passport asset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Hologram Overlay */}
          <div className="absolute inset-0 hologram pointer-events-none" />
          
          {/* Type Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
              {passport.assetType === 'video' ? (
                <Video className="w-3 h-3 text-primary" />
              ) : (
                <Image className="w-3 h-3 text-primary" />
              )}
              <span className="text-xs text-foreground">{passport.assetType.toUpperCase()}</span>
            </div>
          </div>

          {/* Trust Level */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-xs text-muted-foreground mr-1">Trust</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Shield
                key={i}
                className={`w-3 h-3 ${
                  i < passport.trustLevel
                    ? 'text-primary fill-primary/30'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[calc(90vh-12rem)] overflow-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <ServiceBadge service={passport.sourceAI} size="md" />
              <p className="text-primary font-display font-semibold mt-2">
                {passport.acpId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">PIM Score</p>
              <p className="text-lg font-display text-primary">
                {passport.pimScore?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Prompt */}
          <div className="glass-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Original Prompt
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {passport.prompt}
            </p>
          </div>

          {/* Proof Details */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Proof Details
            </p>
            
            <div className="space-y-2">
              {[
                { label: 'Crypto Hash', value: passport.cryptoHash, icon: Hash },
                { label: 'Perceptual Hash', value: passport.pHash, icon: Hash },
                { label: 'Evidence CID', value: passport.evidenceCID.slice(0, 20) + '...', icon: ExternalLink },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 glass-card rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs text-foreground font-mono">{item.value}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(
                        item.label === 'Evidence CID' ? passport.evidenceCID : item.value,
                        item.label
                      )}
                      className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                    >
                      {copiedField === item.label ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Created {formatDistanceToNow(passport.timestamp, { addSuffix: true })}</span>
            </div>
            <span className="font-mono">{format(passport.onChainTimestamp, 'MMM dd, yyyy')}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-primary/30"
              onClick={() => handleCopy(passport.acpId, 'ACP ID')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-primary/30"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-primary/30"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Remix
            </Button>
          </div>

          {/* MemePing Share */}
          <Button
            className="w-full h-11 font-display tracking-wider"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            SHARE VIA MEMEPING
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
