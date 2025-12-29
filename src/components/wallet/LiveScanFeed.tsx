import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScannedAsset, AIService, PassportAsset } from '@/types/wallet';
import { AssetCard } from './AssetCard';
import { ScanOverlay } from './ScanOverlay';
import { SessionHandshake } from './SessionHandshake';
import { useWallet } from '@/contexts/WalletContext';
import { useScannedAssets } from '@/hooks/useScannedAssets';
import { Filter, Grid3X3, List, Sparkles, RefreshCw, Radio, Scan, Zap, Activity, Eye, Database, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { MintingModal } from './MintingModal';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/hooks/use-haptic';
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

export function LiveScanFeed({ assets: propAssets, onShareViaMemePing }: LiveScanFeedProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<AIService | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [mintingAsset, setMintingAsset] = useState<ScannedAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showHandshake, setShowHandshake] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  
  const { session, addScannedAsset, setWallet } = useWallet();
  const { assets: dbAssets, isLoading: dbLoading, addAsset: addDbAsset, refetch } = useScannedAssets();
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

  // Merge local and DB assets, prioritizing backend data
  const displayAssets = useMemo(() => {
    if (useBackend && dbAssets.length > 0) {
      return dbAssets;
    }
    if (propAssets.length > 0) {
      return propAssets;
    }
    return demoAssets;
  }, [useBackend, dbAssets, propAssets]);

  const filteredAssets = displayAssets.filter(
    asset => filter === 'all' || asset.sourceAI === filter
  );

  const scanningCount = filteredAssets.filter(a => a.status === 'scanning').length;
  const capturedCount = filteredAssets.filter(a => a.status === 'captured').length;

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

  const simulateScan = async () => {
    haptic.medium();
    setIsScanning(true);
    
    const services: AIService[] = ['midjourney', 'dalle', 'stable', 'runway', 'sora', 'firefly', 'veo', 'chatgpt'];
    const prompts = [
      'A serene Japanese garden with cherry blossoms',
      'Futuristic robot companion in minimalist style',
      'Abstract digital art with flowing particles',
      'Surreal landscape with floating islands',
      'Cyberpunk warrior in neon-lit alley',
      'Ancient temple hidden in misty mountains',
    ];
    const images = [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    ];
    
    const selectedService = services[Math.floor(Math.random() * services.length)];
    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    // Create ghost card (scanning state)
    const scanningAsset: Omit<ScannedAsset, 'id' | 'timestamp'> = {
      prompt: `Generating: ${selectedPrompt}...`,
      previewUrl: '',
      sourceAI: selectedService,
      assetType: Math.random() > 0.7 ? 'video' : 'image',
      status: 'scanning',
    };
    
    // Add to local state first for immediate feedback
    const tempId = 'scan-' + Date.now().toString();
    const tempAsset: ScannedAsset = {
      ...scanningAsset,
      id: tempId,
      timestamp: new Date(),
    };
    addScannedAsset(tempAsset);
    
    toast({ 
      title: '🔍 Session Intercepted', 
      description: `Capturing ${selectedService.toUpperCase()} creation...` 
    });

    // Try to save to backend
    if (useBackend) {
      try {
        await addDbAsset(scanningAsset);
      } catch (err) {
        console.log('Backend save skipped (demo mode)');
      }
    }

    // Convert to captured after scanning animation
    setTimeout(() => {
      haptic.success();
      const capturedAsset: ScannedAsset = {
        ...tempAsset,
        prompt: selectedPrompt,
        status: 'captured',
        previewUrl: images[Math.floor(Math.random() * images.length)],
      };
      addScannedAsset(capturedAsset);
      setIsScanning(false);
      setScanProgress(0);
      toast({ 
        title: '✓ Asset Materialized', 
        description: 'AI creation captured to your feed.' 
      });
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full relative">
      <ScanOverlay />

      {/* Session Handshake Modal */}
      <AnimatePresence>
        {showHandshake && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 z-10"
                onClick={() => setShowHandshake(false)}
              >
                ✕
              </Button>
              <SessionHandshake 
                onSessionEstablished={() => setShowHandshake(false)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <motion.div 
                className={`w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center ${isScanning ? 'animate-pulse-glow' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHandshake(true)}
                role="button"
              >
                <Scan className={`w-5 h-5 text-primary ${isScanning ? 'animate-spin-slow' : ''}`} />
              </motion.div>
              {session.isActive && (
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
                {capturedCount} captured • {scanningCount} scanning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Backend toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${useBackend ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => {
                setUseBackend(!useBackend);
                if (!useBackend) refetch();
              }}
              title={useBackend ? 'Using backend data' : 'Using local data'}
            >
              {useBackend ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            </Button>
            
            <InteractiveButton 
              variant={isScanning ? "default" : "outline"} 
              size="sm" 
              className={`h-8 text-xs gap-1 ${isScanning ? '' : 'border-primary/40'}`}
              onClick={simulateScan}
              disabled={isScanning}
              hapticFeedback="medium"
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
            </InteractiveButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Filter className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={() => setFilter('all')}>All Services</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('midjourney')}>Midjourney</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('dalle')}>DALL·E</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('chatgpt')}>ChatGPT</DropdownMenuItem>
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

      {/* Loading state */}
      {useBackend && dbLoading && (
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Database className="w-6 h-6 text-primary" />
          </motion.div>
          <span className="ml-2 text-sm text-muted-foreground">Loading from backend...</span>
        </div>
      )}

      {/* Feed Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div 
              className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-primary/50" />
            </motion.div>
            <p className="text-sm text-muted-foreground mb-2">No assets detected</p>
            <p className="text-xs text-muted-foreground/60 mb-4">Open an AI service to start scanning</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={simulateScan}
              className="border-primary/40 text-primary"
            >
              <Zap className="w-3 h-3 mr-1" />
              Simulate Scan
            </Button>
          </div>
        ) : (
          <motion.div layout className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            <AnimatePresence mode="popLayout">
              {filteredAssets.map(asset => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onMint={handleMint} 
                  onSelect={handleSelect}
                  isSelected={selectedAssets.includes(asset.id)} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedAssets.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                <span className="text-primary font-bold">{selectedAssets.length}</span> selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAssets([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    // Batch mint logic
                    const firstAsset = displayAssets.find(a => selectedAssets.includes(a.id));
                    if (firstAsset) {
                      setMintingAsset(firstAsset);
                    }
                  }}
                >
                  MINT {selectedAssets.length} ASSETS
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
