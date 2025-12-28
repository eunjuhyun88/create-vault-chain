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
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5 pointer-events-none" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm relative z-10">
        <Logo size="sm" showText={true} />
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('wallet')}
            className="flex items-center gap-1 px-2 py-1 glass-card rounded-full cursor-pointer hover:bg-primary/10 transition-colors"
          >
            <Wallet className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-mono">{wallet.plartBalance.toLocaleString()}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400 }}
            onClick={() => setSettingsOpen(true)} 
            className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
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
      <nav className="flex items-center justify-around px-2 py-2 border-t border-border/30 bg-card/80 backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
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
  <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
    <div className="extension-container rounded-2xl border border-primary/20 overflow-hidden shadow-[0_0_60px_hsl(75_100%_55%/0.15)]">
      <WalletProvider><WalletApp /></WalletProvider>
    </div>
  </div>
);

export default Index;
