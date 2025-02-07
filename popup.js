//display the data when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  
});

// format to make it look good
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

//why am i even commenting this just read the function name
function displayWebsiteData() {
  const contentDiv = document.getElementById('content'); //get the content div
  
  // get data frome local storage
  chrome.storage.local.get('websiteData', (result) => {
    const websiteData = result.websiteData || {};
    const websites = Object.entries(websiteData);

    //if theres no data then say theres no data
    if (websites.length === 0) {
      contentDiv.innerHTML = '<div class="no-data">No tracking data available yet</div>';
      return;
    }

    // sort websites by total time spent (descending)
    websites.sort(([, a], [, b]) => b.totalTime - a.totalTime);

    //make the website elements 
    const websiteElements = websites.map(([url, data]) => `
      <div class="website-item">
        <div class="website-url">${url}</div>
        <div class="website-stats">
          ${formatTime(data.totalTime)} | ${data.visits} visits<br>
          Last: ${formatDate(data.lastVisit)}
        </div>
      </div>
    `).join('');


    // ADD THE CHILDRN
    contentDiv.innerHTML = websiteElements;
  });
}
document.addEventListener("DOMContentLoaded", function () {
    displayWebsiteData();
  chrome.storage.local.get(["currentSite", "status", "trackingEnabled"], function (data) {
      document.getElementById("website").textContent = data.currentSite || "Unknown";
      document.getElementById("status").textContent = data.status || "Neutral";

      const toggle = document.getElementById("toggleTracking");
      const trackingStatus = document.getElementById("trackingStatus");

      // Set switch state based on stored value
      if (data.trackingEnabled === false) {
          toggle.checked = false;
          trackingStatus.textContent = "OFF";
      } else {
          toggle.checked = true;
          trackingStatus.textContent = "ON";
      }

      toggle.addEventListener("change", function () {
          const enabled = toggle.checked;
          chrome.storage.local.set({ trackingEnabled: enabled });
          trackingStatus.textContent = enabled ? "ON" : "OFF";
      });
  });
});
