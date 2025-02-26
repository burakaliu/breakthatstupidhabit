import Chart from "/node_modules/chart.js/auto/auto.mjs";

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.container');
  const today = new Date().toISOString().split('T')[0];

  // Create Today's Focus section
  const focusSection = document.createElement('div');
  focusSection.className = 'section';
  focusSection.innerHTML = `
    <h2>Today's Focus</h2>
    <div class="stats-container">
      <div class="stat-item total-time">
        <span class="domain">⏰ Total Time</span>
        <span class="time">8h 0m</span>
      </div>
    </div>
  `;
  container.appendChild(focusSection);

  // Create Websites Used Today section
  const websitesSection = document.createElement('div');
  websitesSection.className = 'section';
  websitesSection.innerHTML = `<h2>Websites Used Today</h2>`;

  const statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';
  // Get data for the past week
  const dates = [];
  const todayDate = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  try {
    const result = await chrome.storage.local.get(['timeTrackingData']);
    const weekData = dates.map(date => {
      const dayData = result.timeTrackingData?.[date] || {};
      // Convert seconds to hours
      const totalHours = Object.values(dayData).reduce((sum, seconds) => sum + seconds/3600, 0);
      return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
    });

    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Hours Spent',
          data: weekData,
          backgroundColor: 'rgba(99, 93, 255, 0.7)',
          borderColor: 'rgba(99, 93, 255, 1)',
          borderWidth: 1,
          borderRadius: 5,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#999',
              callback: function(value) {
                return value + 'h';
              }
            },
            border: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#999'
            },
            border: {
              display: false
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  }

  // Create Weekly Screen Time section
  const weeklySection = document.createElement('div');
  weeklySection.className = 'section';
  weeklySection.innerHTML = `<h2>Weekly Screen Time</h2>`;

  const chartContainer = document.createElement('div');
  chartContainer.style.height = '200px';
  const canvas = document.createElement('canvas');
  canvas.id = 'myChart';
  chartContainer.appendChild(canvas);
  weeklySection.appendChild(chartContainer);
  container.appendChild(weeklySection);

  // Create sections for today's stats
  const todaySection = document.createElement('div');
  todaySection.className = 'section';
  todaySection.innerHTML = `<h2>Today's Activity</h2>`;


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