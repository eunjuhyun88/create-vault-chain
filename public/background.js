// PlayArts Wallet - Background Service Worker
// Handles state management and communication between popup and content scripts

const SUPABASE_URL = 'https://sfunjjklsgubgtudfkcz.supabase.co';

// Storage keys
const STORAGE_KEYS = {
  WALLET: 'playarts_wallet',
  SCANNED_ASSETS: 'scanned_assets',
  SESSION: 'ai_session',
  SETTINGS: 'settings'
};

// AI Service detection patterns
const AI_SERVICES = {
  chatgpt: {
    patterns: ['chat.openai.com', 'chatgpt.com'],
    name: 'ChatGPT',
    icon: 'chatgpt'
  },
  midjourney: {
    patterns: ['midjourney.com', 'discord.com/channels/@me'],
    name: 'Midjourney',
    icon: 'midjourney'
  },
  dalle: {
    patterns: ['labs.openai.com'],
    name: 'DALL-E',
    icon: 'dalle'
  },
  stable: {
    patterns: ['stability.ai', 'dreamstudio.ai'],
    name: 'Stable Diffusion',
    icon: 'stable'
  },
  runway: {
    patterns: ['runway.ml', 'runwayml.com'],
    name: 'Runway',
    icon: 'runway'
  },
  firefly: {
    patterns: ['firefly.adobe.com'],
    name: 'Adobe Firefly',
    icon: 'firefly'
  },
  veo: {
    patterns: ['labs.google'],
    name: 'Google Veo',
    icon: 'veo'
  },
  sora: {
    patterns: ['sora.com'],
    name: 'Sora',
    icon: 'sora'
  }
};

// State management
let state = {
  isScanning: false,
  activeTab: null,
  scannedAssets: [],
  currentService: null
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[PlayArts] Extension installed');
  
  // Initialize storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.SCANNED_ASSETS]: [],
    [STORAGE_KEYS.SETTINGS]: {
      autoScan: true,
      notifications: true,
      autoLock: 5
    }
  });
});

// Listen for tab updates to detect AI services
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const service = detectAIService(tab.url);
    if (service) {
      state.currentService = service;
      state.activeTab = tabId;
      
      // Notify popup about detected service
      chrome.runtime.sendMessage({
        type: 'SERVICE_DETECTED',
        service: service,
        tabId: tabId
      }).catch(() => {});
      
      // Start scanning if auto-scan is enabled
      const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      if (settings[STORAGE_KEYS.SETTINGS]?.autoScan) {
        startScanning(tabId);
      }
    }
  }
});

// Detect which AI service is being used
function detectAIService(url) {
  for (const [key, service] of Object.entries(AI_SERVICES)) {
    if (service.patterns.some(pattern => url.includes(pattern))) {
      return { id: key, ...service };
    }
  }
  return null;
}

// Start scanning on a tab
async function startScanning(tabId) {
  state.isScanning = true;
  
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'START_SCAN' });
    console.log('[PlayArts] Scanning started on tab:', tabId);
  } catch (error) {
    console.error('[PlayArts] Failed to start scanning:', error);
  }
}

// Stop scanning
async function stopScanning(tabId) {
  state.isScanning = false;
  
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'STOP_SCAN' });
    console.log('[PlayArts] Scanning stopped on tab:', tabId);
  } catch (error) {
    console.error('[PlayArts] Failed to stop scanning:', error);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PlayArts] Message received:', message.type);
  
  switch (message.type) {
    case 'GET_STATE':
      sendResponse({
        isScanning: state.isScanning,
        currentService: state.currentService,
        scannedAssets: state.scannedAssets
      });
      break;
      
    case 'START_SCAN':
      if (state.activeTab) {
        startScanning(state.activeTab);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active AI tab' });
      }
      break;
      
    case 'STOP_SCAN':
      if (state.activeTab) {
        stopScanning(state.activeTab);
        sendResponse({ success: true });
      }
      break;
      
    case 'ASSET_DETECTED':
      handleAssetDetected(message.asset, sender.tab?.id);
      sendResponse({ success: true });
      break;
      
    case 'GET_SCANNED_ASSETS':
      chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS).then(result => {
        sendResponse(result[STORAGE_KEYS.SCANNED_ASSETS] || []);
      });
      return true; // Keep channel open for async response
      
    case 'CLEAR_ASSETS':
      state.scannedAssets = [];
      chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: [] });
      sendResponse({ success: true });
      break;
      
    case 'MINT_ASSET':
      handleMintAsset(message.assetId).then(sendResponse);
      return true;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true;
});

// Handle detected asset from content script
async function handleAssetDetected(asset, tabId) {
  const newAsset = {
    id: generateId(),
    ...asset,
    source_ai: state.currentService?.id || 'unknown',
    status: 'captured',
    created_at: new Date().toISOString(),
    tabId: tabId
  };
  
  state.scannedAssets.push(newAsset);
  
  // Save to storage
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS);
  const assets = stored[STORAGE_KEYS.SCANNED_ASSETS] || [];
  assets.push(newAsset);
  await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: assets });
  
  // Notify popup
  chrome.runtime.sendMessage({
    type: 'ASSET_ADDED',
    asset: newAsset
  }).catch(() => {});
  
  // Show notification
  const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (settings[STORAGE_KEYS.SETTINGS]?.notifications) {
    chrome.action.setBadgeText({ text: String(assets.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#8B5CF6' });
  }
  
  console.log('[PlayArts] Asset captured:', newAsset.id);
}

// Handle minting request
async function handleMintAsset(assetId) {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS);
    const assets = stored[STORAGE_KEYS.SCANNED_ASSETS] || [];
    const assetIndex = assets.findIndex(a => a.id === assetId);
    
    if (assetIndex === -1) {
      return { success: false, error: 'Asset not found' };
    }
    
    // Update asset status
    assets[assetIndex].status = 'minted';
    assets[assetIndex].minted_at = new Date().toISOString();
    assets[assetIndex].acp_id = generateAcpId();
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: assets });
    
    return { success: true, asset: assets[assetIndex] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate unique ID
function generateId() {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate ACP ID for minted assets
function generateAcpId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'ACP-';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) id += '-';
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('[PlayArts] Service worker heartbeat');
  }
});
