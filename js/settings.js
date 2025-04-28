// Initialize settings page and load saved preferences
document.addEventListener('DOMContentLoaded', async () => {
    const themeToggle = document.getElementById('theme-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const dataRetention = document.getElementById('data-retention');
    const exportDataBtn = document.getElementById('export-data');

    // Load saved settings
    const settings = await chrome.storage.local.get([
        'darkMode',
        'notifications',
        'soundAlerts',
        'dataRetention'
    ]);

    // Set initial states
    themeToggle.checked = settings.darkMode !== false;
    notificationsToggle.checked = settings.notifications !== false;
    soundToggle.checked = settings.soundAlerts === true;

    // Theme toggle handler
    themeToggle.addEventListener('change', async () => {
        await chrome.storage.local.set({ darkMode: themeToggle.checked });
        // Apply theme changes immediately
        document.body.classList.toggle('light-mode', !themeToggle.checked);
    });

    // Notifications toggle handler
    notificationsToggle.addEventListener('change', async () => {
        await chrome.storage.local.set({ notifications: notificationsToggle.checked });
    });

    // Sound alerts toggle handler
    soundToggle.addEventListener('change', async () => {
        await chrome.storage.local.set({ soundAlerts: soundToggle.checked });
    });

    // Export data handler
    exportDataBtn.addEventListener('click', async () => {
        try {
            const data = await chrome.storage.local.get(null);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'break-that-habit-data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    });
});
/*
function exportData() => {
    // Code to export data goes here
    const filename = 'data.json';
    const jsonStr = JSON.stringify(JsonExport);

    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);    
}
    */