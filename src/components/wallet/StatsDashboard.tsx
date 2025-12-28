import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, Image, Send, Gift, Calendar, ChevronDown, Sparkles, Activity, Target } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const generateChartData = (days: number) => {
  const data = [];
  let cumulativePIM = 0;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyPIM = Math.floor(Math.random() * 500) + 100;
    cumulativePIM += dailyPIM;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pim: dailyPIM,
      cumulative: cumulativePIM,
      mints: Math.floor(Math.random() * 5),
      campaigns: Math.floor(Math.random() * 3),
    });
  }
  return data;
};

const activityBreakdown = [
  { name: 'Minting Rewards', value: 35, color: 'hsl(75, 100%, 55%)' },
  { name: 'Campaign Rewards', value: 40, color: 'hsl(160, 70%, 45%)' },
  { name: 'PIM Claims', value: 20, color: 'hsl(200, 80%, 50%)' },
  { name: 'Referrals', value: 5, color: 'hsl(270, 80%, 60%)' },
];

const aiServiceStats = [
  { service: 'Midjourney', count: 24, percentage: 40, color: 'hsl(270, 80%, 60%)' },
  { service: 'DALL-E', count: 18, percentage: 30, color: 'hsl(200, 80%, 50%)' },
  { service: 'Stable Diffusion', count: 12, percentage: 20, color: 'hsl(180, 70%, 50%)' },
  { service: 'Sora', count: 6, percentage: 10, color: 'hsl(340, 80%, 55%)' },
];

export function StatsDashboard() {
  const { wallet } = useWallet();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
    return generateChartData(days);
  }, [timeRange]);

  const totalPIM = chartData.reduce((sum, d) => sum + d.pim, 0);
  const totalMints = chartData.reduce((sum, d) => sum + d.mints, 0);
  const avgDaily = Math.round(totalPIM / chartData.length);
  const lastWeekPIM = chartData.slice(-7).reduce((sum, d) => sum + d.pim, 0);
  const prevWeekPIM = chartData.slice(-14, -7).reduce((sum, d) => sum + d.pim, 0);
  const weeklyChange = prevWeekPIM > 0 ? ((lastWeekPIM - prevWeekPIM) / prevWeekPIM * 100).toFixed(1) : 0;
  const isPositiveChange = Number(weeklyChange) >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-bold text-primary">Analytics</h2>
          </div>
          <div className="flex gap-1 p-0.5 bg-muted/30 rounded-lg">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                  timeRange === range.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-2.5 text-center"
          >
            <p className="text-[10px] text-muted-foreground mb-1">Total Earned</p>
            <p className="text-lg font-display font-bold text-primary">{formatNumber(totalPIM)}</p>
            <div className={`flex items-center justify-center gap-0.5 mt-1 ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
              {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-[10px]">{weeklyChange}%</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-2.5 text-center"
          >
            <p className="text-[10px] text-muted-foreground mb-1">Minted</p>
            <p className="text-lg font-display font-bold text-foreground">{totalMints}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Passports</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-2.5 text-center"
          >
            <p className="text-[10px] text-muted-foreground mb-1">Avg Daily</p>
            <p className="text-lg font-display font-bold text-foreground">{formatNumber(avgDaily)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">PIM</p>
          </motion.div>
        </div>
      </div>

      <Tabs defaultValue="earnings" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4">
          <TabsList className="w-full bg-muted/30">
            <TabsTrigger value="earnings" className="flex-1 gap-1.5 text-xs">
              <Coins className="w-3.5 h-3.5" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex-1 gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Sources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="earnings" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-3">
          {/* PIM Earnings Chart */}
          <div className="glass-card p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-foreground">PIM Earnings Over Time</h3>
              <div className="flex items-center gap-1 text-primary">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px]">{formatNumber(totalPIM)} total</span>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pimGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(75, 100%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(75, 100%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9, fill: 'hsl(0, 0%, 45%)' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: 'hsl(0, 0%, 45%)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 5%)',
                      border: '1px solid hsl(75, 40%, 20%)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: 'hsl(75, 100%, 55%)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pim"
                    stroke="hsl(75, 100%, 55%)"
                    strokeWidth={2}
                    fill="url(#pimGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Chart */}
          <div className="glass-card p-3">
            <h3 className="text-xs font-medium text-foreground mb-3">Cumulative Growth</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(0, 0%, 45%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 5%)',
                      border: '1px solid hsl(75, 40%, 20%)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(160, 70%, 45%)"
                    strokeWidth={2}
                    fill="url(#cumulativeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-3">
          {/* Minting Activity */}
          <div className="glass-card p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-foreground">Minting Activity</h3>
              <span className="text-[10px] text-muted-foreground">{totalMints} total mints</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-14)}>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(0, 0%, 45%)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 5%)',
                      border: '1px solid hsl(75, 40%, 20%)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="mints" fill="hsl(75, 100%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Service Usage */}
          <div className="glass-card p-3">
            <h3 className="text-xs font-medium text-foreground mb-3">AI Services Used</h3>
            <div className="space-y-2">
              {aiServiceStats.map((stat, index) => (
                <motion.div
                  key={stat.service}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: stat.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground">{stat.service}</span>
                      <span className="text-[10px] text-muted-foreground">{stat.count} mints</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: stat.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 mt-3">
          {/* Earnings Breakdown Pie Chart */}
          <div className="glass-card p-3 mb-4">
            <h3 className="text-xs font-medium text-foreground mb-3">Earnings Breakdown</h3>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {activityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {activityBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-foreground">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Milestones */}
          <div className="glass-card p-3">
            <h3 className="text-xs font-medium text-foreground mb-3">Recent Milestones</h3>
            <div className="space-y-2">
              {[
                { icon: Image, label: '50th Passport Minted', date: '2 days ago', color: 'text-primary' },
                { icon: Coins, label: '10K PIM Earned', date: '5 days ago', color: 'text-success' },
                { icon: Gift, label: 'First Campaign Completed', date: '1 week ago', color: 'text-warning' },
                { icon: Send, label: '100 MemePings Sent', date: '2 weeks ago', color: 'text-blue-400' },
              ].map((milestone, index) => (
                <motion.div
                  key={milestone.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center ${milestone.color}`}>
                    <milestone.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-foreground">{milestone.label}</p>
                    <p className="text-[10px] text-muted-foreground">{milestone.date}</p>
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
