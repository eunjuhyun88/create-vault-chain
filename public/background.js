// PlayArts Wallet - Background Service Worker
// Handles state management and communication between popup and content scripts

const SUPABASE_URL = 'https://sfunjjklsgubgtudfkcz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdW5qamtsc2d1Ymd0dWRma2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTI3NTIsImV4cCI6MjA4MjQ4ODc1Mn0.12jvUwRSJKrOWyg3eO_NPp43uWGsPyXtmQkeer6HGNk';

// Storage keys
const STORAGE_KEYS = {
  WALLET: 'playarts_wallet',
  SCANNED_ASSETS: 'scanned_assets',
  SESSION: 'ai_session',
  SETTINGS: 'settings',
  SYNC_QUEUE: 'sync_queue'
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
  currentService: null,
  isSyncing: false
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[PlayArts] Extension installed');
  
  // Initialize storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.SCANNED_ASSETS]: [],
    [STORAGE_KEYS.SYNC_QUEUE]: [],
    [STORAGE_KEYS.SETTINGS]: {
      autoScan: true,
      autoSync: true,
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
        scannedAssets: state.scannedAssets,
        isSyncing: state.isSyncing
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
      handleAssetDetected(message.asset, sender.tab?.id).then(sendResponse);
      return true;
      
    case 'GET_SCANNED_ASSETS':
      chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS).then(result => {
        sendResponse(result[STORAGE_KEYS.SCANNED_ASSETS] || []);
      });
      return true;
      
    case 'CLEAR_ASSETS':
      state.scannedAssets = [];
      chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: [] });
      sendResponse({ success: true });
      break;
      
    case 'MINT_ASSET':
      handleMintAsset(message.assetId).then(sendResponse);
      return true;
      
    case 'SYNC_TO_BACKEND':
      syncAssetsToBackend().then(sendResponse);
      return true;
      
    case 'GET_SYNC_STATUS':
      chrome.storage.local.get(STORAGE_KEYS.SYNC_QUEUE).then(result => {
        sendResponse({
          pendingCount: (result[STORAGE_KEYS.SYNC_QUEUE] || []).length,
          isSyncing: state.isSyncing
        });
      });
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
    synced: false,
    created_at: new Date().toISOString(),
    tabId: tabId
  };
  
  state.scannedAssets.push(newAsset);
  
  // Save to local storage
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS);
  const assets = stored[STORAGE_KEYS.SCANNED_ASSETS] || [];
  assets.push(newAsset);
  await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: assets });
  
  // Add to sync queue
  await addToSyncQueue(newAsset);
  
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
  
  // Auto-sync if enabled
  if (settings[STORAGE_KEYS.SETTINGS]?.autoSync) {
    syncAssetsToBackend();
  }
  
  console.log('[PlayArts] Asset captured:', newAsset.id);
  return { success: true, asset: newAsset };
}

// Add asset to sync queue
async function addToSyncQueue(asset) {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
  const queue = stored[STORAGE_KEYS.SYNC_QUEUE] || [];
  queue.push({
    id: asset.id,
    prompt: asset.prompt,
    preview_url: asset.preview_url,
    source_ai: asset.source_ai,
    asset_type: asset.asset_type,
    metadata: asset.metadata,
    created_at: asset.created_at
  });
  await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: queue });
}

// Sync assets to backend
async function syncAssetsToBackend() {
  if (state.isSyncing) {
    console.log('[PlayArts] Sync already in progress');
    return { success: false, error: 'Sync in progress' };
  }
  
  state.isSyncing = true;
  
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
    const queue = stored[STORAGE_KEYS.SYNC_QUEUE] || [];
    
    if (queue.length === 0) {
      console.log('[PlayArts] Nothing to sync');
      state.isSyncing = false;
      return { success: true, synced: 0 };
    }
    
    console.log('[PlayArts] Syncing', queue.length, 'assets to backend');
    
    // Call the edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/extension-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'save_batch_assets',
        data: { assets: queue }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[PlayArts] Sync successful:', result);
    
    // Clear the sync queue
    await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: [] });
    
    // Mark assets as synced in local storage
    const assetsStored = await chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS);
    const assets = assetsStored[STORAGE_KEYS.SCANNED_ASSETS] || [];
    const syncedIds = queue.map(a => a.id);
    
    const updatedAssets = assets.map(asset => {
      if (syncedIds.includes(asset.id)) {
        return { ...asset, synced: true };
      }
      return asset;
    });
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: updatedAssets });
    
    // Notify popup
    chrome.runtime.sendMessage({
      type: 'SYNC_COMPLETE',
      count: result.count || queue.length
    }).catch(() => {});
    
    state.isSyncing = false;
    return { success: true, synced: result.count || queue.length };
    
  } catch (error) {
    console.error('[PlayArts] Sync error:', error);
    state.isSyncing = false;
    
    chrome.runtime.sendMessage({
      type: 'SYNC_ERROR',
      error: error.message
    }).catch(() => {});
    
    return { success: false, error: error.message };
  }
}

// Handle minting request - now syncs with backend
async function handleMintAsset(assetId) {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.SCANNED_ASSETS);
    const assets = stored[STORAGE_KEYS.SCANNED_ASSETS] || [];
    const assetIndex = assets.findIndex(a => a.id === assetId);
    
    if (assetIndex === -1) {
      return { success: false, error: 'Asset not found' };
    }
    
    const asset = assets[assetIndex];
    
    // If asset has a backend ID, mint via backend
    if (asset.backend_id) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/extension-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'mint_to_passport',
          data: { scanned_asset_id: asset.backend_id }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        assets[assetIndex].status = 'minted';
        assets[assetIndex].minted_at = new Date().toISOString();
        assets[assetIndex].acp_id = result.passport?.acp_id;
        assets[assetIndex].passport_id = result.passport?.id;
        
        await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: assets });
        
        return { success: true, asset: assets[assetIndex], passport: result.passport };
      }
    }
    
    // Fallback: Local minting
    assets[assetIndex].status = 'minted';
    assets[assetIndex].minted_at = new Date().toISOString();
    assets[assetIndex].acp_id = generateAcpId();
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCANNED_ASSETS]: assets });
    
    return { success: true, asset: assets[assetIndex] };
  } catch (error) {
    console.error('[PlayArts] Mint error:', error);
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

// Periodic sync check
chrome.alarms.create('syncCheck', { periodInMinutes: 1 });
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('[PlayArts] Service worker heartbeat');
  }
  
  if (alarm.name === 'syncCheck') {
    const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    if (settings[STORAGE_KEYS.SETTINGS]?.autoSync) {
      const stored = await chrome.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
      const queue = stored[STORAGE_KEYS.SYNC_QUEUE] || [];
      
      if (queue.length > 0) {
        console.log('[PlayArts] Auto-syncing', queue.length, 'pending assets');
        syncAssetsToBackend();
      }
    }
  }
});
