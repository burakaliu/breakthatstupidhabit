// Get URL
const urlParams = new URLSearchParams(window.location.search);
const domain = urlParams.get('domain');

// Update domain in the displayed message 
document.getElementById('domain').textContent = domain;

// Function to format time (same as in limits-ui.js)
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Get current stats for the domain 
async function updateStats() {
    try {
        const today = new Date().toLocaleDateString();
        
        const [trackingData, limits] = await Promise.all([
            chrome.storage.local.get(['timeTrackingData']),
            chrome.storage.local.get(['websiteLimits'])
        ]);

        const todayData = trackingData.timeTrackingData?.[today] || {};
        const timeSpent = todayData[domain] || 0;
        const limitInMinutes = limits.websiteLimits?.[domain] || 0;

        // Update the stats in the UI
        document.getElementById('timeSpent').textContent = formatTime(timeSpent);
        document.getElementById('dailyLimit').textContent = formatTime(limitInMinutes * 60);
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Handle close tab button
document.getElementById('closeTab').addEventListener('click', () => {
    chrome.tabs.getCurrent(tab => {
        chrome.tabs.remove(tab.id);
    });
});

// Handle extend time button
document.getElementById('extendTime').addEventListener('click', async () => {
    try {
        const today = new Date().toLocaleDateString();
        const result = await chrome.storage.local.get(['websiteLimits']);
        let limits = result.websiteLimits || {};

        // Add 15 minutes to the current limit
        limits[domain] = (limits[domain] || 0) + 15;

        await chrome.storage.local.set({ websiteLimits: limits });
        
        // Close this tab and reopen the original URL
        const originalUrl = urlParams.get('from');
        if (originalUrl) {
            chrome.tabs.update({ url: originalUrl });
        }
    } catch (error) {
        console.error('Error extending time:', error);
    }
});

// Initialize stats when page loads
updateStats();