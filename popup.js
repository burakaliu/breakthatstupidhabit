document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById("contribution-graph");

    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1); // starts from a year ago

    let dates = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d)); // adds dates to array
    }

    // fake data
    const productivityData = {};
    dates.forEach(date => {
        const dateString = date.toISOString().split("T")[0];
        productivityData[dateString] = Math.floor(Math.random() * 5); 
    });

    // generate heatmap
    dates.forEach(date => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("day");

        const dateString = date.toISOString().split("T")[0];
        const level = productivityData[dateString] || 0;
        dayElement.setAttribute("data-level", level);

        dayElement.title = `${dateString}: productivity level ${level} `; // tooltip

        container.appendChild(dayElement);
    });
});