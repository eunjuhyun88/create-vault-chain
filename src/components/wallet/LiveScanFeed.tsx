import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScannedAsset, AIService } from '@/types/wallet';
import { AssetCard } from './AssetCard';
import { ScanOverlay } from './ScanOverlay';
import { useWallet } from '@/contexts/WalletContext';
import { Filter, Grid3X3, List, Sparkles, RefreshCw, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MintingModal } from './MintingModal';
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
    id: '1',
    prompt: 'A cyberpunk city at night with neon lights and flying cars',
    previewUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    sourceAI: 'midjourney',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    prompt: 'Abstract neural network visualization with glowing nodes',
    previewUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    sourceAI: 'dalle',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '3',
    prompt: 'Generating: A futuristic space station orbiting Earth...',
    previewUrl: '',
    sourceAI: 'sora',
    assetType: 'video',
    status: 'scanning',
    timestamp: new Date(),
  },
  {
    id: '4',
    prompt: 'Minimalist logo design for a tech startup',
    previewUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop',
    sourceAI: 'stable',
    assetType: 'image',
    status: 'captured',
    timestamp: new Date(Date.now() - 1200000),
  },
  {
    id: '5',
    prompt: 'A short video of ocean waves at sunset',
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    sourceAI: 'runway',
    assetType: 'video',
    status: 'minted',
    timestamp: new Date(Date.now() - 1800000),
  },
];

export function LiveScanFeed({ assets }: LiveScanFeedProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<AIService | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [mintingAssetId, setMintingAssetId] = useState<string | null>(null);
  const { session, addScannedAsset, mintAsset } = useWallet();

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

  const handleMint = async (id: string) => {
    setMintingAssetId(id);
  };

  const handleMintComplete = async () => {
    if (mintingAssetId) {
      await mintAsset(mintingAssetId);
      setMintingAssetId(null);
    }
  };

  const simulateScan = () => {
    const services: AIService[] = ['midjourney', 'dalle', 'stable', 'runway', 'sora', 'firefly', 'veo', 'chatgpt'];
    const newAsset: ScannedAsset = {
      id: Date.now().toString(),
      prompt: 'Newly scanned AI creation from active session...',
      previewUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=400&h=300&fit=crop`,
      sourceAI: services[Math.floor(Math.random() * services.length)],
      assetType: Math.random() > 0.7 ? 'video' : 'image',
      status: 'scanning',
      timestamp: new Date(),
    };
    addScannedAsset(newAsset);

    // Convert to captured after 2 seconds
    setTimeout(() => {
      addScannedAsset({ ...newAsset, status: 'captured' });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full relative">
      <ScanOverlay />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-display text-sm font-semibold text-foreground">
            LIVE FEED
          </h2>
          <span className="text-xs text-muted-foreground">
            ({filteredAssets.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={simulateScan}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('midjourney')}>
                Midjourney
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('dalle')}>
                DALL·E
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('stable')}>
                Stable Diffusion
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('runway')}>
                Runway
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('sora')}>
                Sora
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          >
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
            <p className="text-xs text-muted-foreground/60">
              Open an AI service to start scanning
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className={`${
              view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
            }`}
          >
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

      {/* Minting Modal */}
      <AnimatePresence>
        {mintingAssetId && (
          <MintingModal
            asset={displayAssets.find(a => a.id === mintingAssetId)!}
            onComplete={handleMintComplete}
            onClose={() => setMintingAssetId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
