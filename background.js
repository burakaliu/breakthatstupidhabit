let currentTab = null;
let lastUpdate = Date.now();

chrome.tabs.onActivated.addListener(({tabId}) => {
  updateTime();
  chrome.tabs.get(tabId, tab => {
    if (tab?.url) currentTab = classifyTab(tab.url);
    lastUpdate = Date.now();
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
  const {hostname} = new URL(url);
  let category = "neutral";
  
  if (distractionSites.some(s => hostname.includes(s))) category = "distracting";
  else if (productiveSites.some(s => hostname.includes(s))) category = "productive";

  chrome.storage.local.set({currentSite: hostname, status: category});
  return category;
}

function updateTime() {
  if (!currentTab) return;
  
  const elapsed = (Date.now() - lastUpdate) / 1000;
  chrome.storage.local.get(["timeLog"], ({timeLog = {}}) => {
    timeLog[currentTab] = (timeLog[currentTab] || 0) + elapsed;
    chrome.storage.local.set({timeLog});
  });
  
  lastUpdate = Date.now();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "timeUpdate") {
    chrome.storage.local.get(['websiteData'], ({websiteData = {}}) => {
      const {url, timeSpent} = message.data;
      websiteData[url] = websiteData[url] || {totalTime: 0, visits: 0};
      websiteData[url].totalTime += timeSpent;
      websiteData[url].visits++;
      websiteData[url].lastVisit = Date.now();
      chrome.storage.local.set({websiteData});
    });
  }
});