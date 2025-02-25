document.addEventListener('DOMContentLoaded', () => {
  const updateUI = ({ timeLog = {}, status = 'neutral' }) => {
      document.getElementById('popProductive').textContent = `${Math.round(timeLog.productive / 60)}m`;
      document.getElementById('popDistracting').textContent = `${Math.round(timeLog.distracting / 60)}m`;
      document.getElementById('popNeutral').textContent = `${Math.round(timeLog.neutral / 60)}m`;
      
      const statusElement = document.getElementById('currentStatus');
      statusElement.className = `status-indicator ${status}`;
      statusElement.textContent = `${status === 'productive' ? '🟢' : '🔴'} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  };

  chrome.storage.local.get(['timeLog', 'status'], updateUI);
  chrome.storage.onChanged.addListener(changes => {
      if (changes.timeLog || changes.status) updateUI(changes);
  });

  document.getElementById('trackingToggle').addEventListener('change', (e) => {
      chrome.runtime.sendMessage({ type: "toggleTracking", status: e.target.checked });
  });

  document.getElementById('dashboardButton').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
});
