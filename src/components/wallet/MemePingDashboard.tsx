import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassportAsset, MemePingEvent } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { 
  Send, TrendingUp, Eye, Heart, Share2, MessageCircle, Repeat2, 
  Hash, ExternalLink, Twitter, Globe, Filter, RefreshCw, Sparkles,
  Image, ChevronRight, Plus, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MemePingModal } from './MemePingModal';

interface MemePingPost {
  id: string;
  platform: 'twitter' | 'farcaster' | 'lens';
  postUrl: string;
  content: string;
  timestamp: Date;
  asset: PassportAsset;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    quotes: number;
    remixes: number;
  };
  pimEarned: number;
  status: 'tracking' | 'viral' | 'completed';
}

const demoPosts: MemePingPost[] = [
  {
    id: '1',
    platform: 'twitter',
    postUrl: 'https://twitter.com/user/status/123',
    content: 'Check out my AI creation! 🎨 A cyberpunk city at night... #PlayArts #AIArt',
    timestamp: new Date(Date.now() - 7200000),
    asset: {
      id: '1', prompt: 'A cyberpunk city at night with neon lights',
      previewUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
      sourceAI: 'midjourney', assetType: 'image', status: 'minted',
      timestamp: new Date(Date.now() - 86400000), acpId: 'ACP_7X9KM3NP2',
      cryptoHash: 'SHA256_8f7e6d5c4b3a2190', pHash: 'PHASH_a1b2c3d4e5f6',
      evidenceCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      trustLevel: 3, onChainTimestamp: new Date(Date.now() - 86400000), pimScore: 15420,
    },
    metrics: { views: 12450, likes: 847, shares: 234, quotes: 56, remixes: 12 },
    pimEarned: 18420,
    status: 'viral',
  },
  {
    id: '2',
    platform: 'farcaster',
    postUrl: 'https://warpcast.com/user/cast/456',
    content: 'Generated this neural network vis using DALL·E 3. Proof on-chain via PlayArts! 🧠',
    timestamp: new Date(Date.now() - 14400000),
    asset: {
      id: '2', prompt: 'Abstract neural network visualization with glowing nodes',
      previewUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
      sourceAI: 'dalle', assetType: 'image', status: 'minted',
      timestamp: new Date(Date.now() - 172800000), acpId: 'ACP_4L2MN8QR5',
      cryptoHash: 'SHA256_1a2b3c4d5e6f7890', pHash: 'PHASH_f6e5d4c3b2a1',
      evidenceCID: 'bafybeid3wj3s7bcxvz7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7',
      trustLevel: 2, onChainTimestamp: new Date(Date.now() - 172800000), pimScore: 8750,
    },
    metrics: { views: 3200, likes: 245, shares: 67, quotes: 23, remixes: 5 },
    pimEarned: 5430,
    status: 'tracking',
  },
  {
    id: '3',
    platform: 'twitter',
    postUrl: 'https://twitter.com/user/status/789',
    content: 'My Runway-generated video entering the wormhole 🚀 #AIVideo #Runway',
    timestamp: new Date(Date.now() - 43200000),
    asset: {
      id: '3', prompt: 'Cinematic video of a spaceship entering a wormhole',
      previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
      sourceAI: 'runway', assetType: 'video', status: 'minted',
      timestamp: new Date(Date.now() - 259200000), acpId: 'ACP_9P3KL7MN4',
      cryptoHash: 'SHA256_0f1e2d3c4b5a6789', pHash: 'PHASH_1a2b3c4d5e6f',
      evidenceCID: 'bafybeif3j3s7bcxvz7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v',
      trustLevel: 3, onChainTimestamp: new Date(Date.now() - 259200000), pimScore: 42100,
    },
    metrics: { views: 89000, likes: 5420, shares: 1890, quotes: 342, remixes: 78 },
    pimEarned: 156780,
    status: 'viral',
  },
];

const platformIcons = {
  twitter: Twitter,
  farcaster: MessageCircle,
  lens: Globe,
};

const platformColors = {
  twitter: 'text-[#1DA1F2]',
  farcaster: 'text-[#8A63D2]',
  lens: 'text-[#ABFE2C]',
};

export function MemePingDashboard() {
  const [posts] = useState<MemePingPost[]>(demoPosts);
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'twitter' | 'farcaster' | 'lens'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAssetForShare, setSelectedAssetForShare] = useState<PassportAsset | null>(null);

  const filteredPosts = posts.filter(p => filterPlatform === 'all' || p.platform === filterPlatform);

  const totalPIM = posts.reduce((sum, p) => sum + p.pimEarned, 0);
  const totalViews = posts.reduce((sum, p) => sum + p.metrics.views, 0);
  const viralCount = posts.filter(p => p.status === 'viral').length;

  const handleShare = (platform: string, caption: string) => {
    console.log('Sharing to', platform, caption);
    setShowShareModal(false);
    setSelectedAssetForShare(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">MEMEPING</h2>
          </div>
          <Button size="sm" className="h-7 text-[10px]" onClick={() => setShowShareModal(true)}>
            <Plus className="w-3 h-3 mr-1" />New Post
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-2 text-center">
            <TrendingUp className="w-3 h-3 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-primary">{totalPIM.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Total PIM</p>
          </div>
          <div className="glass-card p-2 text-center">
            <Eye className="w-3 h-3 text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold text-primary">{(totalViews / 1000).toFixed(1)}K</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
          </div>
          <div className="glass-card p-2 text-center">
            <Zap className="w-3 h-3 text-warning mx-auto mb-1" />
            <p className="text-xs font-semibold text-warning">{viralCount}</p>
            <p className="text-[10px] text-muted-foreground">Viral</p>
          </div>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2 px-4 py-2 border-b border-border/30">
        {(['all', 'twitter', 'farcaster', 'lens'] as const).map((platform) => {
          const Icon = platform === 'all' ? Filter : platformIcons[platform];
          return (
            <Button key={platform} variant={filterPlatform === platform ? 'default' : 'outline'} size="sm"
              className={`h-7 text-[10px] ${filterPlatform !== platform ? 'border-primary/20' : ''}`}
              onClick={() => setFilterPlatform(platform)}>
              <Icon className="w-3 h-3 mr-1" />
              {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Button>
          );
        })}
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Send className="w-12 h-12 text-primary/30 mb-4" />
            <p className="text-sm text-muted-foreground">No posts yet</p>
            <p className="text-xs text-muted-foreground/60">Share your minted assets to start earning PIM</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredPosts.map((post, index) => {
              const PlatformIcon = platformIcons[post.platform];
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }} className="glass-card overflow-hidden">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-border/20">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={post.asset.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformIcon className={`w-4 h-4 ${platformColors[post.platform]}`} />
                        <ServiceBadge service={post.asset.sourceAI} size="sm" />
                        {post.status === 'viral' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />VIRAL
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-foreground line-clamp-1">{post.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-5 gap-1 p-2 bg-muted/20">
                    <div className="text-center">
                      <Eye className="w-3 h-3 text-muted-foreground mx-auto" />
                      <p className="text-[10px] text-foreground font-semibold">{(post.metrics.views / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="text-center">
                      <Heart className="w-3 h-3 text-destructive mx-auto" />
                      <p className="text-[10px] text-foreground font-semibold">{post.metrics.likes}</p>
                    </div>
                    <div className="text-center">
                      <Repeat2 className="w-3 h-3 text-success mx-auto" />
                      <p className="text-[10px] text-foreground font-semibold">{post.metrics.shares}</p>
                    </div>
                    <div className="text-center">
                      <MessageCircle className="w-3 h-3 text-primary mx-auto" />
                      <p className="text-[10px] text-foreground font-semibold">{post.metrics.quotes}</p>
                    </div>
                    <div className="text-center">
                      <Sparkles className="w-3 h-3 text-warning mx-auto" />
                      <p className="text-[10px] text-foreground font-semibold">{post.metrics.remixes}</p>
                    </div>
                  </div>

                  {/* PIM Earned */}
                  <div className="flex items-center justify-between px-3 py-2 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-mono">{post.asset.acpId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-xs font-semibold text-success">+{post.pimEarned.toLocaleString()} PIM</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 p-2 border-t border-border/20">
                    <Button variant="ghost" size="sm" className="flex-1 h-7 text-[10px]">
                      <RefreshCw className="w-3 h-3 mr-1" />Refresh
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 h-7 text-[10px]" asChild>
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />View Post
                      </a>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedAssetForShare && (
          <MemePingModal
            asset={selectedAssetForShare}
            onClose={() => { setShowShareModal(false); setSelectedAssetForShare(null); }}
            onShare={handleShare}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
