import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { Transaction } from '@/types/wallet';
import { 
  Wallet, Send, QrCode, ArrowUpRight, ArrowDownLeft, Gift, 
  Sparkles, Copy, Check, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CoinWalletProps {
  onClose?: () => void;
}

type TabType = 'balance' | 'send' | 'receive' | 'history';

const txTypeConfig: Record<Transaction['type'], { label: string; icon: React.ElementType; color: string }> = {
  send: { label: 'Sent', icon: ArrowUpRight, color: 'text-destructive' },
  receive: { label: 'Received', icon: ArrowDownLeft, color: 'text-success' },
  mint_reward: { label: 'Mint Reward', icon: Gift, color: 'text-primary' },
  campaign_reward: { label: 'Campaign', icon: Sparkles, color: 'text-warning' },
  pim_claim: { label: 'PIM Claim', icon: Sparkles, color: 'text-primary' },
};

export function CoinWallet({ onClose }: CoinWalletProps) {
  const { wallet, sendTokens, claimPIMRewards } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('balance');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast({ title: 'Address copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Constants for validation
  const MAX_MEMO_LENGTH = 256;
  const MAX_TRANSACTION_AMOUNT = 1000000; // Maximum single transaction limit
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  // Ethereum address validation regex (0x + 40 hex characters)
  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Check if address is zero address
  const isZeroAddress = (address: string): boolean => {
    return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
  };

  // Sanitize memo field - remove potentially dangerous characters
  const sanitizeMemo = (memo: string): string => {
    return memo.slice(0, MAX_MEMO_LENGTH).replace(/[<>]/g, '');
  };

  // Handle memo input with length limit
  const handleMemoChange = (value: string) => {
    if (value.length <= MAX_MEMO_LENGTH) {
      setSendMemo(value);
    }
  };

  const handleSend = async () => {
    if (!sendAddress || !sendAmount) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    
    // Validate Ethereum address format
    if (!isValidEthAddress(sendAddress)) {
      toast({ 
        title: 'Invalid address', 
        description: 'Please enter a valid Ethereum address (0x followed by 40 hex characters)',
        variant: 'destructive' 
      });
      return;
    }

    // Check for zero address
    if (isZeroAddress(sendAddress)) {
      toast({ 
        title: 'Invalid recipient', 
        description: 'Cannot send to zero address',
        variant: 'destructive' 
      });
      return;
    }

    // Check for sending to own address
    if (sendAddress.toLowerCase() === wallet.address.toLowerCase()) {
      toast({ 
        title: 'Invalid recipient', 
        description: 'Cannot send tokens to your own address',
        variant: 'destructive' 
      });
      return;
    }
    
    // Parse and validate amount - use integer math to avoid floating point issues
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    // Round to avoid floating point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;

    // Check maximum transaction limit
    if (roundedAmount > MAX_TRANSACTION_AMOUNT) {
      toast({ 
        title: 'Amount too large', 
        description: `Maximum single transaction is ${MAX_TRANSACTION_AMOUNT.toLocaleString()} PLART`,
        variant: 'destructive' 
      });
      return;
    }

    if (roundedAmount > wallet.plartBalance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    // Sanitize memo before sending
    const sanitizedMemo = sendMemo ? sanitizeMemo(sendMemo) : undefined;

    setIsSending(true);
    try {
      await sendTokens(sendAddress, roundedAmount, sanitizedMemo);
      toast({ title: 'Transaction sent!', description: `${roundedAmount} PLART sent successfully.` });
      setSendAddress('');
      setSendAmount('');
      setSendMemo('');
      setActiveTab('history');
    } catch (err) {
      toast({ title: 'Transaction failed', variant: 'destructive' });
    }
    setIsSending(false);
  };

  const handleClaimPIM = async () => {
    setIsClaiming(true);
    try {
      const amount = await claimPIMRewards();
      toast({ title: 'PIM Claimed!', description: `+${amount} PLART added to your wallet.` });
    } catch {
      toast({ title: 'Claim failed', variant: 'destructive' });
    }
    setIsClaiming(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">WALLET</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Balance Card */}
      <div className="px-4 py-4">
        <div className="glass-card p-4 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 hologram pointer-events-none opacity-50" />
          <div className="relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Balance</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-display font-bold text-primary neon-text">
                {wallet.plartBalance.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">PLART</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>≈ ${(wallet.plartBalance * 0.015).toFixed(2)} USD</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                {wallet.ethBalance.toFixed(4)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Button variant={activeTab === 'send' ? 'default' : 'outline'} size="sm"
            className="h-12 flex-col gap-1" onClick={() => setActiveTab('send')}>
            <Send className="w-4 h-4" />
            <span className="text-[10px]">Send</span>
          </Button>
          <Button variant={activeTab === 'receive' ? 'default' : 'outline'} size="sm"
            className="h-12 flex-col gap-1" onClick={() => setActiveTab('receive')}>
            <QrCode className="w-4 h-4" />
            <span className="text-[10px]">Receive</span>
          </Button>
          <Button variant="outline" size="sm" className="h-12 flex-col gap-1 border-primary/30"
            onClick={handleClaimPIM} disabled={isClaiming}>
            <Gift className={`w-4 h-4 ${isClaiming ? 'animate-spin' : ''}`} />
            <span className="text-[10px]">Claim PIM</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-4">
        <AnimatePresence mode="wait">
          {activeTab === 'send' && (
            <motion.div key="send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Recipient Address</label>
                <Input value={sendAddress} onChange={(e) => setSendAddress(e.target.value)}
                  placeholder="0x..." className="bg-input border-primary/20 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Amount (PLART)</label>
                <div className="relative">
                  <Input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00" className="bg-input border-primary/20 pr-16" />
                  <button onClick={() => setSendAmount(wallet.plartBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline">MAX</button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Memo (Optional)</label>
                  <span className="text-[10px] text-muted-foreground">{sendMemo.length}/{MAX_MEMO_LENGTH}</span>
                </div>
                <Input value={sendMemo} onChange={(e) => handleMemoChange(e.target.value)}
                  placeholder="Payment for..." className="bg-input border-primary/20" maxLength={MAX_MEMO_LENGTH} />
              </div>
              <Button className="w-full h-11 font-display tracking-wider mt-4" onClick={handleSend} disabled={isSending}>
                {isSending ? 'SENDING...' : 'SEND PLART'}
              </Button>
            </motion.div>
          )}

          {activeTab === 'receive' && (
            <motion.div key="receive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center space-y-4">
              {/* QR Code Placeholder */}
              <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 flex items-center justify-center">
                <div className="w-full h-full bg-grid-pattern bg-grid border-2 border-black rounded flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-black" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Your Wallet Address</p>
                <div className="glass-card p-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground truncate">
                    {wallet.address}
                  </span>
                  <button onClick={handleCopyAddress} className="p-2 hover:bg-primary/10 rounded">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Send only PLART or ERC-20 tokens to this address
              </p>
            </motion.div>
          )}

          {(activeTab === 'balance' || activeTab === 'history') && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Recent Transactions</h3>
                <button className="text-[10px] text-primary hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {wallet.transactions.slice(0, 10).map((tx, index) => {
                  const config = txTypeConfig[tx.type];
                  const Icon = config.icon;
                  const isOutgoing = tx.type === 'send';
                  
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-card p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isOutgoing ? 'bg-destructive/20' : 'bg-success/20'
                      }`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{config.label}</span>
                          <span className={`text-xs font-semibold ${isOutgoing ? 'text-destructive' : 'text-success'}`}>
                            {isOutgoing ? '-' : '+'}{tx.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {tx.memo || (isOutgoing ? `To: ${tx.to.slice(0, 10)}...` : `From: ${tx.from.slice(0, 10)}...`)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-primary/10 rounded">
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
