import Chart from "/node_modules/chart.js/auto/auto.mjs";

const ctx = document.getElementById('myChart');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Hours Spent',
      data: [2, 5, 3, 7, 4, 6, 3],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  }
});


document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.container');
  const today = new Date().toISOString().split('T')[0];

  // Create sections for today's stats
  const todaySection = document.createElement('div');
  todaySection.className = 'section';
  todaySection.innerHTML = `<h2>Today's Activity</h2>`;

  const statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';

  try {
    // Get today's data from storage
    const result = await chrome.storage.local.get(['timeTrackingData']);
    const todayData = result.timeTrackingData?.[today] || {};

    // Calculate total time
    const totalSeconds = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Add total time element
    const totalTimeElement = document.createElement('div');
    totalTimeElement.className = 'stat-item total-time';
    totalTimeElement.innerHTML = `
      <span class="domain">Total Time</span>
      <span class="time">${totalHours}h ${totalMinutes}m</span>
    `;
    statsContainer.appendChild(totalTimeElement);

    // Sort domains by time spent
    const sortedDomains = Object.entries(todayData)
      .sort(([, a], [, b]) => b - a);

    // Add individual domain stats
    sortedDomains.forEach(([domain, seconds]) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
      statItem.innerHTML = `
        <span class="domain">${domain}</span>
        <span class="time">${hours}h ${minutes}m</span>
      `;
      statsContainer.appendChild(statItem);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    statsContainer.innerHTML = '<p>Error loading statistics</p>';
  }

  todaySection.appendChild(statsContainer);
  container.appendChild(todaySection);
});