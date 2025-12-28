import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingFlow } from '@/components/wallet/OnboardingFlow';
import { PinLockScreen } from '@/components/wallet/PinLockScreen';
import { LiveScanFeed } from '@/components/wallet/LiveScanFeed';
import { MyVault } from '@/components/wallet/MyVault';
import { CampaignDashboard } from '@/components/wallet/CampaignDashboard';
import { SettingsMenu } from '@/components/wallet/SettingsMenu';
import { Logo } from '@/components/wallet/Logo';
import { useWallet, WalletProvider } from '@/contexts/WalletContext';
import { MemePingDashboard } from '@/components/wallet/MemePingDashboard';
import { Radio, Vault, TrendingUp, Send, Settings, Wallet } from 'lucide-react';

type TabId = 'feed' | 'vault' | 'campaigns' | 'memeping';

function WalletApp() {
  const { wallet, connectWallet } = useWallet();
  const [showOnboarding, setShowOnboarding] = useState(!wallet.isConnected);
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOnboardingComplete = () => {
    connectWallet();
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (wallet.isLocked) {
    return <PinLockScreen onUnlock={() => {}} />;
  }

  const tabs = [
    { id: 'feed' as TabId, label: 'Feed', icon: Radio },
    { id: 'vault' as TabId, label: 'Vault', icon: Vault },
    { id: 'campaigns' as TabId, label: 'Campaigns', icon: TrendingUp },
    { id: 'memeping' as TabId, label: 'MemePing', icon: Send },
  ];

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5 pointer-events-none" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm relative z-10">
        <Logo size="sm" showText={true} />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 glass-card rounded-full">
            <Wallet className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-mono">{wallet.balance.toLocaleString()}</span>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><LiveScanFeed assets={wallet.scannedAssets} /></motion.div>}
          {activeTab === 'vault' && <motion.div key="vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><MyVault /></motion.div>}
          {activeTab === 'campaigns' && <motion.div key="campaigns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><CampaignDashboard /></motion.div>}
          {activeTab === 'memeping' && <motion.div key="memeping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><MemePingDashboard /></motion.div>}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-2 py-2 border-t border-border/30 bg-card/80 backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Menu */}
      <AnimatePresence>
        {settingsOpen && <SettingsMenu isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="extension-container rounded-2xl border border-primary/20 overflow-hidden">
        <WalletProvider>
          <WalletApp />
        </WalletProvider>
      </div>
    </div>
  );
};

export default Index;
