document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["currentSite", "status", "trackingEnabled", "timeLog"], function (data) {
      document.getElementById("website").innerHTML = `Current Site: <span class="highlight">${data.currentSite || "Unknown"}</span>`;
      document.getElementById("status").innerHTML = `<span class="highli    ght">${data.status || "Neutral"}</span>`;

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


  document.getElementById("resetLog").addEventListener("click", function () {
      chrome.storage.local.set({ timeLog: { productive: 0, distracting: 0, neutral: 0 } }, function () {
          document.getElementById("productiveTime").textContent = "0";
          document.getElementById("distractingTime").textContent = "0";
          document.getElementById("neutralTime").textContent = "0";
      });
  });
});
