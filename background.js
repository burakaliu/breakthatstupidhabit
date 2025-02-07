// listen for when extension is installed (used to initialize storage)
chrome.runtime.onInstalled.addListener(() => {
  console.log('extension installed');
  // if the list doesnt exist yet then initialize it
  chrome.storage.local.get('websiteData', (result) => {
    if (!result.websiteData) {
      chrome.storage.local.set({ websiteData: {} });
    }
  });
});

// listens to messages from content script to update data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("recieved message from content script")
    if (request.type === 'timeUpdate') {
        updateWebsiteData(request.data);
    }
    return true;
});

// i dont really need a comment for this its self explanatory
function updateWebsiteData(data) {
  chrome.storage.local.get('websiteData', (result) => {
    const websiteData = result.websiteData || {};
    const url = data.url;
    
    if (!websiteData[url]) {
      websiteData[url] = {
        totalTime: 0,
        lastVisit: data.timestamp,
        visits: 0
      };
    }
    
    websiteData[url].totalTime += data.timeSpent;
    websiteData[url].lastVisit = data.timestamp;
    websiteData[url].visits += 1;
    
    chrome.storage.local.set({ websiteData }, () => {
      console.log('Website data updated:', url);
    });
  });
}