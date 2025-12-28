import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Users, TrendingUp, Clock, Sparkles, Eye, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ExplorePost {
  id: string;
  creator: {
    name: string;
    avatar: string;
    isFollowing: boolean;
    followers: number;
  };
  imageUrl: string;
  prompt: string;
  sourceAI: string;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  timestamp: Date;
  pimScore: number;
}

const mockPosts: ExplorePost[] = [
  {
    id: '1',
    creator: { name: 'CyberArtist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber', isFollowing: false, followers: 2340 },
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=400&h=400&fit=crop',
    prompt: 'Neon cityscape with flying cars, cyberpunk aesthetic',
    sourceAI: 'midjourney',
    likes: 1243,
    comments: 89,
    views: 5420,
    isLiked: false,
    timestamp: new Date(Date.now() - 3600000),
    pimScore: 8500,
  },
  {
    id: '2',
    creator: { name: 'DigitalDreamer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dream', isFollowing: true, followers: 5120 },
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    prompt: 'Abstract digital art with flowing colors and geometric shapes',
    sourceAI: 'dalle',
    likes: 892,
    comments: 45,
    views: 3210,
    isLiked: true,
    timestamp: new Date(Date.now() - 7200000),
    pimScore: 6200,
  },
  {
    id: '3',
    creator: { name: 'AIExplorer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=explorer', isFollowing: false, followers: 1890 },
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop',
    prompt: 'Futuristic robot portrait with holographic elements',
    sourceAI: 'stable-diffusion',
    likes: 567,
    comments: 23,
    views: 1890,
    isLiked: false,
    timestamp: new Date(Date.now() - 14400000),
    pimScore: 4300,
  },
  {
    id: '4',
    creator: { name: 'NeonMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neon', isFollowing: false, followers: 3450 },
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop',
    prompt: 'Mystical forest with bioluminescent creatures',
    sourceAI: 'midjourney',
    likes: 2103,
    comments: 156,
    views: 8920,
    isLiked: true,
    timestamp: new Date(Date.now() - 21600000),
    pimScore: 12500,
  },
];

const trendingCreators = [
  { name: 'ArtMachine', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=art', followers: 12500, isFollowing: false },
  { name: 'PixelWizard', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel', followers: 8900, isFollowing: true },
  { name: 'DreamForge', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=forge', followers: 6780, isFollowing: false },
];

const getServiceColor = (service: string) => {
  const colors: Record<string, string> = {
    'midjourney': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    'dalle': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'stable-diffusion': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    'sora': 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  };
  return colors[service] || 'bg-primary/20 text-primary border-primary/40';
};

export function ExploreDashboard() {
  const [posts, setPosts] = useState(mockPosts);
  const [creators, setCreators] = useState(trendingCreators);
  const [activeTab, setActiveTab] = useState('trending');

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleFollow = (creatorName: string, isInPost: boolean = false) => {
    if (isInPost) {
      setPosts(prev => prev.map(post => 
        post.creator.name === creatorName 
          ? { ...post, creator: { ...post.creator, isFollowing: !post.creator.isFollowing } }
          : post
      ));
    } else {
      setCreators(prev => prev.map(creator => 
        creator.name === creatorName 
          ? { ...creator, isFollowing: !creator.isFollowing }
          : creator
      ));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-bold text-primary">Explore</h2>
          </div>
          <TabsList className="w-full bg-muted/30">
            <TabsTrigger value="trending" className="flex-1 gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="latest" className="flex-1 gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex-1 gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />
              Creators
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trending" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-0">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {posts.sort((a, b) => b.pimScore - a.pimScore).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-3 space-y-3"
                >
                  {/* Creator Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={post.creator.avatar} alt={post.creator.name} className="w-8 h-8 rounded-full bg-muted" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{post.creator.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatNumber(post.creator.followers)} followers</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={post.creator.isFollowing ? "secondary" : "default"}
                      className="h-7 text-xs gap-1"
                      onClick={() => handleFollow(post.creator.name, true)}
                    >
                      {post.creator.isFollowing ? (
                        <>
                          <Check className="w-3 h-3" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={post.imageUrl} alt="AI Art" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getServiceColor(post.sourceAI)}`}>
                        {post.sourceAI}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-mono text-primary">{formatNumber(post.pimScore)}</span>
                    </div>
                  </div>

                  {/* Prompt */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.prompt}</p>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-destructive text-destructive' : ''}`} />
                        <span className="text-xs">{formatNumber(post.likes)}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">{formatNumber(post.views)}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{formatTime(post.timestamp)}</span>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="latest" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-0">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-3 flex gap-3"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={post.imageUrl} alt="AI Art" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={post.creator.avatar} alt={post.creator.name} className="w-5 h-5 rounded-full bg-muted" />
                      <span className="text-xs font-medium text-foreground truncate">{post.creator.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(post.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{post.prompt}</p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-destructive text-destructive' : ''}`} />
                        <span className="text-[10px]">{formatNumber(post.likes)}</span>
                      </button>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getServiceColor(post.sourceAI)}`}>
                        {post.sourceAI}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="creators" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-0">
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trending Creators</h3>
            {creators.map((creator, index) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={creator.avatar} alt={creator.name} className="w-12 h-12 rounded-full bg-muted" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(creator.followers)} followers</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={creator.isFollowing ? "secondary" : "default"}
                  className="h-8 text-xs"
                  onClick={() => handleFollow(creator.name)}
                >
                  {creator.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </motion.div>
            ))}

            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-6">Suggested For You</h3>
            <div className="grid grid-cols-2 gap-2">
              {posts.slice(0, 4).map((post) => (
                <motion.div
                  key={`suggest-${post.id}`}
                  whileHover={{ scale: 1.02 }}
                  className="glass-card p-2 cursor-pointer"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <img src={post.imageUrl} alt="AI Art" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={post.creator.avatar} alt={post.creator.name} className="w-4 h-4 rounded-full" />
                    <span className="text-[10px] text-foreground truncate">{post.creator.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
