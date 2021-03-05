console.log('bg here');

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab) {
    console.log('bg got message, but not from the popup');
    return;
  }

  console.log('bg got message from the popup', message);

  runBridge(message);

  console.log('bg sent request to bridge');
});

function runBridge(message) {
  const SCRIPT_ID = 'figma-search-extension-request';

  let script = document.getElementById(SCRIPT_ID)

  if (script) {
    script.remove();
  }

  script = document.createElement('script');
  script.src = chrome.runtime.getURL('figma-bridge.js');
  script.id = SCRIPT_ID;
  script.dataset.extId = chrome.runtime.id;
  script.dataset.type = message.type;
  script.dataset.data = message.data;

  document.body.appendChild(script);
}
