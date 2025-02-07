// in case google goes dumb this is ehre for debugging
//console.log("Content script loaded");

let startTime = Date.now();
let isPageVisible = true;

// tracks if the page is visible
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isPageVisible = false;
    sendTimeToBackground();
  } else {
    isPageVisible = true;
    startTime = Date.now();
  }
});

// send time data to background script
function sendTimeToBackground() {
    console.log("sending data to background");
    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    // only track if greater than a second bc what if they accidentely just switched to the page
    if (timeSpent > 1000) {
        chrome.runtime.sendMessage({
        type: "timeUpdate",
        data: {
            url: window.location.hostname,
            timeSpent: timeSpent,
            timestamp: endTime,
        },
        });
    }
}

// send data before page unloads to make sure data is not lost
window.addEventListener("beforeunload", () => {
  if (isPageVisible) {
    console.log("sending data before unload");
    sendTimeToBackground();
  }
});

// initialize when page opened
document.addEventListener("DOMContentLoaded", () => {
  startTime = Date.now();
});

// periodically send updates during long sessions 
setInterval(() => {
    console.log("sending data periodically");
    if (isPageVisible) {
        sendTimeToBackground(); // send the update to the background script
        startTime = Date.now(); // reset start time after sending update
    }
}, 60000); // update every minute 
