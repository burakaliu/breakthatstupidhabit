
console.log('Content script loaded');


function sendMessageToBackground(message) {
  chrome.runtime.sendMessage({
    type: 'notification',
    message: message
  });
}


document.addEventListener('DOMContentLoaded', () => {

});