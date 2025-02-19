document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["currentSite", "status", "trackingEnabled", "timeLog", "dailyLogs", "lastResetDate"], function (data) {
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

      // Check if we need to reset logs
      resetDailyLogIfNeeded(data.lastResetDate, data.timeLog, data.dailyLogs || {});

      // Display updated time log
      updateLogDisplay(data.timeLog);
  });

  document.getElementById("resetLog").addEventListener("click", function () {
      resetLogManually();
  });

  generateHeatmap();
});

// Function to reset log at midnight and store the past day's data
function resetDailyLogIfNeeded(lastResetDate, timeLog, dailyLogs) {
  const today = new Date().toISOString().split("T")[0];

  if (lastResetDate !== today) {
      // Store yesterday's log before resetting
      dailyLogs[lastResetDate] = timeLog || { productive: 0, distracting: 0, neutral: 0 };

      // Reset log
      chrome.storage.local.set({
          timeLog: { productive: 0, distracting: 0, neutral: 0 },
          lastResetDate: today,
          dailyLogs: dailyLogs
      });

      console.log("Daily log reset & stored:", dailyLogs);
  }
}

// Function to manually reset logs
function resetLogManually() {
  chrome.storage.local.set({ timeLog: { productive: 0, distracting: 0, neutral: 0 } }, function () {
      updateLogDisplay({ productive: 0, distracting: 0, neutral: 0 });
  });
}

// Function to update log display
function updateLogDisplay(timeLog) {
  document.getElementById("productiveTime").textContent = (timeLog.productive / 60).toFixed(1);
  document.getElementById("distractingTime").textContent = (timeLog.distracting / 60).toFixed(1);
  document.getElementById("neutralTime").textContent = (timeLog.neutral / 60).toFixed(1);
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

// Function to generate heatmap
function generateHeatmap() {
  chrome.storage.local.get("dailyLogs", function (data) {
      const container = document.getElementById("contribution-graph");
      if (!container) return;

      container.innerHTML = ""; // Clear previous graph
      const dailyLogs = data.dailyLogs || {};
      const today = new Date();
      const startDate = new Date();
      startDate.setFullYear(today.getFullYear() - 1);

      let dates = [];
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
      }

      dates.forEach(date => {
          const dayElement = document.createElement("div");
          dayElement.classList.add("day");

          const dateString = date.toISOString().split("T")[0];
          const level = calculateProductivityLevel(dailyLogs[dateString]);

          dayElement.setAttribute("data-level", level);
          dayElement.style.backgroundColor = getColorForLevel(level);
          dayElement.title = `${dateString}: Productivity Level ${level}`;

          container.appendChild(dayElement);
      });
  });
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
