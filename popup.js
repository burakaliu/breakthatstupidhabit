import Chart from "/node_modules/chart.js/auto/auto.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  // Get today's date and conver it to something like "2025-06-17"
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date();

  // U7pdate Today's Focus Time
  try {
    const result = await chrome.storage.local.get(["timeTrackingData"]);
    const todayData = result.timeTrackingData?.[today] || {};

    // Calculate today's total time
    const totalSeconds = Object.values(todayData).reduce(
      (sum, time) => sum + time,
      0
    );

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Update total time display
    document.querySelector(
      ".total-time .time"
    ).textContent = `${totalHours}h ${totalMinutes}m`;

    // Fill up websites used today
    const websitesContainer = document.getElementById("websites-container");
    websitesContainer.innerHTML = Object.entries(todayData)
      .filter(([, seconds]) => seconds >= 60) // This filters out entries less than 1 min
      .sort(([, a], [, b]) => b - a) // This part makes me want to kill myself don't ask me how it works but it sorts the websites in descending order
      .map(([domain, seconds]) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `
                    <div class="website-item">
                        <span class="domain">${domain}</span>
                        <span class="time">${hours}h ${minutes}m</span>
                    </div>
                `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  // Weekly Chart Setup
  try {
    // Get the last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - 6 + i);
      return date;
    });

    // Get the data for each day
    const result = await chrome.storage.local.get(["timeTrackingData"]);
    const weekData = dates.map((date) => {
      const dateString = date.toISOString().split("T")[0];
      const dayData = result.timeTrackingData?.[dateString] || {};
      return Object.values(dayData).reduce(
        (sum, seconds) => sum + seconds / 3600,
        0
      );
    });

    console.log(weekData);

    const ctx = document.getElementById("myChart");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: dates.map((date) =>
          date.toLocaleDateString("en-US", { weekday: "short" })
        ),
        datasets: [
          {
            data: weekData,
            backgroundColor: "rgba(99, 93, 255, 0.7)",
            borderColor: "rgba(99, 93, 255, 1)",
            borderWidth: 1,
            borderRadius: 5,
            barThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: {
              callback: (value) => value + "h",
              color: "#999",
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#999" },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error creating chart:", error);
  }
});
