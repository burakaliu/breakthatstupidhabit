const distractionSites = [
    "youtube.com", "instagram.com", "tiktok.com", "reddit.com", "twitter.com",
    "facebook.com", "snapchat.com", "netflix.com", "hulu.com", "primevideo.com",
    "twitch.tv", "discord.com", "pinterest.com", "tumblr.com", "roblox.com",
    "epicgames.com", "fortnite.com", "steampowered.com", "xbox.com", "playstation.com",
    "minecraft.net", "leagueoflegends.com", "valorant.com", "genshinimpact.com",
    "amongus.com", "coolmathgames.com", "agar.io", "slither.io", "spotify.com",
    "soundcloud.com", "apple.com/music", "pandora.com", "quora.com", "9gag.com",
    "buzzfeed.com", "boredpanda.com", "imgur.com", "ifunny.co", "vine.co",
    "kick.com", "yikyak.com", "omegle.com", "popcap.com", "miniclip.com",
    "kongregate.com", "addictinggames.com", "newgrounds.com", "gog.com",
    "vimeo.com", "dailymotion.com", "movie4k.to", "putlocker.vip", "fmovies.to",
    "soap2day.to", "yesmovies.ag", "watchcartoononline.io", "crunchyroll.com",
    "funimation.com", "anime-planet.com", "myanimelist.net", "giphy.com",
    "bitly.com", "linktr.ee", "deviantart.com", "pixiv.net", "weheartit.com",
    "zillow.com", "realtor.com", "etsy.com", "ebay.com", "aliexpress.com",
    "wish.com", "amazon.com", "shein.com", "fashionnova.com", "zara.com",
    "ikea.com", "stockx.com", "goat.com", "grailed.com", "ubereats.com",
    "doordash.com", "grubhub.com", "postmates.com", "tripadvisor.com",
    "airbnb.com", "expedia.com", "booking.com", "hotels.com", "weather.com",
    "cnn.com", "foxnews.com", "bbc.com", "dailymail.co.uk", "usatoday.com"
];

const productiveSites = [
    "khanacademy.org", "wikipedia.org", "coursera.org", "edx.org", "quizlet.com",
    "csw.schoology.com", "drive.google.com", "docs.google.com", "sheets.google.com",
    "classroom.google.com", "calendar.google.com", "notion.so", "evernote.com",
    "slack.com", "zoom.us", "stackexchange.com", "stackoverflow.com", "github.com",
    "geogebra.org", "desmos.com", "brilliant.org", "mit.edu", "harvard.edu",
    "yale.edu", "princeton.edu", "stanford.edu", "berkeley.edu", "ocw.mit.edu",
    "futurelearn.com", "udemy.com", "codeacademy.com", "replit.com", "hackerrank.com",
    "codeforces.com", "leetcode.com", "wolframalpha.com", "symbolab.com", 
    "physicsclassroom.com", "mathisfun.com", "purplemath.com", "sparknotes.com",
    "cliffsnotes.com", "grammarly.com", "dictionary.com", "thesaurus.com",
    "merriam-webster.com", "britannica.com", "nationalgeographic.com", 
    "history.com", "pbs.org", "archive.org", "jstor.org", "researchgate.net",
    "sciencedirect.com", "nature.com", "arxiv.org", "projectgutenberg.org",
    "libgen.is", "duolingo.com", "memrise.com", "linguee.com", "quizizz.com",
    "kahoot.com", "blooket.com", "ted.com", "teded.com", "scholar.google.com",
    "coggle.it", "trello.com", "asana.com", "canvaslms.com", "blackboard.com",
    "readworks.org", "newsela.com", "commonlit.org", "gutenberg.org",
    "scribbr.com", "turnitin.com", "prezi.com", "canva.com", "overleaf.com",
    "mathway.com", "photomath.com", "desmos.com", "refdesk.com", "factmonster.com",
    "howstuffworks.com", "coursera.org", "edmodo.com", "mathplanet.com", 
    "ixl.com", "sumdog.com", "coolmath.com", "noaa.gov", "nasa.gov",
    "si.edu", "libraryofcongress.gov", "un.org", "who.int", "cdc.gov",
    "oercommons.org", "ck12.org", "albert.io", "apclassroom.collegeboard.org",
    "collegeboard.org"
];


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
