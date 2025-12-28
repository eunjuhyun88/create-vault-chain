import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScannedAsset, PassportAsset } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { Shield, Hash, Lock, Check, Loader2, Send, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MintingModalProps {
  asset: ScannedAsset;
  onComplete: (passport: PassportAsset) => void;
  onClose: () => void;
  onShareViaMemePing?: (passport: PassportAsset) => void;
}

const stages = [
  { id: 'hash', label: 'Computing 3-Hash', sublabel: 'SHA256 + pHash + Semantic', icon: Hash },
  { id: 'encrypt', label: 'Encrypting Data', sublabel: 'Evidence Bundle Creation', icon: Lock },
  { id: 'chain', label: 'Registering On-Chain', sublabel: 'Base L2 Transaction', icon: Shield },
  { id: 'complete', label: 'ACP Minted', sublabel: 'Passport Ready', icon: Check },
];

export function MintingModal({ asset, onComplete, onClose, onShareViaMemePing }: MintingModalProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mintedPassport, setMintedPassport] = useState<PassportAsset | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= stages.length - 1) {
          clearInterval(interval);
          setIsComplete(true);
          const passport: PassportAsset = {
            ...asset,
            status: 'minted',
            acpId: 'ACP_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            cryptoHash: 'SHA256_' + Math.random().toString(36).substr(2, 16),
            pHash: 'PHASH_' + Math.random().toString(36).substr(2, 12),
            evidenceCID: 'bafybei' + Math.random().toString(36).substr(2, 46),
            trustLevel: 3,
            onChainTimestamp: new Date(),
            pimScore: 0,
          };
          setMintedPassport(passport);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [asset]);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied!', description: `${label} copied to clipboard.` });
  };

  const handleViewPassport = () => {
    if (mintedPassport) {
      onComplete(mintedPassport);
    }
    onClose();
  };

  const handleShareMemePing = () => {
    if (mintedPassport && onShareViaMemePing) {
      onShareViaMemePing(mintedPassport);
    }
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget && isComplete) onClose(); }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 w-[340px] relative overflow-hidden">
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10"
            animate={{ y: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
        </div>

        <div className="relative z-10">
          <div className="relative h-28 rounded-lg overflow-hidden mb-4 border border-primary/20">
            {asset.previewUrl ? (
              <img src={asset.previewUrl} alt="Asset" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-2 left-2"><ServiceBadge service={asset.sourceAI} size="sm" /></div>
          </div>

          <h3 className="font-display text-lg font-bold text-primary text-center mb-1">
            {isComplete ? 'ACP REGISTRATION COMPLETE' : 'REGISTERING ACP'}
          </h3>
          <p className="text-xs text-muted-foreground text-center mb-4">
            {isComplete ? 'Your AI Context Passport is verified' : 'Creating your AI Context Passport'}
          </p>

          {!isComplete && (
            <div className="space-y-2 mb-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = currentStage === index;
                const isDone = currentStage > index;
                return (
                  <motion.div key={stage.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      isActive ? 'border-primary bg-primary/10' : isDone ? 'border-success/40 bg-success/5' : 'border-muted/30 bg-muted/5'
                    }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'}`}>
                        {stage.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{stage.sublabel}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {isComplete && mintedPassport && (
            <div className="space-y-3 mb-4">
              <div className="glass-card p-3 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">ACP ID</p>
                    <p className="text-sm font-display font-bold text-primary">{mintedPassport.acpId}</p>
                  </div>
                  <button onClick={() => handleCopy(mintedPassport.acpId, 'ACP ID')}
                    className="p-2 hover:bg-primary/10 rounded transition-colors">
                    <Copy className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Crypto Hash</p>
                  <p className="text-[10px] font-mono text-foreground truncate">{mintedPassport.cryptoHash}</p>
                </div>
                <div className="glass-card p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">pHash</p>
                  <p className="text-[10px] font-mono text-foreground truncate">{mintedPassport.pHash}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-xs text-muted-foreground">Trust Level:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(level => (
                    <Shield key={level}
                      className={`w-4 h-4 ${level <= mintedPassport.trustLevel ? 'text-primary fill-primary/30' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate font-mono">{mintedPassport.evidenceCID.slice(0, 30)}...</span>
              </div>
            </div>
          )}

          {isComplete ? (
            <div className="space-y-2">
              <Button className="w-full h-10 font-display tracking-wider" onClick={handleShareMemePing}>
                <Send className="w-4 h-4 mr-2" />SHARE VIA MEMEPING
              </Button>
              <Button variant="outline" className="w-full h-9 border-primary/30" onClick={handleViewPassport}>
                View in Vault
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-9 border-primary/30 text-muted-foreground" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
