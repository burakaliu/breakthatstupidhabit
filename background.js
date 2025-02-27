let activeTabId = null;
let activeTabData = null;
let lastActiveTime = Date.now();
let trackingInterval = null;
const IDLE_TIMEOUT = 60; // seconds
const UPDATE_INTERVAL = 5; // seconds - how often to update storage

// Initialize tracking data for new day
function initializeDayData() {
  // Get today's date in ISO format same as in popup.js (so something like "2025-03-23")
  const today = new Date().toISOString().split('T')[0];

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
async function updateTimeSpent(domain, timeSpent) {
  if (!domain || timeSpent <= 0) return;
  
  const today = new Date().toISOString().split('T')[0];
  
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
  
  if (activeTabData && activeTabId) {
    const timeSpent = Math.floor((now - lastActiveTime) / 1000);
    if (timeSpent > 0) {
      await updateTimeSpent(activeTabData.domain, timeSpent);
      // Reset timer after updating
      lastActiveTime = now; 
    }
  }
}

// Start interval-based tracking
function startTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
  }
  
  trackingInterval = setInterval(async () => {
    await updateActiveTabTime();
  }, UPDATE_INTERVAL * 1000);
}

// Stop interval-based tracking
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Final update before stopping
  if (activeTabData) {
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
  // Update time for previous active tab before switching
  await updateActiveTabTime();
  
  // Update active tab info
  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = extractDomain(tab.url);
    
    if (domain) {
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
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, update time and stop tracking
    await updateActiveTabTime();
    stopTracking();
    activeTabId = null;
    activeTabData = null;
  } else {
    // Browser gained focus, get active tab and start tracking
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        await handleActiveTabChange(tabs[0].id);
        startTracking();
      }
    });
  }
});

// Handle idle state changes
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === 'active') {
    // User became active, reset tracking
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        await handleActiveTabChange(tabs[0].id);
        startTracking();
      }
    });
  } else {
    // User is idle/locked, update time and stop tracking
    await updateActiveTabTime();
    stopTracking();
    activeTabId = null;
    activeTabData = null;
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