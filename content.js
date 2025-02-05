// Content script runs in the context of web pages
console.log('Content script loaded');

// Example function to send message to background script
function sendMessageToBackground(message) {
  chrome.runtime.sendMessage({
    type: 'notification',
    message: message
  });
}

// Example of how to interact with the page
document.addEventListener('DOMContentLoaded', () => {
  // Your content script logic here
});