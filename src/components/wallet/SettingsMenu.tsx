import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { 
  X, Wallet, Key, Shield, LogOut, Link2, Unlink, 
  ChevronRight, AlertTriangle, Copy, Check, Settings,
  Bell, Lock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AIService } from '@/types/wallet';
import { ServiceBadge } from './ServiceBadge';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const connectedSessions: { service: AIService; lastActive: string }[] = [
  { service: 'midjourney', lastActive: '2 min ago' },
  { service: 'dalle', lastActive: '15 min ago' },
  { service: 'runway', lastActive: '1 hour ago' },
];

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { wallet, disconnectWallet, lockWallet } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const { toast } = useToast();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast({
      title: 'Address copied',
      description: 'Wallet address copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportKey = () => {
    toast({
      title: 'Security Warning',
      description: 'Never share your private key with anyone.',
      variant: 'destructive',
    });
  };

  const handleDisconnect = (service: AIService) => {
    toast({
      title: 'Session disconnected',
      description: `${service} session has been disconnected.`,
    });
  };

  const handleLogout = () => {
    disconnectWallet();
    onClose();
    toast({
      title: 'Wallet disconnected',
      description: 'You have been logged out.',
    });
  };

  const handleLock = () => {
    lockWallet();
    onClose();
    toast({
      title: 'Wallet locked',
      description: 'Enter your PIN to unlock.',
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-[320px] bg-card border-l border-border/30 overflow-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-display text-sm font-semibold">SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Wallet Info */}
          <div className="space-y-3">
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-3 h-3" />
              Wallet
            </h4>
            
            <div className="glass-card p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Address</span>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="text-sm text-primary font-semibold">
                  {wallet.balance.toLocaleString()} PLART
                </span>
              </div>
            </div>
          </div>

          {/* Connected Sessions */}
          <div className="space-y-3">
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Connected AI Sessions
            </h4>
            
            <div className="space-y-2">
              {connectedSessions.map((session) => (
                <div
                  key={session.service}
                  className="glass-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ServiceBadge service={session.service} size="sm" />
                    <span className="text-[10px] text-muted-foreground">
                      {session.lastActive}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDisconnect(session.service)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3 h-3" />
              Preferences
            </h4>
            
            <div className="space-y-2">
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">Notifications</span>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">Auto-Lock (5 min)</span>
                </div>
                <Switch
                  checked={autoLock}
                  onCheckedChange={setAutoLock}
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-3">
            <h4 className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Security
            </h4>
            
            <div className="space-y-2">
              <button
                onClick={handleLock}
                className="w-full glass-card p-3 flex items-center justify-between hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">Lock Wallet</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <button
                onClick={handleExportKey}
                className="w-full glass-card p-3 flex items-center justify-between hover:border-warning/40 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning">Export Recovery Key</span>
                </div>
                <ChevronRight className="w-4 h-4 text-warning" />
              </button>
            </div>
            
            {/* Warning */}
            <div className="glass-card p-3 border-destructive/30 bg-destructive/5 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-destructive/80">
                Never share your recovery key or seed phrase. PlayArts will never ask for it.
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full h-10 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
