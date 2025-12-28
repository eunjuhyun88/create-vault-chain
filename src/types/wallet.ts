export type AIService = 'midjourney' | 'dalle' | 'sora' | 'runway' | 'stable' | 'firefly' | 'veo' | 'chatgpt';

export type AssetType = 'image' | 'video' | 'text';

export type AssetStatus = 'scanning' | 'captured' | 'minted';

export interface ScannedAsset {
  id: string;
  prompt: string;
  previewUrl: string;
  sourceAI: AIService;
  assetType: AssetType;
  status: AssetStatus;
  timestamp: Date;
  cryptoHash?: string;
  pHash?: string;
  acpId?: string;
  pimScore?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  rewardType: 'fixed' | 'proportional' | 'tiered';
  startDate: Date;
  endDate: Date;
  participants: number;
  totalPIM: number;
  status: 'active' | 'pending' | 'completed';
}

export interface PassportAsset extends ScannedAsset {
  acpId: string;
  cryptoHash: string;
  pHash: string;
  evidenceCID: string;
  trustLevel: 1 | 2 | 3;
  onChainTimestamp: Date;
}

export interface MemePingEvent {
  id: string;
  type: 'VIEW' | 'LIKE' | 'SHARE' | 'QUOTE' | 'REMIX' | 'MINT';
  platform: 'twitter' | 'farcaster' | 'tiktok' | 'onchain';
  count: number;
  score: number;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'mint_reward' | 'campaign_reward' | 'pim_claim';
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  hash: string;
  memo?: string;
}

export interface WalletState {
  address: string;
  balance: number;
  plartBalance: number;
  ethBalance: number;
  isConnected: boolean;
  isLocked: boolean;
  scannedAssets: ScannedAsset[];
  mintedPassports: PassportAsset[];
  campaigns: Campaign[];
  transactions: Transaction[];
}

export interface SessionStatus {
  isActive: boolean;
  currentService: AIService | null;
  scanningCount: number;
}
