let activeTabId = null;
let activeTabData = null;
let lastActiveTime = Date.now();
const IDLE_TIMEOUT = 60; // seconds

// Initialize tracking data for new day
function initializeDayData() {
  //idk tbh
  const today = new Date().toISOString().split('T')[0];

  // Check wewther data exists for today, if not, initialize it
  chrome.storage.local.get(['timeTrackingData'], (result) => {
    if (!result.timeTrackingData) {
      chrome.storage.local.set({ timeTrackingData: { [today]: {} } });
    } else if (!result.timeTrackingData[today]) {
      result.timeTrackingData[today] = {};
      chrome.storage.local.set({ timeTrackingData: result.timeTrackingData });
    }
  });
}

// Update time spent on a domain
async function updateTimeSpent(domain, timeSpent) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const result = await chrome.storage.local.get(['timeTrackingData']);
    const trackingData = result.timeTrackingData || { [today]: {} };
    if (!trackingData[today]) trackingData[today] = {};
    trackingData[today][domain] = (trackingData[today][domain] || 0) + timeSpent;
    await chrome.storage.local.set({ timeTrackingData: trackingData });
  } catch (error) {
    console.error('Error updating time spent:', error);
  }
}

// helper function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Fringe cases

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
  const now = Date.now();
  
  // Update time for previous active tab
  if (activeTabData && activeTabId) {
    const timeSpent = Math.floor((now - lastActiveTime) / 1000);
    if (timeSpent > 0) {
      await updateTimeSpent(activeTabData.domain, timeSpent);
    }
  }
  
  // Update active tab info
  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = extractDomain(tab.url);
    if (domain) {
      activeTabId = tabId;
      activeTabData = { domain };
      lastActiveTime = now;
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
    activeTabId = null;
    activeTabData = null;
  }
}

// Handle window focus change
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, update time for active tab
    if (activeTabData) {
      const timeSpent = Math.floor((Date.now() - lastActiveTime) / 1000);
      if (timeSpent > 0) {
        updateTimeSpent(activeTabData.domain, timeSpent);
      }
    }
    activeTabId = null;
    activeTabData = null;
  } else {
    // Browser gained focus, get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        handleActiveTabChange(tabs[0].id);
      }
    });
  }
});

// Handle idle state changes
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active') {
    // User became active, reset tracking
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        handleActiveTabChange(tabs[0].id);
      }
    });
  } else {
    // User is idle/locked, update time for active tab
    if (activeTabData) {
      const timeSpent = Math.floor((Date.now() - lastActiveTime) / 1000);
      if (timeSpent > 0) {
        updateTimeSpent(activeTabData.domain, timeSpent);
      }
    }
    activeTabId = null;
    activeTabData = null;
  }
});

// Event listeners 
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onActivated.addListener(handleTabActivated);

// Initialize idle detection
chrome.idle.setDetectionInterval(IDLE_TIMEOUT);

// Initialize data for today when extension loads
initializeDayData();