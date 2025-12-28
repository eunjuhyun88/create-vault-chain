import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassportAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { 
  X, Twitter, Send, Globe, Copy, Check, ExternalLink,
  MessageCircle, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface MemePingModalProps {
  asset: PassportAsset;
  onClose: () => void;
  onShare: (platform: string, caption: string) => void;
}

const platforms = [
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'bg-[#1DA1F2]/20 border-[#1DA1F2]/40 text-[#1DA1F2]' },
  { id: 'farcaster', label: 'Farcaster', icon: MessageCircle, color: 'bg-[#8A63D2]/20 border-[#8A63D2]/40 text-[#8A63D2]' },
  { id: 'lens', label: 'Lens Protocol', icon: Globe, color: 'bg-[#00501E]/20 border-[#00501E]/40 text-[#ABFE2C]' },
];

export function MemePingModal({ asset, onClose, onShare }: MemePingModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [caption, setCaption] = useState(
    `Check out my AI creation! 🎨\n\nPrompt: "${asset.prompt.slice(0, 100)}${asset.prompt.length > 100 ? '...' : ''}"\n\n#PlayArts #AIArt #${asset.sourceAI}`
  );
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://playarts.io/acp/${asset.acpId}`);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share link has been copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!selectedPlatform) {
      toast({
        title: 'Select a platform',
        description: 'Please choose where to share.',
        variant: 'destructive',
      });
      return;
    }

    onShare(selectedPlatform, caption);
    toast({
      title: 'Shared successfully!',
      description: `Your passport has been shared to ${platforms.find(p => p.id === selectedPlatform)?.label}.`,
    });
    onClose();
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
        className="glass-card w-[360px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <h3 className="font-display text-sm font-semibold">MEMEPING SHARE</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Asset Preview */}
          <div className="flex gap-3 p-3 glass-card rounded-lg">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {asset.previewUrl ? (
                <img src={asset.previewUrl} alt="Asset" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <ServiceBadge service={asset.sourceAI} size="sm" />
              <p className="text-[10px] text-primary font-mono mt-1">{asset.acpId}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                {asset.prompt}
              </p>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Select Platform</p>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform === platform.id;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                      ${isSelected 
                        ? `${platform.color} ring-2 ring-primary` 
                        : 'border-border/30 hover:border-primary/30'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{platform.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Caption</p>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px] text-xs bg-input border-primary/20 resize-none"
              placeholder="Write a caption..."
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {caption.length}/280
            </p>
          </div>

          {/* Share Link */}
          <div className="flex items-center gap-2 p-2 glass-card rounded-lg">
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-xs text-foreground font-mono truncate">
              playarts.io/acp/{asset.acpId}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:bg-primary/10 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 border-primary/30"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 font-display tracking-wider"
              onClick={handleShare}
            >
              <Send className="w-4 h-4 mr-2" />
              SHARE
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
