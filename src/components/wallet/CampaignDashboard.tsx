import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign } from '@/types/wallet';
import { 
  Plus, TrendingUp, Users, Coins, Calendar, ChevronRight, 
  Trophy, Target, ArrowLeft, Zap, Clock, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CampaignDetailView } from './CampaignDetailView';
import { differenceInDays } from 'date-fns';

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
type FilterType = 'all' | 'active' | 'pending' | 'completed';

export function CampaignDashboard({ onBack }: CampaignDashboardProps) {
  const [campaigns] = useState(demoCampaigns);
  const [view, setView] = useState<View>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', budget: '', rewardType: 'proportional' });
  const { toast } = useToast();

  const filteredCampaigns = campaigns.filter(c => filter === 'all' || c.status === filter);

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      toast({ title: 'Fill required fields', variant: 'destructive' });
      return;
    }
    toast({ title: 'Campaign Created!', description: 'Your campaign is now pending review.' });
    setView('list');
    setNewCampaign({ name: '', description: '', budget: '', rewardType: 'proportional' });
  };

  const openCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setView('detail');
  };

  if (view === 'detail' && selectedCampaign) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/50">
          <button onClick={() => setView('list')} className="p-1 hover:bg-primary/10 rounded">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="font-display text-sm font-semibold">CAMPAIGN DETAILS</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <CampaignDetailView campaign={selectedCampaign} onBack={() => setView('list')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="p-1 hover:bg-primary/10 rounded">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">
            {view === 'create' ? 'CREATE CAMPAIGN' : 'CAMPAIGNS'}
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

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {(['all', 'active', 'pending', 'completed'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filter === f 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span className="ml-1 opacity-70">
                      ({campaigns.filter(c => c.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Campaign List */}
            <AnimatePresence mode="popLayout">
              {filteredCampaigns.map((campaign, i) => {
                const daysLeft = differenceInDays(campaign.endDate, new Date());
                return (
                  <motion.div 
                    key={campaign.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card overflow-hidden cursor-pointer group"
                    onClick={() => openCampaignDetail(campaign)}
                  >
                    {/* Campaign Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              campaign.status === 'active' ? 'bg-success/20 text-success' : 
                              campaign.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                            }`}>
                              {campaign.status === 'active' ? '🔴 LIVE' : campaign.status.toUpperCase()}
                            </span>
                            {campaign.status === 'active' && daysLeft <= 3 && daysLeft > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {daysLeft}d left
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {campaign.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{campaign.description}</p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-lg font-display font-bold text-primary">{(campaign.budget / 1000).toFixed(0)}K</p>
                          <p className="text-[9px] text-muted-foreground">PLART</p>
                        </div>
                      </div>

                      {/* Progress Bar for Active */}
                      {campaign.status === 'active' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">Campaign Progress</span>
                            <span className="text-primary">{Math.min(100, Math.round((campaign.totalPIM / 1000000) * 100))}%</span>
                          </div>
                          <Progress value={Math.min(100, (campaign.totalPIM / 1000000) * 100)} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Stats Footer */}
                    <div className="grid grid-cols-3 gap-px bg-border/30">
                      <div className="bg-card/50 p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{campaign.participants.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="bg-card/50 p-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>{(campaign.totalPIM / 1000).toFixed(0)}K PIM</span>
                        </div>
                      </div>
                      <div className="bg-card/50 p-2 text-center group-hover:bg-primary/10 transition-colors">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-primary">
                          <span>View Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No {filter} campaigns</p>
              </div>
            )}
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
      </div>
    </div>
  );
}
