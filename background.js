let currentTab = null;
let lastUpdate = Date.now();
let trackingEnabled = true;
const distractionSites = [/* your distraction sites */];
const productiveSites = [/* your productive sites */];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    timeLog: { productive: 0, distracting: 0, neutral: 0 },
    websiteData: {},
    dailyLog: {}
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateTime();
  chrome.tabs.get(tabId, (tab) => {
    if (tab?.url) {
      currentTab = classifyTab(tab.url);
      lastUpdate = Date.now();
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url) {
    updateTime();
    currentTab = classifyTab(tab.url);
    lastUpdate = Date.now();
  }
});

function classifyTab(url) {
  const { hostname } = new URL(url);
  let category = "neutral";
  if (distractionSites.some(s => hostname.includes(s))) category = "distracting";
  else if (productiveSites.some(s => hostname.includes(s))) category = "productive";
  
  chrome.storage.local.set({ 
    currentSite: hostname, 
    status: category,
    lastUpdated: Date.now()
  });
  return category;
}

function updateTime() {
  if (!currentTab || !trackingEnabled) return;
  
  const elapsed = (Date.now() - lastUpdate) / 1000;
  const dateKey = new Date().toISOString().split('T')[0];
  
  chrome.storage.local.get(["timeLog", "dailyLog"], ({ timeLog, dailyLog }) => {
    timeLog[currentTab] = (timeLog[currentTab] || 0) + elapsed;
    dailyLog[dateKey] = (dailyLog[dateKey] || 0) + elapsed;
    
    chrome.storage.local.set({ timeLog, dailyLog });
    lastUpdate = Date.now();
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleTracking") {
    trackingEnabled = message.status;
    chrome.action.setIcon({
      path: trackingEnabled ? "icon.png" : "icon-disabled.png"
    });
  }
});