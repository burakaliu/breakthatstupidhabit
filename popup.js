document.addEventListener("DOMContentLoaded", function () {
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
