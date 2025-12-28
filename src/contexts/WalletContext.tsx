import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WalletState, ScannedAsset, PassportAsset, Campaign, SessionStatus, AIService } from '@/types/wallet';

interface WalletContextType {
  wallet: WalletState;
  session: SessionStatus;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  setSession: React.Dispatch<React.SetStateAction<SessionStatus>>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  lockWallet: () => void;
  unlockWallet: (pin: string) => boolean;
  addScannedAsset: (asset: ScannedAsset) => void;
  updateScannedAsset: (assetId: string, updates: Partial<ScannedAsset>) => void;
  mintAsset: (assetId: string) => Promise<PassportAsset>;
  startSession: (service: AIService) => void;
  endSession: () => void;
}

const defaultWallet: WalletState = {
  address: '',
  balance: 0,
  isConnected: false,
  isLocked: false,
  scannedAssets: [],
  mintedPassports: [],
  campaigns: [],
};

const defaultSession: SessionStatus = {
  isActive: false,
  currentService: null,
  scanningCount: 0,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [session, setSession] = useState<SessionStatus>(defaultSession);
  const [storedPin] = useState('1234');

  const connectWallet = () => {
    const mockAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    setWallet(prev => ({
      ...prev,
      address: mockAddress,
      balance: Math.floor(Math.random() * 10000) + 1000,
      isConnected: true,
      isLocked: false,
    }));
  };

  const disconnectWallet = () => {
    setWallet(defaultWallet);
    setSession(defaultSession);
  };

  const lockWallet = () => {
    setWallet(prev => ({ ...prev, isLocked: true }));
  };

  const unlockWallet = (pin: string): boolean => {
    if (pin === storedPin) {
      setWallet(prev => ({ ...prev, isLocked: false }));
      return true;
    }
    return false;
  };

  const addScannedAsset = (asset: ScannedAsset) => {
    setWallet(prev => {
      // Check if asset already exists, update it if so
      const existingIndex = prev.scannedAssets.findIndex(a => a.id === asset.id);
      if (existingIndex >= 0) {
        const updated = [...prev.scannedAssets];
        updated[existingIndex] = asset;
        return { ...prev, scannedAssets: updated };
      }
      return {
        ...prev,
        scannedAssets: [asset, ...prev.scannedAssets],
      };
    });
    setSession(prev => ({
      ...prev,
      scanningCount: prev.scanningCount + 1,
    }));
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
    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find asset in scanned assets OR in demo assets
    let asset = wallet.scannedAssets.find(a => a.id === assetId);
    
    // If not found in wallet, create a mock passport for demo purposes
    if (!asset) {
      // Create a fallback asset for demo
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

    setWallet(prev => ({
      ...prev,
      scannedAssets: prev.scannedAssets.filter(a => a.id !== assetId),
      mintedPassports: [passport, ...prev.mintedPassports],
    }));

    return passport;
  };

  const startSession = (service: AIService) => {
    setSession({
      isActive: true,
      currentService: service,
      scanningCount: 0,
    });
  };

  const endSession = () => {
    setSession(defaultSession);
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      session,
      setWallet,
      setSession,
      connectWallet,
      disconnectWallet,
      lockWallet,
      unlockWallet,
      addScannedAsset,
      updateScannedAsset,
      mintAsset,
      startSession,
      endSession,
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
