import { productiveSites, distractionSites } from './sitelist.js';

export function calculateTimeBreakdown(timeTrackingData) {
    let productiveTime = 0;
    let unproductiveTime = 0;

    for (const [domain, timeSpent] of Object.entries(timeTrackingData)) {
        // Convert domain to match format in lists (remove www. if present)
        const normalizedDomain = domain.replace('www.', '');

        if (productiveSites.includes(normalizedDomain)) {
            productiveTime += timeSpent;
        } else if (distractionSites.includes(normalizedDomain)) {
            unproductiveTime += timeSpent;
        }
    }

    return { productiveTime, unproductiveTime };
}

export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

export function updateTimeBreakdown(todayData) {
    const { productiveTime, unproductiveTime } = calculateTimeBreakdown(todayData);
    
    // Update the productive time display
    const productiveTimeElement = document.querySelector('.productive-time .time');
    if (productiveTimeElement) {
        productiveTimeElement.textContent = formatTime(productiveTime);
    }

    // Update the unproductive time display
    const unproductiveTimeElement = document.querySelector('.unproductive-time .time');
    if (unproductiveTimeElement) {
        unproductiveTimeElement.textContent = formatTime(unproductiveTime);
    }
}