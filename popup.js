document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById("contribution-graph");

    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1); // One year back

    let dates = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d)); // Store each day
    }

    // Simulated productivity data (0-4 scale)
    const productivityData = {};
    dates.forEach(date => {
        const dateString = date.toISOString().split("T")[0];
        productivityData[dateString] = Math.floor(Math.random() * 5); // Random productivity levels
    });

    // Generate the heatmap
    dates.forEach(date => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");

        const dateString = date.toISOString().split("T")[0];
        const level = productivityData[dateString] || 0;
        dayElement.setAttribute("data-level", level);

        dayElement.title = `${dateString}: ${level} productivity`; // Tooltip

        container.appendChild(dayElement);
    });
});