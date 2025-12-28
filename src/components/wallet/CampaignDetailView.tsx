import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign } from '@/types/wallet';
import { 
  Trophy, Users, Coins, Calendar, TrendingUp, 
  CheckCircle2, Gift, Zap, Clock, Star, Share2, 
  Target, ArrowRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CampaignDetailViewProps {
  campaign: Campaign;
  onBack: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  progress: number;
  target: number;
}

const mockTasks: Task[] = [
  { id: '1', title: 'Mint 3 Passports', description: 'Create and mint AI-generated content', reward: 100, completed: true, progress: 3, target: 3 },
  { id: '2', title: 'Share via MemePing', description: 'Share your passports on social media', reward: 50, completed: false, progress: 2, target: 5 },
  { id: '3', title: 'Reach 10K PIM', description: 'Accumulate PIM score from engagement', reward: 200, completed: false, progress: 6500, target: 10000 },
  { id: '4', title: 'Invite 2 Friends', description: 'Get friends to join the campaign', reward: 150, completed: false, progress: 1, target: 2 },
];

const mockLeaderboard = [
  { rank: 1, address: '0x7a3f...8e2c', pim: 125400, reward: 5000 },
  { rank: 2, address: '0x9b2e...1d4f', pim: 98200, reward: 3000 },
  { rank: 3, address: '0x4c8d...7a9b', pim: 76800, reward: 2000 },
  { rank: 4, address: '0x2f1a...5c3e', pim: 54300, reward: 1000 },
  { rank: 5, address: '0x8e7c...2b6d', pim: 42100, reward: 500 },
];

export function CampaignDetailView({ campaign, onBack }: CampaignDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard' | 'rewards'>('tasks');
  const [isJoined, setIsJoined] = useState(campaign.status === 'active');
  const [tasks, setTasks] = useState(mockTasks);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const { toast } = useToast();

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalReward = tasks.reduce((sum, t) => sum + (t.completed ? t.reward : 0), 0);
  const pendingReward = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.reward, 0);
  const daysLeft = differenceInDays(campaign.endDate, new Date());

  const handleJoin = () => {
    setIsJoined(true);
    toast({
      title: '🎉 Campaign Joined!',
      description: `You're now participating in "${campaign.name}"`,
    });
  };

  const handleClaimReward = (taskId: string) => {
    setClaimingReward(taskId);
    setTimeout(() => {
      setClaimingReward(null);
      toast({
        title: '🎁 Reward Claimed!',
        description: `+${tasks.find(t => t.id === taskId)?.reward} PLART added to your wallet`,
      });
    }, 1500);
  };

  const handleClaimAll = () => {
    toast({
      title: '🎁 All Rewards Claimed!',
      description: `+${pendingReward} PLART added to your wallet`,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col h-full"
    >
      {/* Hero Section */}
      <div className="relative px-4 py-4 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                campaign.status === 'active' ? 'bg-success/20 text-success' : 
                campaign.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
              }`}>
                {campaign.status === 'active' ? '🔴 LIVE' : campaign.status.toUpperCase()}
              </span>
              {daysLeft > 0 && daysLeft <= 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                  ⏰ {daysLeft}d left
                </span>
              )}
            </div>
            <h2 className="text-lg font-display font-bold text-foreground">{campaign.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
          </div>
          <div className="text-right ml-3">
            <p className="text-[10px] text-muted-foreground">Prize Pool</p>
            <p className="text-xl font-display font-bold text-primary">{campaign.budget.toLocaleString()}</p>
            <p className="text-[10px] text-primary">PLART</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card p-2 text-center">
            <Users className="w-3 h-3 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{campaign.participants.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Joined</p>
          </div>
          <div className="glass-card p-2 text-center">
            <TrendingUp className="w-3 h-3 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{(campaign.totalPIM / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">Total PIM</p>
          </div>
          <div className="glass-card p-2 text-center">
            <Calendar className="w-3 h-3 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{daysLeft > 0 ? daysLeft : 0}</p>
            <p className="text-[9px] text-muted-foreground">Days Left</p>
          </div>
          <div className="glass-card p-2 text-center">
            <Trophy className="w-3 h-3 text-warning mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground capitalize">{campaign.rewardType}</p>
            <p className="text-[9px] text-muted-foreground">Reward</p>
          </div>
        </div>
      </div>

      {/* Join Button / Progress */}
      {!isJoined && campaign.status === 'active' ? (
        <div className="px-4 py-3 border-b border-border/30">
          <Button className="w-full h-12 font-display tracking-wider text-base" onClick={handleJoin}>
            <Sparkles className="w-5 h-5 mr-2" />
            JOIN CAMPAIGN
          </Button>
        </div>
      ) : isJoined && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium">Participating</span>
            </div>
            <span className="text-xs text-muted-foreground">{completedTasks}/{tasks.length} Tasks</span>
          </div>
          <Progress value={(completedTasks / tasks.length) * 100} className="h-2" />
          
          {pendingReward > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 glass-card border border-success/30 bg-success/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-success" />
                <div>
                  <p className="text-xs text-success font-medium">Rewards Available</p>
                  <p className="text-lg font-display font-bold text-success">+{pendingReward} PLART</p>
                </div>
              </div>
              <Button size="sm" className="h-9 bg-success hover:bg-success/90" onClick={handleClaimAll}>
                <Zap className="w-4 h-4 mr-1" />
                Claim All
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-border/30">
        {[
          { id: 'tasks', label: 'Tasks', icon: Target },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'rewards', label: 'My Rewards', icon: Gift },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-3 ${task.completed ? 'border border-success/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <h4 className={`text-sm font-medium ${task.completed ? 'text-success' : 'text-foreground'}`}>
                          {task.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-6">{task.description}</p>
                      
                      {!task.completed && (
                        <div className="ml-6 mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-primary">{task.progress}/{task.target}</span>
                          </div>
                          <Progress value={(task.progress / task.target) * 100} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-warning mb-1">
                        <Coins className="w-3 h-3" />
                        <span className="text-xs font-bold">+{task.reward}</span>
                      </div>
                      {task.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] border-success/30 text-success hover:bg-success/10"
                          disabled={claimingReward === task.id}
                          onClick={() => handleClaimReward(task.id)}
                        >
                          {claimingReward === task.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Zap className="w-3 h-3" />
                            </motion.div>
                          ) : (
                            'Claim'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2"
            >
              {/* My Rank */}
              <div className="glass-card p-3 border border-primary/30 bg-primary/5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      #42
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Your Rank</p>
                      <p className="text-sm font-mono text-foreground">0x8f2a...4b7c</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">18,420 PIM</p>
                    <p className="text-[10px] text-muted-foreground">Est. +250 PLART</p>
                  </div>
                </div>
              </div>

              {mockLeaderboard.map((entry, i) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 glass-card"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? 'bg-gradient-to-br from-warning to-warning/60 text-warning-foreground' :
                    entry.rank === 2 ? 'bg-gradient-to-br from-muted-foreground to-muted text-foreground' :
                    entry.rank === 3 ? 'bg-gradient-to-br from-orange-600 to-orange-400 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-mono text-foreground">{entry.address}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.pim.toLocaleString()} PIM</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">+{entry.reward.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">PLART</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Summary Card */}
              <div className="glass-card p-4 text-center border border-primary/30">
                <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground mb-1">Total Earned from Campaign</p>
                <p className="text-3xl font-display font-bold text-primary">{totalReward.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">PLART</p>
              </div>

              {/* Reward Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Reward History</h4>
                
                {tasks.filter(t => t.completed).map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 glass-card"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-xs text-foreground">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">Task Completed</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-success">+{task.reward}</span>
                  </motion.div>
                ))}

                {tasks.filter(t => t.completed).length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No rewards yet</p>
                    <p className="text-xs text-muted-foreground/60">Complete tasks to earn rewards</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}