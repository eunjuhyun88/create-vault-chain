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
  const [storedPin] = useState('1234'); // Demo PIN

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
    setWallet(prev => ({
      ...prev,
      scannedAssets: [asset, ...prev.scannedAssets],
    }));
    setSession(prev => ({
      ...prev,
      scanningCount: prev.scanningCount + 1,
    }));
  };

  const mintAsset = async (assetId: string): Promise<PassportAsset> => {
    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const asset = wallet.scannedAssets.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found');

    const passport: PassportAsset = {
      ...asset,
      status: 'minted',
      acpId: 'ACP_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      cryptoHash: 'SHA256_' + Math.random().toString(36).substr(2, 16),
      pHash: 'PHASH_' + Math.random().toString(36).substr(2, 12),
      evidenceCID: 'bafybei' + Math.random().toString(36).substr(2, 46),
      trustLevel: Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3,
      onChainTimestamp: new Date(),
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
