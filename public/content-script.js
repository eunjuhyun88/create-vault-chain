// PlayArts Wallet - Content Script
// Monitors DOM for AI-generated content and captures assets

(function() {
  'use strict';
  
  const PLAYARTS_PREFIX = '[PlayArts]';
  let isScanning = false;
  let observer = null;
  let capturedUrls = new Set();
  
  // AI Service specific selectors
  const SELECTORS = {
    chatgpt: {
      images: 'img[src*="oaidalleapiprodscus"], img[src*="dalle"], .dalle-image img',
      prompts: '[data-message-author-role="user"] .whitespace-pre-wrap',
      responses: '[data-message-author-role="assistant"] .markdown'
    },
    midjourney: {
      images: 'img[src*="cdn.midjourney.com"], img[src*="mj-gallery"]',
      prompts: '.prompt-text, [class*="prompt"]',
      responses: '.result-image'
    },
    dalle: {
      images: 'img[src*="oaidalleapiprodscus"], .generated-image img',
      prompts: 'textarea, .prompt-input',
      responses: '.result-container img'
    },
    stable: {
      images: 'img[src*="stability"], .generated-image img',
      prompts: 'textarea[name="prompt"], .prompt-input',
      responses: '.output-image img'
    },
    runway: {
      images: 'video[src*="runway"], img[src*="runway"]',
      prompts: '.prompt-text, textarea',
      responses: '.output-container video, .output-container img'
    },
    firefly: {
      images: 'img[src*="firefly"], .generated-content img',
      prompts: '.prompt-input textarea',
      responses: '.result-grid img'
    }
  };
  
  // Detect current AI service
  function detectService() {
    const url = window.location.href;
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
    if (url.includes('midjourney.com') || url.includes('discord.com')) return 'midjourney';
    if (url.includes('labs.openai.com')) return 'dalle';
    if (url.includes('stability.ai') || url.includes('dreamstudio')) return 'stable';
    if (url.includes('runway.ml') || url.includes('runwayml.com')) return 'runway';
    if (url.includes('firefly.adobe.com')) return 'firefly';
    if (url.includes('labs.google')) return 'veo';
    return null;
  }
  
  // Initialize content script
  function init() {
    console.log(PLAYARTS_PREFIX, 'Content script initialized');
    
    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'START_SCAN':
          startScanning();
          sendResponse({ success: true });
          break;
        case 'STOP_SCAN':
          stopScanning();
          sendResponse({ success: true });
          break;
        case 'GET_STATUS':
          sendResponse({ isScanning, capturedCount: capturedUrls.size });
          break;
      }
      return true;
    });
    
    // Auto-start scanning
    startScanning();
  }
  
  // Start DOM observation
  function startScanning() {
    if (isScanning) return;
    isScanning = true;
    
    console.log(PLAYARTS_PREFIX, 'Scanning started');
    
    // Initial scan
    scanPage();
    
    // Set up mutation observer
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          scanNodes(mutation.addedNodes);
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src']
    });
    
    showScanIndicator();
  }
  
  // Stop DOM observation
  function stopScanning() {
    if (!isScanning) return;
    isScanning = false;
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    hideScanIndicator();
    console.log(PLAYARTS_PREFIX, 'Scanning stopped');
  }
  
  // Scan entire page
  function scanPage() {
    const service = detectService();
    if (!service || !SELECTORS[service]) {
      scanGenericImages();
      return;
    }
    
    const selectors = SELECTORS[service];
    
    // Find images
    const images = document.querySelectorAll(selectors.images);
    images.forEach(img => captureImage(img, service));
    
    // Find prompts
    const prompts = document.querySelectorAll(selectors.prompts);
    prompts.forEach(el => capturePrompt(el, service));
  }
  
  // Scan added nodes
  function scanNodes(nodes) {
    const service = detectService();
    
    nodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      
      // Check if node is an image
      if (node.tagName === 'IMG') {
        captureImage(node, service);
      }
      
      // Check for images within node
      if (node.querySelectorAll) {
        const images = node.querySelectorAll('img');
        images.forEach(img => captureImage(img, service));
      }
    });
  }
  
  // Generic image scanning fallback
  function scanGenericImages() {
    const images = document.querySelectorAll('img[src*="generated"], img[src*="output"], img[src*="result"]');
    images.forEach(img => captureImage(img, 'unknown'));
  }
  
  // Capture image asset
  function captureImage(img, service) {
    const src = img.src || img.dataset.src;
    if (!src || capturedUrls.has(src)) return;
    
    // Skip small images (likely icons)
    if (img.naturalWidth && img.naturalWidth < 100) return;
    if (img.naturalHeight && img.naturalHeight < 100) return;
    
    // Skip placeholder/loading images
    if (src.includes('placeholder') || src.includes('loading') || src.includes('spinner')) return;
    
    capturedUrls.add(src);
    
    // Find associated prompt
    const prompt = findNearestPrompt(img);
    
    const asset = {
      asset_type: 'image',
      preview_url: src,
      prompt: prompt || 'AI Generated Image',
      source_ai: service,
      metadata: {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        capturedAt: new Date().toISOString(),
        pageUrl: window.location.href
      }
    };
    
    // Send to background
    chrome.runtime.sendMessage({
      type: 'ASSET_DETECTED',
      asset: asset
    });
    
    // Visual feedback
    highlightElement(img);
    
    console.log(PLAYARTS_PREFIX, 'Image captured:', src.substring(0, 50) + '...');
  }
  
  // Capture prompt text
  function capturePrompt(element, service) {
    const text = element.textContent?.trim();
    if (!text || text.length < 10) return;
    
    const asset = {
      asset_type: 'text',
      prompt: text,
      source_ai: service,
      metadata: {
        capturedAt: new Date().toISOString(),
        pageUrl: window.location.href
      }
    };
    
    chrome.runtime.sendMessage({
      type: 'ASSET_DETECTED',
      asset: asset
    });
  }
  
  // Find nearest prompt to an image
  function findNearestPrompt(img) {
    // Look for prompt in parent elements
    let element = img.parentElement;
    let depth = 0;
    
    while (element && depth < 10) {
      // Look for prompt-related elements
      const promptEl = element.querySelector('[class*="prompt"], [data-prompt], .user-message, [data-message-author-role="user"]');
      if (promptEl) {
        return promptEl.textContent?.trim().substring(0, 500);
      }
      
      // Check for alt text
      if (img.alt && img.alt.length > 10 && !img.alt.toLowerCase().includes('image')) {
        return img.alt;
      }
      
      element = element.parentElement;
      depth++;
    }
    
    return null;
  }
  
  // Visual feedback - highlight captured element
  function highlightElement(element) {
    const originalOutline = element.style.outline;
    element.style.outline = '3px solid #8B5CF6';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.outlineOffset = '';
    }, 2000);
  }
  
  // Show scanning indicator
  function showScanIndicator() {
    if (document.getElementById('playarts-scan-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'playarts-scan-indicator';
    indicator.innerHTML = `
      <div class="playarts-indicator-content">
        <div class="playarts-pulse"></div>
        <span>PlayArts Scanning</span>
      </div>
    `;
    document.body.appendChild(indicator);
  }
  
  // Hide scanning indicator
  function hideScanIndicator() {
    const indicator = document.getElementById('playarts-scan-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
