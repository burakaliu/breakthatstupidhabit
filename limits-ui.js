// tbh I don't really get why we need to seperate the limit files but chrome is being dumb
// There was error saying background js can't use imports or something and ai said this is solution

// Import core limit management functions
import { setWebsiteLimit, getWebsiteLimits } from './limits.js';

// Format time for display (converts seconds to hours and minutes)
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Initialize the limits page
async function initLimitsPage() {
  const websitesContainer = document.getElementById('websites-container');
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get both tracking data and limits
    const [trackingData, limits] = await Promise.all([
      chrome.storage.local.get(['timeTrackingData']),
      getWebsiteLimits()
    ]);

    const todayData = trackingData.timeTrackingData?.[today] || {};

    // Calculate total time
    const totalSeconds = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    document.querySelector('.total-time .time').textContent = formatTime(totalSeconds);

    // Create website list items
    websitesContainer.innerHTML = '';
    for (const [domain, timeSpent] of Object.entries(todayData)) {
      const websiteItem = document.createElement('div');
      websiteItem.className = 'website-item';

      const limitInMinutes = limits[domain] || 0;
      const isExceeded = timeSpent >= limitInMinutes * 60 && limitInMinutes > 0;

      // Writing html in js is stupid but idk how else to do this
      websiteItem.innerHTML = `
        <div class="website-info">
          <span class="domain">${domain}</span>
          <span class="time">${formatTime(timeSpent)}</span>
        </div>
        <div class="limit-controls">
          <input type="number" 
                 value="${limitInMinutes}" 
                 min="0" 
                 class="limit-input"
                 placeholder="Minutes"
                 ${isExceeded ? 'style="border-color: #ff4444;"' : ''}
          >
          <button class="save-limit">Save</button>
        </div>
      `;

      // Add event listeners for limit controls
      const input = websiteItem.querySelector('.limit-input');
      const saveButton = websiteItem.querySelector('.save-limit');

      saveButton.addEventListener('click', async () => {
        const minutes = parseInt(input.value) || 0;
        if (minutes >= 0) {
          await setWebsiteLimit(domain, minutes);
          // Refresh the page to show updated limits
          initLimitsPage();
        }
      });

      websitesContainer.appendChild(websiteItem);
    }

    // Update focus score based on limits compliance
    updateFocusScore(todayData, limits);

  } catch (error) {
    console.error('Error initializing limits page:', error);
  }
}

// Calculate and update focus score
function updateFocusScore(todayData, limits) {
  let totalSites = 0;
  let sitesWithinLimit = 0;

  for (const [domain, timeSpent] of Object.entries(todayData)) {
    if (domain in limits) {
      totalSites++;
      if (timeSpent <= limits[domain] * 60) {
        sitesWithinLimit++;
      }
    }
  }

  const score = totalSites > 0 
    ? Math.round((sitesWithinLimit / totalSites) * 100)
    : 100;

  document.querySelector('.focus-score').textContent = `${score}%`;
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initLimitsPage);