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
  chrome.storage.local.get(["currentSite", "status", "trackingEnabled", "timeLog"], function (data) {
      document.getElementById("website").innerHTML = `Current Site: <span class="highlight">${data.currentSite || "Unknown"}</span>`;
      document.getElementById("status").innerHTML = `<span class="highlight">${data.status || "Neutral"}</span>`;

      const toggle = document.getElementById("toggleTracking");
      const trackingStatus = document.getElementById("trackingStatus");

      toggle.checked = data.trackingEnabled !== false;
      trackingStatus.textContent = toggle.checked ? "ON" : "OFF";

      toggle.addEventListener("change", function () {
          chrome.storage.local.set({ trackingEnabled: toggle.checked });
          trackingStatus.textContent = toggle.checked ? "ON" : "OFF";
      });

      // Update time log display
      const timeLog = data.timeLog || { productive: 0, distracting: 0, neutral: 0 };
      document.getElementById("productiveTime").textContent = (timeLog.productive / 60).toFixed(1);
      document.getElementById("distractingTime").textContent = (timeLog.distracting / 60).toFixed(1);
      document.getElementById("neutralTime").textContent = (timeLog.neutral / 60).toFixed(1);
  });

  // Reset button functionality
  document.getElementById("resetLog").addEventListener("click", function () {
      chrome.storage.local.set({ timeLog: { productive: 0, distracting: 0, neutral: 0 } }, function () {
          document.getElementById("productiveTime").textContent = "0";
          document.getElementById("distractingTime").textContent = "0";
          document.getElementById("neutralTime").textContent = "0";
      });
  });
});
const container = document.getElementById("contribution-graph");

    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1); // starts from a year ago

    let dates = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d)); // adds dates to array
    }

    // fake data
    const productivityData = {};
    dates.forEach(date => {
        const dateString = date.toISOString().split("T")[0];
        productivityData[dateString] = Math.floor(Math.random() * 5); 
    });

    // generate heatmap
    dates.forEach(date => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");

        const dateString = date.toISOString().split("T")[0];
        const level = productivityData[dateString] || 0;
        dayElement.setAttribute("data-level", level);

        dayElement.title = `${dateString}: productivity level ${level} `; // tooltip

        container.appendChild(dayElement);
    });