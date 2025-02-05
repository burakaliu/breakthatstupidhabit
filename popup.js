document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["currentSite", "status", "trackingEnabled", "timeLog"], function (data) {
      document.getElementById("website").textContent = data.currentSite || "Unknown";
      document.getElementById("status").textContent = data.status || "Neutral";

      const toggle = document.getElementById("toggleTracking");
      const trackingStatus = document.getElementById("trackingStatus");

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

      // Update time log display
      const timeLog = data.timeLog || { productive: 0, distracting: 0, neutral: 0 };
      document.getElementById("productiveTime").textContent = timeLog.productive.toFixed(1);
      document.getElementById("distractingTime").textContent = timeLog.distracting.toFixed(1);
      document.getElementById("neutralTime").textContent = timeLog.neutral.toFixed(1);
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
