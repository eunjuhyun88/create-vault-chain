import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScannedAsset, AIService, PassportAsset } from '@/types/wallet';
import { AssetCard } from './AssetCard';
import { ScanOverlay } from './ScanOverlay';
import { useWallet } from '@/contexts/WalletContext';
import { Filter, Grid3X3, List, Sparkles, RefreshCw, Radio, Scan, Zap, Activity, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MintingModal } from './MintingModal';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LiveScanFeedProps {
  assets: ScannedAsset[];
  onShareViaMemePing?: (passport: PassportAsset) => void;
}

const demoAssets: ScannedAsset[] = [
  {
    id: 'demo-1',
    prompt: 'A cyberpunk city at night with neon lights and flying cars',
    previewUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    sourceAI: 'midjourney',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 'demo-2',
    prompt: 'Abstract neural network visualization with glowing nodes',
    previewUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    sourceAI: 'dalle',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: 'demo-3',
    prompt: 'Generating: A futuristic space station orbiting Earth...',
    previewUrl: '',
    sourceAI: 'sora',
    assetType: 'video',
    status: 'scanning',
    timestamp: new Date(),
  },
  {
    id: 'demo-4',
    prompt: 'Minimalist logo design for a tech startup',
    previewUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop',
    sourceAI: 'stable',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 1200000),
  },
];

export function LiveScanFeed({ assets, onShareViaMemePing }: LiveScanFeedProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<AIService | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [mintingAsset, setMintingAsset] = useState<ScannedAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { session, addScannedAsset, setWallet } = useWallet();
  const { toast } = useToast();
  
  // Scanner animation effect
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Use demo assets if none provided
  const displayAssets = assets.length > 0 ? assets : demoAssets;

  const filteredAssets = displayAssets.filter(
    asset => filter === 'all' || asset.sourceAI === filter
  );

  const handleSelect = (id: string) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleMint = (id: string) => {
    const asset = displayAssets.find(a => a.id === id);
    if (asset) {
      setMintingAsset(asset);
    }
  };

  const handleMintComplete = (passport: PassportAsset) => {
    // Add the passport to wallet
    setWallet(prev => ({
      ...prev,
      scannedAssets: prev.scannedAssets.filter(a => a.id !== mintingAsset?.id),
      mintedPassports: [passport, ...prev.mintedPassports],
    }));
    toast({
      title: 'ACP Minted Successfully',
      description: `${passport.acpId} is now in your vault.`,
    });
    setMintingAsset(null);
  };

  const simulateScan = () => {
    setIsScanning(true);
    const services: AIService[] = ['midjourney', 'dalle', 'stable', 'runway', 'sora', 'firefly', 'veo', 'chatgpt'];
    const prompts = [
      'A serene Japanese garden with cherry blossoms',
      'Futuristic robot companion in minimalist style',
      'Abstract digital art with flowing particles',
      'Surreal landscape with floating islands',
    ];
    const newAsset: ScannedAsset = {
      id: 'scan-' + Date.now().toString(),
      prompt: prompts[Math.floor(Math.random() * prompts.length)],
      previewUrl: '',
      sourceAI: services[Math.floor(Math.random() * services.length)],
      assetType: Math.random() > 0.7 ? 'video' : 'image',
      status: 'scanning',
      timestamp: new Date(),
    };
    addScannedAsset(newAsset);
    toast({ 
      title: '🔍 Session Detected', 
      description: `Scanning ${newAsset.sourceAI.toUpperCase()} session...` 
    });

    // Convert to captured after scanning animation
    setTimeout(() => {
      const images = [
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
      ];
      addScannedAsset({
        ...newAsset,
        status: 'captured',
        previewUrl: images[Math.floor(Math.random() * images.length)],
      });
      setIsScanning(false);
      setScanProgress(0);
      toast({ 
        title: '✓ Asset Captured', 
        description: 'AI creation materialized to your feed.' 
      });
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full relative">
      <ScanOverlay />

      {/* Scanner Header */}
      <div className="relative border-b border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Scanning Progress Bar */}
        {isScanning && (
          <motion.div 
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.05 }}
          />
        )}
        
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center ${isScanning ? 'animate-pulse-glow' : ''}`}>
                <Scan className={`w-5 h-5 text-primary ${isScanning ? 'animate-spin-slow' : ''}`} />
              </div>
              {isScanning && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                SESSION SCANNER
                {isScanning && (
                  <motion.span 
                    className="text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    ACTIVE
                  </motion.span>
                )}
              </h2>
              <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                <Activity className="w-3 h-3" />
                {filteredAssets.length} assets detected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant={isScanning ? "default" : "outline"} 
              size="sm" 
              className={`h-8 text-xs gap-1 ${isScanning ? '' : 'border-primary/40'}`}
              onClick={simulateScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Eye className="w-3 h-3 animate-pulse" />
                  SCANNING...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  SCAN
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Filter className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={() => setFilter('all')}>All Services</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('midjourney')}>Midjourney</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('dalle')}>DALL·E</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('stable')}>Stable Diffusion</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('runway')}>Runway</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('sora')}>Sora</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
              {view === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Active Session Indicator */}
        {isScanning && (
          <motion.div 
            className="px-4 pb-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
              <div className="relative flex items-center justify-center w-4 h-4">
                <div className="absolute w-4 h-4 bg-primary/30 rounded-full animate-ping" />
                <Radio className="w-3 h-3 relative z-10" />
              </div>
              <span>Intercepting AI session data stream...</span>
              <span className="ml-auto font-mono">{scanProgress}%</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No assets detected</p>
            <p className="text-xs text-muted-foreground/60">Open an AI service to start scanning</p>
          </div>
        ) : (
          <motion.div layout className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            <AnimatePresence mode="popLayout">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} onMint={handleMint} onSelect={handleSelect}
                  isSelected={selectedAssets.includes(asset.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Minting Modal */}
      <AnimatePresence>
        {mintingAsset && (
          <MintingModal 
            asset={mintingAsset} 
            onComplete={handleMintComplete} 
            onClose={() => setMintingAsset(null)}
            onShareViaMemePing={onShareViaMemePing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
