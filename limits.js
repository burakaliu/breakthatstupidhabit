// Core limit management functions
async function setWebsiteLimit(domain, limitInMinutes) {
  try {
    const result = await chrome.storage.local.get(['websiteLimits']);
    let limits = result.websiteLimits || {};
    limits[domain] = limitInMinutes;
    await chrome.storage.local.set({ websiteLimits: limits });
    return true;
  } catch (error) {
    console.error('Error setting website limit:', error);
    return false;
  }
}

// Get website limits from storage
async function getWebsiteLimits() {
  try {
    const result = await chrome.storage.local.get(['websiteLimits']);
    return result.websiteLimits || {};
  } catch (error) {
    console.error('Error getting website limits:', error);
    return {};
  }
}

// Check if a website has a limit and if it's exceeded
async function checkWebsiteLimit(domain) {
  try {
    const [limits, trackingData] = await Promise.all([
      getWebsiteLimits(),
      chrome.storage.local.get(['timeTrackingData'])
    ]);

    const today = new Date().toISOString().split('T')[0];
    const timeSpent = trackingData.timeTrackingData?.[today]?.[domain] || 0;
    const limitInSeconds = (limits[domain] || 0) * 60;

    return {
      hasLimit: domain in limits,
      timeSpent: timeSpent,
      limitInSeconds: limitInSeconds,
      isExceeded: timeSpent >= limitInSeconds && limitInSeconds > 0
    };
  } catch (error) {
    console.error('Error checking website limit:', error);
    return {
      hasLimit: false,
      timeSpent: 0,
      limitInSeconds: 0,
      isExceeded: false
    };
  }
}

// Remove a website limit
async function removeWebsiteLimit(domain) {
  try {
    const result = await chrome.storage.local.get(['websiteLimits']);
    let limits = result.websiteLimits || {};
    delete limits[domain];
    await chrome.storage.local.set({ websiteLimits: limits });
    return true;
  } catch (error) {
    console.error('Error removing website limit:', error);
    return false;
  }
}

// Export core functions for use in background.js bc module or something
export { 
  setWebsiteLimit,
  getWebsiteLimits,
  checkWebsiteLimit,
  removeWebsiteLimit
};