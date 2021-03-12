log('Inited');

let CACHE;

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab) {
    log('Got message, but not from the popup');
    return;
  }

  log(`Got message ${message.type} from the popup`);

  if (message.type === 'FETCH_CACHE') {
    chrome.runtime.sendMessage({
      type: 'LOAD_CACHE',
      data: CACHE,
    });

    return;
  }

  if (message.type === 'SAVE_CACHE') {
    CACHE = message.data;
    return;
  }

  runBridge(message);

  log('Sent request to bridge');
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
  script.dataset.type = message.type;
  script.dataset.data = JSON.stringify(message.data || {});

  script.addEventListener('figma-search-extension-event', e => {
    chrome.runtime.sendMessage(e.detail);
    log(`Resent message ${e.detail.type} from bridge to popup`);
  });

  document.body.appendChild(script);
}

function log(...rest) {
  console.log('[FIGMA SEARCH: BG]', ...rest);
}
