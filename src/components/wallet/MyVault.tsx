import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassportAsset, AssetType } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';
import { 
  Image, Video, FileText, Filter, Grid3X3, List, 
  Calendar, Shield, Hash, Clock, Vault, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { PassportDetailModal } from './PassportDetailModal';

const demoPassports: PassportAsset[] = [
  {
    id: '1',
    prompt: 'A cyberpunk city at night with neon lights and flying cars in ultra HD quality',
    previewUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    sourceAI: 'midjourney',
    assetType: 'image',
    status: 'minted',
    timestamp: new Date(Date.now() - 86400000),
    acpId: 'ACP_7X9KM3NP2',
    cryptoHash: 'SHA256_8f7e6d5c4b3a2190',
    pHash: 'PHASH_a1b2c3d4e5f6',
    evidenceCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    trustLevel: 3,
    onChainTimestamp: new Date(Date.now() - 86400000),
    pimScore: 15420,
  },
  {
    id: '2',
    prompt: 'Abstract neural network visualization with glowing nodes and connections',
    previewUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    sourceAI: 'dalle',
    assetType: 'image',
    status: 'minted',
    timestamp: new Date(Date.now() - 172800000),
    acpId: 'ACP_4L2MN8QR5',
    cryptoHash: 'SHA256_1a2b3c4d5e6f7890',
    pHash: 'PHASH_f6e5d4c3b2a1',
    evidenceCID: 'bafybeid3wj3s7bcxvz7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7',
    trustLevel: 2,
    onChainTimestamp: new Date(Date.now() - 172800000),
    pimScore: 8750,
  },
  {
    id: '3',
    prompt: 'Cinematic video of a spaceship entering a wormhole',
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    sourceAI: 'runway',
    assetType: 'video',
    status: 'minted',
    timestamp: new Date(Date.now() - 259200000),
    acpId: 'ACP_9P3KL7MN4',
    cryptoHash: 'SHA256_0f1e2d3c4b5a6789',
    pHash: 'PHASH_1a2b3c4d5e6f',
    evidenceCID: 'bafybeif3j3s7bcxvz7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v7v2v',
    trustLevel: 3,
    onChainTimestamp: new Date(Date.now() - 259200000),
    pimScore: 42100,
  },
];

const typeFilters: { value: AssetType | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Grid3X3 },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'text', label: 'Text', icon: FileText },
];

export function MyVault() {
  const [view, setView] = useState<'grid' | 'timeline'>('grid');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassport, setSelectedPassport] = useState<PassportAsset | null>(null);

  const filteredPassports = demoPassports.filter(passport => {
    const matchesType = typeFilter === 'all' || passport.assetType === typeFilter;
    const matchesSearch = passport.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPIM = demoPassports.reduce((sum, p) => sum + (p.pimScore || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Vault className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              MY VAULT
            </h2>
            <span className="text-xs text-muted-foreground">
              ({demoPassports.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setView(view === 'grid' ? 'timeline' : 'grid')}
            >
              {view === 'grid' ? <Calendar className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Total PIM:</span>
            <span className="text-primary font-semibold">{totalPIM.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-3 space-y-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search passports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-input border-primary/20 h-9 text-sm"
          />
        </div>

        <div className="flex gap-2">
          {typeFilters.map(filter => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.value}
                variant={typeFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-[10px] ${
                  typeFilter !== filter.value ? 'border-primary/20' : ''
                }`}
                onClick={() => setTypeFilter(filter.value)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Vault Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {filteredPassports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <Vault className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">No passports found</p>
            <p className="text-xs text-muted-foreground/60">
              Mint assets from Live Feed to add them here
            </p>
          </div>
        ) : view === 'grid' ? (
          <motion.div layout className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredPassports.map((passport, index) => (
                <motion.div
                  key={passport.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPassport(passport)}
                >
                  {/* Preview */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={passport.previewUrl}
                      alt="Passport"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    
                    {/* Trust Level Badge */}
                    <div className="absolute top-2 right-2 flex">
                      {Array.from({ length: passport.trustLevel }).map((_, i) => (
                        <Shield key={i} className="w-3 h-3 text-primary fill-primary/30" />
                      ))}
                    </div>

                    {/* Type Icon */}
                    <div className="absolute bottom-2 left-2">
                      {passport.assetType === 'video' ? (
                        <Video className="w-4 h-4 text-white/70" />
                      ) : (
                        <Image className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-2 space-y-1">
                    <ServiceBadge service={passport.sourceAI} size="sm" />
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {passport.prompt}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-primary font-mono">{passport.acpId}</span>
                      <span className="text-muted-foreground">
                        {passport.pimScore?.toLocaleString()} PIM
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredPassports.map((passport, index) => (
              <motion.div
                key={passport.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-3 flex gap-3 cursor-pointer"
                onClick={() => setSelectedPassport(passport)}
              >
                <img
                  src={passport.previewUrl}
                  alt="Passport"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ServiceBadge service={passport.sourceAI} size="sm" />
                    <span className="text-[10px] text-primary font-mono">{passport.acpId}</span>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2 mb-1">
                    {passport.prompt}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(passport.timestamp, { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {passport.pimScore?.toLocaleString()} PIM
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Passport Detail Modal */}
      <AnimatePresence>
        {selectedPassport && (
          <PassportDetailModal
            passport={selectedPassport}
            onClose={() => setSelectedPassport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
