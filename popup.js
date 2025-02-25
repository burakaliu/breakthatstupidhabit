// Initialize the extension when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Load initial data
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

    // Initialize displays
    displayWebsiteData();
    displayWeeklyData();
    initializeContributionGraph();
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
// Remove duplicate DOMContentLoaded event listener and merge functionality
document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const contentDiv = document.getElementById('content');
    const container = document.getElementById("contribution-graph");

    // Load initial data
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

        const timeLog = data.timeLog || { productive: 0, distracting: 0, neutral: 0 };
        document.getElementById("productiveTime").textContent = (timeLog.productive / 60).toFixed(1);
        document.getElementById("distractingTime").textContent = (timeLog.distracting / 60).toFixed(1);
        document.getElementById("neutralTime").textContent = (timeLog.neutral / 60).toFixed(1);
    });

    // Initialize displays
    displayWebsiteData();
    displayWeeklyData();
    initializeContributionGraph();
});

  // Reset button functionality
  document.getElementById("resetLog").addEventListener("click", function () {
      chrome.storage.local.set({ timeLog: { productive: 0, distracting: 0, neutral: 0 } }, function () {
          document.getElementById("productiveTime").textContent = "0";
          document.getElementById("distractingTime").textContent = "0";
          document.getElementById("neutralTime").textContent = "0";
      });
  });

// Function to generate a week identifier
function getWeekIdentifier(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Set to Sunday
  return startOfWeek.toISOString().split('T')[0];
}

// Function to generate sample data
function generateSampleData() {
  const data = {};
  const today = new Date();
  
  // Generate 12 weeks of sample data
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    const weekId = getWeekIdentifier(weekDate);
    
    data[weekId] = {
      days: {}
    };
    
    // Generate data for each day of the week
    for (let j = 0; j < 7; j++) {
      const dayDate = new Date(weekDate);
      dayDate.setDate(weekDate.getDate() - dayDate.getDay() + j);
      const dayId = dayDate.toISOString().split('T')[0];
      
      // Generate random times (in minutes)
      const productive = Math.floor(Math.random() * 240);
      const neutral = Math.floor(Math.random() * 120);
      const distracting = Math.floor(Math.random() * 180);
      
      data[weekId].days[dayId] = {
        productive,
        neutral,
        distracting,
        productivityLevel: calculateProductivityLevel({ productive, distracting })
      };
    }
  }
  
  return data;
}

// Function to load sample data into storage
function loadSampleData() {
  const sampleData = generateSampleData();
  chrome.storage.local.set({ weeklyData: sampleData }, () => {
    console.log('Sample data loaded');
    displayWeeklyData();
  });
}

// Function to display weekly data
function displayWeeklyData() {
  const contentDiv = document.getElementById('content');
  if (!contentDiv) return;

  chrome.storage.local.get(['weeklyData'], (result) => {
    const weeklyData = result.weeklyData || {};
    const weeks = Object.entries(weeklyData);
    
    if (weeks.length === 0) {
      contentDiv.innerHTML = '<div class="no-data">No weekly data available</div>';
      return;
    }

    // Sort weeks by date (most recent first)
    weeks.sort(([weekA], [weekB]) => weekB.localeCompare(weekA));

    const weeklyElements = weeks.map(([weekId, weekData]) => {
      const days = Object.entries(weekData.days);
      const totalProductive = days.reduce((sum, [, day]) => sum + day.productive, 0);
      const totalDistracting = days.reduce((sum, [, day]) => sum + day.distracting, 0);
      const totalNeutral = days.reduce((sum, [, day]) => sum + day.neutral, 0);
      const avgProductivityLevel = days.reduce((sum, [, day]) => sum + day.productivityLevel, 0) / days.length;

      return `
        <div class="week-item">
          <div class="week-header">
            <h4>Week of ${new Date(weekId).toLocaleDateString()}</h4>
            <div class="productivity-score">Average Productivity: ${avgProductivityLevel.toFixed(1)}</div>
          </div>
          <div class="week-stats">
            <div class="stat-item">
              <span class="stat-label">Productive:</span>
              <span class="stat-value">${(totalProductive / 60).toFixed(1)} hours</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Distracting:</span>
              <span class="stat-value">${(totalDistracting / 60).toFixed(1)} hours</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Neutral:</span>
              <span class="stat-value">${(totalNeutral / 60).toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    contentDiv.innerHTML = `
      <div class="weekly-summary">
        ${weeklyElements}
      </div>
    `;
  });
}

// Load sample data when extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  loadSampleData();
});

// Function to initialize the contribution graph
function initializeContributionGraph() {
    const container = document.getElementById("contribution-graph");
    if (!container) return;

    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1); // starts from a year ago

    let dates = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    // Clear existing content
    container.innerHTML = '';

    // Get productivity data from storage
    chrome.storage.local.get(['weeklyData'], (result) => {
        const weeklyData = result.weeklyData || {};

        // Generate heatmap
        dates.forEach(date => {
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");

            const dateString = date.toISOString().split("T")[0];
            let level = 0;

            // Find the week that contains this date
            const weekId = getWeekIdentifier(date);
            if (weeklyData[weekId] && weeklyData[weekId].days[dateString]) {
                level = weeklyData[weekId].days[dateString].productivityLevel;
            }

            dayElement.setAttribute("data-level", level);
            dayElement.style.backgroundColor = getColorForLevel(level);
            dayElement.title = `${dateString}: Productivity Level ${level}`;

            container.appendChild(dayElement);
        });
    });
}

// Function to determine productivity score (0-4 scale)
function calculateProductivityLevel(dayLog) {
  if (!dayLog) return 0; // Default to 0 if no data

  const { productive, distracting } = dayLog;
  const totalTime = productive + distracting;

  if (totalTime === 0) return 0; // No activity recorded

  const productivityRatio = productive / totalTime;
  if (productivityRatio >= 0.8) return 4; // Very productive
  if (productivityRatio >= 0.6) return 3; // Moderately productive
  if (productivityRatio >= 0.4) return 2; // Neutral
  if (productivityRatio >= 0.2) return 1; // Slightly distracting
  return 0; // Very distracting
}
// Function to determine box color based on productivity level
function getColorForLevel(level) {
    switch (level) {
        case 1: return "#d6e685"; // Light green (low productivity)
        case 2: return "#8cc665"; // Medium-light green
        case 3: return "#44a340"; // Medium green
        case 4: return "#1e6823"; // Dark green (high productivity)
        case 5: return "#004d00"; // Very dark green (max productivity)
        default: return "#ffffff"; // White for no data
    }
}
