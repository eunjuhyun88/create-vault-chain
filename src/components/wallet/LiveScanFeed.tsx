import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScannedAsset, AIService, PassportAsset } from '@/types/wallet';
import { AssetCard } from './AssetCard';
import { ScanOverlay } from './ScanOverlay';
import { useWallet } from '@/contexts/WalletContext';
import { Filter, Grid3X3, List, Sparkles, RefreshCw, Radio } from 'lucide-react';
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

export function LiveScanFeed({ assets }: LiveScanFeedProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<AIService | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [mintingAsset, setMintingAsset] = useState<ScannedAsset | null>(null);
  const { session, addScannedAsset, setWallet } = useWallet();
  const { toast } = useToast();

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

    // Convert to captured after 2 seconds
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
      toast({ title: 'Asset Captured', description: 'New AI creation detected and saved.' });
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full relative">
      <ScanOverlay />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-display text-sm font-semibold text-foreground">LIVE FEED</h2>
          <span className="text-xs text-muted-foreground">({filteredAssets.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={simulateScan}>
            <RefreshCw className="w-4 h-4" />
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
          <MintingModal asset={mintingAsset} onComplete={handleMintComplete} onClose={() => setMintingAsset(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
