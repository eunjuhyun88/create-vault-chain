import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingFlow } from '@/components/wallet/OnboardingFlow';
import { PinLockScreen } from '@/components/wallet/PinLockScreen';
import { LiveScanFeed } from '@/components/wallet/LiveScanFeed';
import { MyVault } from '@/components/wallet/MyVault';
import { CampaignDashboard } from '@/components/wallet/CampaignDashboard';
import { MemePingDashboard } from '@/components/wallet/MemePingDashboard';
import { ExploreDashboard } from '@/components/wallet/ExploreDashboard';
import { StatsDashboard } from '@/components/wallet/StatsDashboard';
import { SettingsMenu } from '@/components/wallet/SettingsMenu';
import { CoinWallet } from '@/components/wallet/CoinWallet';
import { MemePingModal } from '@/components/wallet/MemePingModal';
import { Logo } from '@/components/wallet/Logo';
import { PageTransition } from '@/components/wallet/LoadingSpinner';
import { useWallet, WalletProvider } from '@/contexts/WalletContext';
import { PassportAsset } from '@/types/wallet';
import { Radio, Vault, Send, Settings, Wallet, Gift, Compass, BarChart3 } from 'lucide-react';
import { CampaignFooter } from '@/components/wallet/CampaignFooter';

type TabId = 'feed' | 'vault' | 'wallet' | 'memeping' | 'campaigns' | 'explore' | 'stats';

function WalletApp() {
  const { wallet, connectWallet } = useWallet();
  const [showOnboarding, setShowOnboarding] = useState(!wallet.isConnected);
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareModalAsset, setShareModalAsset] = useState<PassportAsset | null>(null);

  const handleOnboardingComplete = () => { connectWallet(); setShowOnboarding(false); };
  
  const handleShareViaMemePing = (passport: PassportAsset) => {
    setShareModalAsset(passport);
  };

  if (showOnboarding) return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  if (wallet.isLocked) return <PinLockScreen onUnlock={() => {}} />;

  const tabs = [
    { id: 'feed' as TabId, label: 'Feed', icon: Radio },
    { id: 'explore' as TabId, label: 'Explore', icon: Compass },
    { id: 'vault' as TabId, label: 'Vault', icon: Vault },
    { id: 'stats' as TabId, label: 'Stats', icon: BarChart3 },
    { id: 'campaigns' as TabId, label: 'Campaign', icon: Gift },
  ];

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none" />
      
      {/* Scan Lines Overlay */}
      <div className="absolute inset-0 scan-overlay" />
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/60 backdrop-blur-xl relative z-10">
        <Logo size="sm" showText={true} />
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-full cursor-pointer hover:bg-primary/10 transition-all group"
          >
            <Wallet className="w-3.5 h-3.5 text-primary group-hover:animate-pulse" />
            <span className="text-xs text-primary font-mono font-semibold">{wallet.plartBalance.toLocaleString()}</span>
            <span className="text-[9px] text-primary/60 font-mono">PLART</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400 }}
            onClick={() => setSettingsOpen(true)} 
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <PageTransition key="feed">
              <LiveScanFeed assets={wallet.scannedAssets} onShareViaMemePing={handleShareViaMemePing} />
            </PageTransition>
          )}
          {activeTab === 'explore' && (
            <PageTransition key="explore">
              <ExploreDashboard />
            </PageTransition>
          )}
          {activeTab === 'vault' && (
            <PageTransition key="vault">
              <MyVault />
            </PageTransition>
          )}
          {activeTab === 'stats' && (
            <PageTransition key="stats">
              <StatsDashboard />
            </PageTransition>
          )}
          {activeTab === 'wallet' && (
            <PageTransition key="wallet">
              <CoinWallet />
            </PageTransition>
          )}
          {activeTab === 'memeping' && (
            <PageTransition key="memeping">
              <MemePingDashboard 
                onNavigateToCampaigns={() => setActiveTab('campaigns')} 
                onOpenShareModal={setShareModalAsset}
              />
            </PageTransition>
          )}
          {activeTab === 'campaigns' && (
            <PageTransition key="campaigns">
              <CampaignDashboard onBack={() => setActiveTab('memeping')} />
            </PageTransition>
          )}
        </AnimatePresence>
      </main>

      {/* Campaign Footer Banner - only show when not on campaigns tab */}
      {activeTab !== 'campaigns' && <CampaignFooter onClick={() => setActiveTab('campaigns')} />}

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-2 py-2 border-t border-border/40 bg-card/80 backdrop-blur-xl relative">
        {/* Active tab glow indicator */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent, hsl(75 100% 55% / 0.5), transparent)',
            backgroundSize: '200% 100%'
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/30"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ boxShadow: '0 0 20px hsl(75 100% 55% / 0.2)' }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_hsl(75_100%_55%/0.8)]' : ''}`} />
              </motion.div>
              <span className={`text-[10px] font-medium relative z-10 ${isActive ? 'neon-text-subtle' : ''}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {settingsOpen && <SettingsMenu isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />}
        {shareModalAsset && (
          <MemePingModal 
            asset={shareModalAsset} 
            onClose={() => setShareModalAsset(null)} 
            onShare={() => { setShareModalAsset(null); setActiveTab('memeping'); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const Index = () => (
  <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
    {/* Ambient Background Effects */}
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/3 rounded-full blur-[100px]" />
    </div>
    
    {/* Main Container */}
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="extension-container rounded-2xl border border-primary/25 overflow-hidden relative"
      style={{
        boxShadow: `
          0 0 0 1px hsl(75 100% 55% / 0.1),
          0 0 60px hsl(75 100% 55% / 0.12),
          0 0 120px hsl(75 100% 55% / 0.05),
          0 25px 50px -12px hsl(0 0% 0% / 0.8)
        `
      }}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/50 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/50 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/50 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/50 rounded-br-xl pointer-events-none" />
      
      <WalletProvider><WalletApp /></WalletProvider>
    </motion.div>
  </div>
);

export default Index;
