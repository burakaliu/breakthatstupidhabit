const distractionSites = ["youtube.com", "instagram.com", "tiktok.com", "reddit.com", "twitter.com"];
const productiveSites = ["khanacademy.org", "wikipedia.org", "coursera.org", "stackoverflow.com", "csw.schoology.com", "drive.google.com"];

let activeTab = null;
let lastActiveTime = Date.now();

chrome.tabs.onActivated.addListener(activeInfo => {
    trackTimeSpent();
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url) {
            activeTab = classifyWebsite(tab.url);
            lastActiveTime = Date.now();
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        trackTimeSpent();
        activeTab = classifyWebsite(tab.url);
        lastActiveTime = Date.now();
    }
});

function classifyWebsite(url) {
    const hostname = new URL(url).hostname;

    let category = "neutral";
    if (distractionSites.some(site => hostname.includes(site))) {
        category = "distracting";
    } else if (productiveSites.some(site => hostname.includes(site))) {
        category = "productive";
    }

    
    chrome.storage.local.set({ currentSite: hostname, status: category });


    chrome.storage.local.get(["trackingEnabled"], function (data) {
        if (data.trackingEnabled !== false && category === "distracting") {
            pushNotification("Stay on task!", "You are on a distracting site: " + hostname);
        }
    });

    return category;
}

function pushNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "hello_extension.png",
        title: title,
        message: message,
        priority: 2
    });
}


function trackTimeSpent() {
    if (!activeTab) return;

    const timeSpent = (Date.now() - lastActiveTime) / 1000;

    chrome.storage.local.get(["timeLog"], function (data) {
        let timeLog = data.timeLog || { productive: 0, distracting: 0, neutral: 0 };
        timeLog[activeTab] += timeSpent;

        chrome.storage.local.set({ timeLog: timeLog });
    });
}


chrome.runtime.onSuspend.addListener(() => {
    trackTimeSpent();
});
