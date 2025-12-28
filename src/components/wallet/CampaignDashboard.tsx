import { useState } from 'react';
import { motion } from 'framer-motion';
import { Campaign } from '@/types/wallet';
import { Plus, TrendingUp, Users, Coins, Calendar, ChevronRight, ChevronLeft, Trophy, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CampaignDashboardProps {
  onBack?: () => void;
}

const demoCampaigns: Campaign[] = [
  {
    id: '1', name: 'AI Art Challenge', description: 'Create and share AI art for rewards. Top creators win bonus PLART.',
    budget: 50000, rewardType: 'proportional', startDate: new Date(), endDate: new Date(Date.now() + 604800000),
    participants: 1247, totalPIM: 892400, status: 'active',
  },
  {
    id: '2', name: 'Video Generation Contest', description: 'Best AI-generated video wins. Runway and Sora creations welcome.',
    budget: 25000, rewardType: 'tiered', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 1209600000),
    participants: 0, totalPIM: 0, status: 'pending',
  },
  {
    id: '3', name: 'Meme Masters League', description: 'Create viral AI memes. Highest PIM score takes all.',
    budget: 15000, rewardType: 'fixed', startDate: new Date(Date.now() - 259200000), endDate: new Date(Date.now() - 86400000),
    participants: 892, totalPIM: 1245000, status: 'completed',
  },
];

type View = 'list' | 'create' | 'detail';

export function CampaignDashboard({ onBack }: CampaignDashboardProps) {
  const [campaigns] = useState(demoCampaigns);
  const [view, setView] = useState<View>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', budget: '', rewardType: 'proportional' });
  const { toast } = useToast();

  const handleJoinCampaign = (campaign: Campaign) => {
    toast({ title: 'Joined Campaign!', description: `You're now participating in "${campaign.name}"` });
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      toast({ title: 'Fill required fields', variant: 'destructive' });
      return;
    }
    toast({ title: 'Campaign Created!', description: 'Your campaign is now pending review.' });
    setView('list');
    setNewCampaign({ name: '', description: '', budget: '', rewardType: 'proportional' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          {(view !== 'list' || onBack) && (
            <button onClick={() => view !== 'list' ? setView('list') : onBack?.()} className="p-1 hover:bg-primary/10 rounded">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">
            {view === 'create' ? 'CREATE CAMPAIGN' : view === 'detail' ? 'CAMPAIGN DETAILS' : 'CAMPAIGNS'}
          </h2>
        </div>
        {view === 'list' && (
          <Button size="sm" className="h-8 text-xs" onClick={() => setView('create')}>
            <Plus className="w-3 h-3 mr-1" />Create
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {view === 'list' && (
          <div className="space-y-3">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="glass-card p-3 text-center">
                <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-primary">{campaigns.filter(c => c.status === 'active').length}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-primary">
                  {campaigns.reduce((sum, c) => sum + c.participants, 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">Participants</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Trophy className="w-4 h-4 text-warning mx-auto mb-1" />
                <p className="text-lg font-display font-bold text-warning">
                  {(campaigns.reduce((sum, c) => sum + c.budget, 0) / 1000).toFixed(0)}K
                </p>
                <p className="text-[10px] text-muted-foreground">Total Rewards</p>
              </div>
            </div>

            {/* Campaign List */}
            {campaigns.map((campaign, i) => (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full flex-shrink-0 ${
                    campaign.status === 'active' ? 'bg-success/20 text-success' : 
                    campaign.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                  }`}>{campaign.status.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="glass-card p-2">
                    <Coins className="w-3 h-3 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-primary">{campaign.budget.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Budget</p>
                  </div>
                  <div className="glass-card p-2">
                    <Users className="w-3 h-3 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-primary">{campaign.participants.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Joined</p>
                  </div>
                  <div className="glass-card p-2">
                    <TrendingUp className="w-3 h-3 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-primary">{(campaign.totalPIM / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-muted-foreground">PIM</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-primary/30"
                    onClick={() => { setSelectedCampaign(campaign); setView('detail'); }}>
                    Details <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                  {campaign.status === 'active' && (
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleJoinCampaign(campaign)}>
                      Join Now
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {view === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Campaign Name *</label>
              <Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="AI Art Challenge" className="bg-input border-primary/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                placeholder="Describe your campaign..." className="bg-input border-primary/20 min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Budget (PLART) *</label>
              <Input type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                placeholder="10000" className="bg-input border-primary/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Reward Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['fixed', 'proportional', 'tiered'].map(type => (
                  <button key={type} onClick={() => setNewCampaign({ ...newCampaign, rewardType: type })}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      newCampaign.rewardType === type ? 'border-primary bg-primary/10 text-primary' : 'border-muted/30 text-muted-foreground'
                    }`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full h-11 font-display tracking-wider mt-4" onClick={handleCreateCampaign}>
              CREATE CAMPAIGN
            </Button>
          </motion.div>
        )}

        {view === 'detail' && selectedCampaign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="text-lg font-display font-bold text-foreground mb-2">{selectedCampaign.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedCampaign.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Budget</p>
                <p className="text-xl font-display font-bold text-primary">{selectedCampaign.budget.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">PLART</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Reward Type</p>
                <p className="text-sm font-semibold text-foreground capitalize">{selectedCampaign.rewardType}</p>
              </div>
            </div>
            <div className="glass-card p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Leaderboard</p>
              {[1, 2, 3].map(rank => (
                <div key={rank} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    rank === 1 ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{rank}</span>
                  <span className="flex-1 text-xs font-mono text-foreground">0x{Math.random().toString(36).substr(2, 6)}...</span>
                  <span className="text-xs text-primary font-semibold">{Math.floor(Math.random() * 50000).toLocaleString()} PIM</span>
                </div>
              ))}
            </div>
            {selectedCampaign.status === 'active' && (
              <Button className="w-full h-11 font-display tracking-wider" onClick={() => handleJoinCampaign(selectedCampaign)}>
                JOIN CAMPAIGN
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
