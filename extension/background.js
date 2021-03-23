chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, updateBrowserActionState);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  updateBrowserActionState(tab);
});


function updateBrowserActionState(tab) {
  console.log('Got tab', tab);

  if (isFigmaCom(tab.url)) {
    console.log('This is Figma.com, enabling browser action');
    chrome.browserAction.enable(tab.id);
  } else {
    console.log('This is NOT Figma.com, disabling browser action');
    chrome.browserAction.disable(tab.id);
  }
}

function isFigmaCom(url) {
  return url && url.match(/^https?:\/\/(www\.)?figma\.com\//);
}
