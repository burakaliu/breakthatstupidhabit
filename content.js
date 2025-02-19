// in case google goes dumb this is ehre for debugging
//console.log("Content script loaded");

let startTime = Date.now();
let isPageVisible = true;
let isIdle = false;
let lastActivityTime = Date.now();
const IDLE_TIMEOUT = 180000; // 3 minutes in milliseconds
// reset the idle state on user activity
function resetIdleState() {
    // the last asctive time is now
    lastActivityTime = Date.now();

    if (isIdle) {
        isIdle = false;
        startTime = Date.now(); // reset the start time when you come back from idle
    }
}

// track activity events to see if idle
document.addEventListener('mousemove', resetIdleState);
document.addEventListener('keypress', resetIdleState);
document.addEventListener('click', resetIdleState);
document.addEventListener('scroll', resetIdleState);

// check if it is idle once every minute
setInterval(() => {
    if (!isIdle && Date.now() - lastActivityTime > IDLE_TIMEOUT) { //if not idle and the current time - last active time > idle timeout time
        isIdle = true;
        sendTimeToBackground(); // send the accumulated time before going idle
        startTime = Date.now(); // once all done reset the start time
    }
}, 60000);

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
    const timeSpent = isIdle ? 0 : endTime - startTime;

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
