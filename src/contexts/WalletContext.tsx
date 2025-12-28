import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WalletState, ScannedAsset, PassportAsset, Campaign, SessionStatus, AIService, Transaction } from '@/types/wallet';

interface WalletContextType {
  wallet: WalletState;
  session: SessionStatus;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  setSession: React.Dispatch<React.SetStateAction<SessionStatus>>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  lockWallet: () => void;
  unlockWallet: (pin: string) => Promise<boolean>;
  addScannedAsset: (asset: ScannedAsset) => void;
  updateScannedAsset: (assetId: string, updates: Partial<ScannedAsset>) => void;
  mintAsset: (assetId: string) => Promise<PassportAsset>;
  startSession: (service: AIService) => void;
  endSession: () => void;
  sendTokens: (to: string, amount: number, memo?: string) => Promise<Transaction>;
  claimPIMRewards: () => Promise<number>;
}

const demoTransactions: Transaction[] = [
  { id: 'tx1', type: 'receive', amount: 500, from: '0x1234...5678', to: 'self', timestamp: new Date(Date.now() - 86400000), status: 'confirmed', hash: '0xabc...def' },
  { id: 'tx2', type: 'mint_reward', amount: 50, from: 'PlayArts', to: 'self', timestamp: new Date(Date.now() - 172800000), status: 'confirmed', hash: '0xdef...ghi' },
  { id: 'tx3', type: 'campaign_reward', amount: 1200, from: 'AI Art Challenge', to: 'self', timestamp: new Date(Date.now() - 259200000), status: 'confirmed', hash: '0xghi...jkl' },
  { id: 'tx4', type: 'send', amount: 100, from: 'self', to: '0x9876...5432', timestamp: new Date(Date.now() - 345600000), status: 'confirmed', hash: '0xjkl...mno', memo: 'NFT purchase' },
  { id: 'tx5', type: 'pim_claim', amount: 2500, from: 'MemePing', to: 'self', timestamp: new Date(Date.now() - 432000000), status: 'confirmed', hash: '0xmno...pqr' },
];

const defaultWallet: WalletState = {
  address: '',
  balance: 0,
  plartBalance: 0,
  ethBalance: 0,
  isConnected: false,
  isLocked: false,
  scannedAssets: [],
  mintedPassports: [],
  campaigns: [],
  transactions: [],
};

const defaultSession: SessionStatus = {
  isActive: false,
  currentService: null,
  scanningCount: 0,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Secure PIN storage using session-based hashing
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'playarts_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [session, setSession] = useState<SessionStatus>(defaultSession);
  // Store hashed PIN in sessionStorage for session-based security
  const [pinHash, setPinHash] = useState<string | null>(() => {
    return sessionStorage.getItem('wallet_pin_hash');
  });

  const setPin = async (pin: string): Promise<void> => {
    const hash = await hashPin(pin);
    setPinHash(hash);
    sessionStorage.setItem('wallet_pin_hash', hash);
  };

  const connectWallet = () => {
    // Use cryptographically secure random for wallet address generation
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    const mockAddress = '0x' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    
    setWallet(prev => ({
      ...prev,
      address: mockAddress,
      balance: Math.floor(Math.random() * 10000) + 1000,
      plartBalance: Math.floor(Math.random() * 50000) + 5000,
      ethBalance: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
      isConnected: true,
      isLocked: false,
      transactions: demoTransactions,
    }));
  };

  const disconnectWallet = () => {
    setWallet(defaultWallet);
    setSession(defaultSession);
    sessionStorage.removeItem('wallet_pin_hash');
    setPinHash(null);
  };

  const lockWallet = () => {
    setWallet(prev => ({ ...prev, isLocked: true }));
  };

  const unlockWallet = async (pin: string): Promise<boolean> => {
    if (!pinHash) {
      // No PIN set yet, set it now (first time unlock after wallet creation)
      await setPin(pin);
      setWallet(prev => ({ ...prev, isLocked: false }));
      return true;
    }
    
    const inputHash = await hashPin(pin);
    if (inputHash === pinHash) {
      setWallet(prev => ({ ...prev, isLocked: false }));
      return true;
    }
    return false;
  };

  const addScannedAsset = (asset: ScannedAsset) => {
    setWallet(prev => {
      const existingIndex = prev.scannedAssets.findIndex(a => a.id === asset.id);
      if (existingIndex >= 0) {
        const updated = [...prev.scannedAssets];
        updated[existingIndex] = asset;
        return { ...prev, scannedAssets: updated };
      }
      return { ...prev, scannedAssets: [asset, ...prev.scannedAssets] };
    });
    setSession(prev => ({ ...prev, scanningCount: prev.scanningCount + 1 }));
  };

  const updateScannedAsset = (assetId: string, updates: Partial<ScannedAsset>) => {
    setWallet(prev => ({
      ...prev,
      scannedAssets: prev.scannedAssets.map(asset =>
        asset.id === assetId ? { ...asset, ...updates } : asset
      ),
    }));
  };

  const mintAsset = async (assetId: string): Promise<PassportAsset> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let asset = wallet.scannedAssets.find(a => a.id === assetId);
    
    if (!asset) {
      asset = {
        id: assetId,
        prompt: 'Demo AI generated content',
        previewUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
        sourceAI: 'midjourney' as AIService,
        assetType: 'image',
        status: 'captured',
        timestamp: new Date(),
      };
    }

    const passport: PassportAsset = {
      ...asset,
      status: 'minted',
      acpId: 'ACP_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      cryptoHash: 'SHA256_' + Math.random().toString(36).substr(2, 16),
      pHash: 'PHASH_' + Math.random().toString(36).substr(2, 12),
      evidenceCID: 'bafybei' + Math.random().toString(36).substr(2, 46),
      trustLevel: Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3,
      onChainTimestamp: new Date(),
      pimScore: Math.floor(Math.random() * 10000) + 1000,
    };

    // Add mint reward transaction
    const rewardTx: Transaction = {
      id: 'tx_' + Date.now(),
      type: 'mint_reward',
      amount: 50,
      from: 'PlayArts',
      to: 'self',
      timestamp: new Date(),
      status: 'confirmed',
      hash: '0x' + Math.random().toString(36).substr(2, 64),
    };

    setWallet(prev => ({
      ...prev,
      scannedAssets: prev.scannedAssets.filter(a => a.id !== assetId),
      mintedPassports: [passport, ...prev.mintedPassports],
      plartBalance: prev.plartBalance + 50,
      transactions: [rewardTx, ...prev.transactions],
    }));

    return passport;
  };

  const startSession = (service: AIService) => {
    setSession({ isActive: true, currentService: service, scanningCount: 0 });
  };

  const endSession = () => {
    setSession(defaultSession);
  };

  const sendTokens = async (to: string, amount: number, memo?: string): Promise<Transaction> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (amount > wallet.plartBalance) {
      throw new Error('Insufficient balance');
    }

    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      type: 'send',
      amount,
      from: 'self',
      to,
      timestamp: new Date(),
      status: 'confirmed',
      hash: '0x' + Math.random().toString(36).substr(2, 64),
      memo,
    };

    setWallet(prev => ({
      ...prev,
      plartBalance: prev.plartBalance - amount,
      transactions: [tx, ...prev.transactions],
    }));

    return tx;
  };

  const claimPIMRewards = async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const claimAmount = Math.floor(Math.random() * 500) + 100;
    
    const tx: Transaction = {
      id: 'tx_' + Date.now(),
      type: 'pim_claim',
      amount: claimAmount,
      from: 'MemePing',
      to: 'self',
      timestamp: new Date(),
      status: 'confirmed',
      hash: '0x' + Math.random().toString(36).substr(2, 64),
    };

    setWallet(prev => ({
      ...prev,
      plartBalance: prev.plartBalance + claimAmount,
      transactions: [tx, ...prev.transactions],
    }));

    return claimAmount;
  };

  return (
    <WalletContext.Provider value={{
      wallet, session, setWallet, setSession, connectWallet, disconnectWallet,
      lockWallet, unlockWallet, addScannedAsset, updateScannedAsset, mintAsset,
      startSession, endSession, sendTokens, claimPIMRewards,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
