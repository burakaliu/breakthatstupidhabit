// tbh I don't really get why we need to seperate the limit files but chrome is being dumb
// There was error saying background js can't use imports or something and ai said this is solution

// Import core limit management functions
import { setWebsiteLimit, getWebsiteLimits, removeWebsiteLimit } from './limits.js';

// Format time for display (converts seconds to hours and minutes)
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Initialize the limits page
async function initLimitsPage() {
  const websitesContainer = document.getElementById('websites-container');
  const websiteSelect = document.getElementById('website-select');
  const websiteInput = document.getElementById('website-input');
  const newLimitInput = document.getElementById('new-limit-input');
  const addWebsiteBtn = document.getElementById('add-website-btn');
  // Get today's date in local timezone format (YYYY-MM-DD)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    // Get both tracking data and limits
    const [trackingData, limits] = await Promise.all([
      chrome.storage.local.get(['timeTrackingData']),
      getWebsiteLimits()
    ]);

    const todayData = trackingData.timeTrackingData?.[today] || {};

    // Calculate total time
    const totalSeconds = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    //document.querySelector('.total-time .time').textContent = formatTime(totalSeconds);

    // Populate website select dropdown
    websiteSelect.innerHTML = '<option value="">Select a visited website...</option>';
    Object.keys(todayData).forEach(domain => {
      if (!(domain in limits)) {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        websiteSelect.appendChild(option);
      }
    });

    // Create website list items
    websitesContainer.innerHTML = '';
    for (const [domain, limitInMinutes] of Object.entries(limits)) {
      const timeSpent = todayData[domain] || 0;
      const websiteItem = document.createElement('div');
      websiteItem.className = 'website-item';
      const isExceeded = timeSpent >= limitInMinutes * 60 && limitInMinutes > 0;

      websiteItem.innerHTML = `
        <div class="website-info">
          <span class="domain">${domain}</span>
          <span class="time">${formatTime(timeSpent)}</span>
          <button class="edit-button">Edit</button>
          <button class="delete-button">Delete</button>
        </div>
        <div class="limit-controls" style="display: none;">
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

      // Add event listeners for edit controls
      const editButton = websiteItem.querySelector('.edit-button');
      const deleteButton = websiteItem.querySelector('.delete-button');
      const limitControls = websiteItem.querySelector('.limit-controls');
      const input = websiteItem.querySelector('.limit-input');
      const saveButton = websiteItem.querySelector('.save-limit');

      deleteButton.addEventListener('click', async () => {
        await removeWebsiteLimit(domain);
        initLimitsPage();
      });

      editButton.addEventListener('click', () => {
        limitControls.style.display = 'flex';
        editButton.style.display = 'none';
      });

      saveButton.addEventListener('click', async () => {
        const minutes = parseInt(input.value) || 0;
        if (minutes >= 0) {
          await setWebsiteLimit(domain, minutes);
          limitControls.style.display = 'none';
          editButton.style.display = 'inline';
          initLimitsPage();
        }
      });

      websitesContainer.appendChild(websiteItem);
    }

    // Add event listener for adding new website limit
    addWebsiteBtn.addEventListener('click', async () => {
      const domain = websiteSelect.value || websiteInput.value;
      const minutes = parseInt(newLimitInput.value) || 0;

      if (domain && minutes >= 0) {
        await setWebsiteLimit(domain, minutes);
        websiteSelect.value = '';
        websiteInput.value = '';
        newLimitInput.value = '';
        initLimitsPage();
      }
    });

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