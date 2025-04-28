let activeTabId = null;
let activeTabData = null;
let lastActiveTime = Date.now();
let trackingInterval = null;
const IDLE_TIMEOUT = 60; // seconds
const UPDATE_INTERVAL = 5; // seconds - how often to update storage

// Import website limiting functions
import { checkWebsiteLimit } from './limits.js';

// When closed update to prevent data loss
chrome.runtime.onSuspend.addListener(() => {
  updateActiveTabTime();
});

// Check for new day every minute to initialize new day's data if they're working past midnight
setInterval(initializeDayData, 60 * 1000);

// Initialize tracking data for new day
function initializeDayData() {
  // Get today's date in local timezone format (YYYY-MM-DD)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Check whether data exists for today, if not, initialize it
  chrome.storage.local.get(['timeTrackingData'], (result) => {
    // If today's data doesn't exist, initialize it
    let trackingData = result.timeTrackingData || {};
    if (!trackingData[today]) {
      trackingData[today] = {};
      chrome.storage.local.set({ timeTrackingData: trackingData });
    }
  });
}

// Update time spent on a specific domain in storage
// Use a queue to prevent overlapping updates
let storageQueue = Promise.resolve();

async function updateTimeSpent(domain, timeSpent) {
  if (!domain || timeSpent <= 0) return;
  
  // Get today's date in local timezone format (YYYY-MM-DD)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const currentOperation = (async () => {
    try {
      const result = await chrome.storage.local.get(['timeTrackingData']);
      let trackingData = result.timeTrackingData || {};
      if (!trackingData[today]) trackingData[today] = {};
      
      trackingData[today][domain] = (trackingData[today][domain] || 0) + timeSpent;
      await chrome.storage.local.set({ timeTrackingData: trackingData });
      console.log(`Updated ${domain}: +${timeSpent}s, Total: ${trackingData[today][domain]}s`);
    } catch (error) {
      console.error('Error updating time spent:', error);
    }
  })();

  await Promise.all([storageQueue, currentOperation]);
  storageQueue = currentOperation;
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    if (!url || !url.startsWith('http')) return null;
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Update current active tab time
async function updateActiveTabTime() {
  const now = Date.now();
  console.log('[updateActiveTabTime] Called with activeTabData:', activeTabData, 'activeTabId:', activeTabId);
  
  if (activeTabData && activeTabId && lastActiveTime) {
    // Add additional checks for browser focus and idle state
    const state = await chrome.idle.queryState(IDLE_TIMEOUT);
    const windows = await chrome.windows.getAll();
    const hasFocusedWindow = windows.some(window => window.focused);
    console.log('[updateActiveTabTime] State:', state, 'hasFocusedWindow:', hasFocusedWindow);
    
    // Only update time if browser is active and not idle
    if (state === 'active' && hasFocusedWindow) {
      const timeSpent = Math.floor((now - lastActiveTime) / 1000);
      if (timeSpent > 0) {
        await updateTimeSpent(activeTabData.domain, timeSpent);
        lastActiveTime = now; // Reset timer after updating
      }
    } else {
      // Reset lastActiveTime if browser is idle or unfocused
      lastActiveTime = now;
    }
  }
}

// Start interval-based tracking
function startTracking() {
  console.log('[startTracking] Called');
  if (trackingInterval) {
    console.log('[startTracking] Clearing existing interval');
    clearInterval(trackingInterval);
  }
  
  console.log('[startTracking] Setting up new tracking interval with UPDATE_INTERVAL:', UPDATE_INTERVAL);
  trackingInterval = setInterval(async () => {
    await updateActiveTabTime();
  }, UPDATE_INTERVAL * 1000);
}

// Stop interval-based tracking
function stopTracking() {
  console.log('[stopTracking] Called with trackingInterval:', trackingInterval ? 'active' : 'inactive');
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
    console.log('[stopTracking] Cleared tracking interval');
  }
  
  // Final update before stopping
  if (activeTabData) {
    console.log('[stopTracking] Performing final update for domain:', activeTabData.domain);
    updateActiveTabTime();
  }
}

// Handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.active) {
    handleActiveTabChange(tabId);
  }
}

// Handle tab activation
function handleTabActivated(activeInfo) {
  handleActiveTabChange(activeInfo.tabId);
}

// Handle active tab change
async function handleActiveTabChange(tabId) {
  console.log('[handleActiveTabChange] Called with tabId:', tabId);
  // Update time for previous active tab before switching
  await updateActiveTabTime();
  
  // Update active tab info
  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = extractDomain(tab.url);
    console.log('[handleActiveTabChange] Tab URL:', tab.url, 'Domain:', domain);
    
    if (domain) {
      // Check if website limit is exceeded
      const limitStatus = await checkWebsiteLimit(domain);
      
      if (limitStatus.isExceeded) {
        // Show a notification  ( add styling to this later?)
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'hello_extension.png',
          title: 'Time Limit Reached',
          message: `You've reached your time limit for ${domain}. Take a break!`
        });
        
        // Redirect to the custom blocked page
        chrome.tabs.update(tabId, { 
          url: `../html/blocked.html?domain=${encodeURIComponent(domain)}&from=${encodeURIComponent(tab.url)}` 
        });
        return;
      }
      
      activeTabId = tabId;
      activeTabData = { domain };
      lastActiveTime = Date.now();
    } else {
      activeTabId = null;
      activeTabData = null;
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
    activeTabId = null;
    activeTabData = null;
  }
}

// Handle window focus change
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  console.log('[onFocusChanged] Window focus changed. WindowId:', windowId);
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, update time and stop tracking
    await updateActiveTabTime();
    stopTracking();
    activeTabId = null;
    activeTabData = null;
    lastActiveTime = null; // Reset lastActiveTime when window loses focus
  } else {
    // Browser gained focus, get active tab and start tracking
    const windows = await chrome.windows.getAll();
    const hasFocusedWindow = windows.some(window => window.focused);
    
    if (hasFocusedWindow) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          await handleActiveTabChange(tabs[0].id);
          startTracking();
          lastActiveTime = Date.now(); // Set lastActiveTime when window gains focus
        }
      });
    }
  }
});

// Handle idle state changes
chrome.idle.onStateChanged.addListener(async (state) => {
  console.log('[onStateChanged] System state changed to:', state);
  if (state === 'active') {
    // User became active, check window focus before resuming tracking
    const windows = await chrome.windows.getAll();
    const hasFocusedWindow = windows.some(window => window.focused);
    
    if (hasFocusedWindow) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          await handleActiveTabChange(tabs[0].id);
          startTracking();
          lastActiveTime = Date.now(); // Set lastActiveTime when becoming active
        }
      });
    }
  } else {
    // User is idle/locked, update time and stop tracking
    await updateActiveTabTime();
    stopTracking();
    activeTabId = null;
    activeTabData = null;
    lastActiveTime = null; // Reset lastActiveTime during idle periods
  }
});

// Handle tab navigation
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab.active) {
        handleActiveTabChange(tab.id);
      }
    });
  }
});

// If tab is closed update
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === activeTabId) {
    updateActiveTabTime().then(() => {
      activeTabId = null;
      activeTabData = null;
    });
  }
});

// STILL NEED TO ADD MORE EDGE CASES EX. IF SWITCHED OFF GOOGLE BUT STILL OPEN IN BACKGROUND

// Event listeners 
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onActivated.addListener(handleTabActivated);

// Initialize idle detection
chrome.idle.setDetectionInterval(IDLE_TIMEOUT);

// Initialize data for today when extension loads
initializeDayData();

// Start tracking on extension load
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    handleActiveTabChange(tabs[0].id);
    startTracking();
  }
});