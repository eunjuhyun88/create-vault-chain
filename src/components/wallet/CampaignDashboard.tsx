import { useState } from 'react';
import { motion } from 'framer-motion';
import { Campaign } from '@/types/wallet';
import { Plus, TrendingUp, Users, Coins, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const demoCampaigns: Campaign[] = [
  {
    id: '1', name: 'AI Art Challenge', description: 'Create and share AI art for rewards',
    budget: 50000, rewardType: 'proportional', startDate: new Date(), endDate: new Date(Date.now() + 604800000),
    participants: 1247, totalPIM: 892400, status: 'active',
  },
  {
    id: '2', name: 'Video Generation Contest', description: 'Best AI-generated video wins',
    budget: 25000, rewardType: 'tiered', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 1209600000),
    participants: 0, totalPIM: 0, status: 'pending',
  },
];

export function CampaignDashboard() {
  const [campaigns] = useState(demoCampaigns);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">CAMPAIGNS</h2>
        </div>
        <Button size="sm" className="h-8 text-xs"><Plus className="w-3 h-3 mr-1" />Create</Button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-3">
        {campaigns.map((campaign, i) => (
          <motion.div key={campaign.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="glass-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{campaign.description}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full ${
                campaign.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
              }`}>{campaign.status.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="glass-card p-2"><Coins className="w-3 h-3 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-primary">{campaign.budget.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Budget</p></div>
              <div className="glass-card p-2"><Users className="w-3 h-3 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-primary">{campaign.participants.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Joined</p></div>
              <div className="glass-card p-2"><TrendingUp className="w-3 h-3 text-primary mx-auto mb-1" />
                <p className="text-xs font-semibold text-primary">{campaign.totalPIM.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">PIM</p></div>
            </div>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs border-primary/30">
              View Details <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
