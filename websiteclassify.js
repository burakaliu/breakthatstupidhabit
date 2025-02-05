const distractionSites = ["youtube.com", "instagram.com", "tiktok.com", "reddit.com", "twitter.com"];
const productiveSites = ["khanacademy.org", "wikipedia.org", "coursera.org", "stackoverflow.com", "csw.schoology.com", "drive.google.com"];

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.storage.local.get("trackingEnabled", function (data) {
        if (data.trackingEnabled !== false) {
            chrome.tabs.get(activeInfo.tabId, (tab) => {
                if (tab && tab.url) {
                    classifyWebsite(tab.url);
                }
            });
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.local.get("trackingEnabled", function (data) {
        if (data.trackingEnabled !== false && changeInfo.status === "complete" && tab.url) {
            classifyWebsite(tab.url);
        }
    });
});

function classifyWebsite(url) {
    const hostname = new URL(url).hostname;

    let status;
    if (distractionSites.some(site => hostname.includes(site))) {
        status = "Offtask";
        sendNotification("Stay Focused!", "You're on " + hostname + ". Get back to work!");
    } else if (productiveSites.some(site => hostname.includes(site))) {
        status = "Ontask";
    } else {
        status = "Neutral";
    }

    chrome.storage.local.set({ currentSite: hostname, status: status });
}


function sendNotification(title, message) {
    chrome.storage.local.get("trackingEnabled", function (data) {
        if (data.trackingEnabled !== false) { 
            chrome.notifications.create({
                type: "basic",
                iconUrl: "hello_extension.png",
                title: title,
                message: message,
                priority: 2
            });
        }
    });
}
