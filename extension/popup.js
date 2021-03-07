const rootNode = document.getElementById('root');
const requestNode = document.getElementById('request');
const resultsNode = document.getElementById('results');
const listNode = document.getElementById('list');
const deepSearchNode = document.getElementById('deep-search');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let DID_DEEP_SEARCH = false;

requestNode.addEventListener('input', e => {
  console.log('input changed', e.target.value);

  debouncedSendSearchRequest(e.target.value);
});

deepSearchNode.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'LOAD_PAGES' });
    console.log('popup sent load pages request');
    showLoader();
    DID_DEEP_SEARCH = true;
  });
});

chrome.runtime.onMessageExternal.addListener(message => {
  console.log('popup got ext message', message);

  switch (message.type) {
    case 'SHOW_RESULT':
      showResult(message.data);
      return;

    case 'RETRY_SEARCH':
      sendSearchRequest(requestNode.value);
      return;
  }
});

let listItems = [];
let selectedListItemIndex;
rootNode.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (listItems.length === 0) return;

  requestNode.blur();

  switch (e.key) {
    case 'ArrowDown':
      handleArrowDown();
      break;

    case 'ArrowUp':
      handleArrowUp();
      break;
  }

  // do not scroll the scrolling area
  e.preventDefault();
});

listNode.addEventListener('click', e => {
  const item = e.target.closest('.list__item');
  if (!item) return;

  focus(item.dataset.id);
});

function handleArrowDown() {
  selectedListItemIndex ??= -1;
  selectedListItemIndex = (selectedListItemIndex + 1) % listItems.length;
  const item = document.getElementsByClassName('list__item')[selectedListItemIndex];
  item.focus();
}

function handleArrowUp() {
  selectedListItemIndex ??= 0;
  selectedListItemIndex = (selectedListItemIndex - 1 + listItems.length) % listItems.length;
  const item = document.getElementsByClassName('list__item')[selectedListItemIndex];
  item.focus();
}

function sendSearchRequest(searchString) {
  if (!searchString) {
    showResult([]);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const search = searchString.toLocaleLowerCase();
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SEARCH', data: search });
    console.log('popup sent search request', search);
    showLoader();
  });
}

function showResult(data) {
  const resultsMarkup = buildResultsMarkup(data.searchResult);

  if (data.notLoadedPagesNumber && !DID_DEEP_SEARCH) {
    showDeepSearch();
  } else {
    hideDeepSearch();
  }

  if (!resultsMarkup) {
    listNode.innerHTML = '';
    showEmptyNotice();
    hideLoader();
    return;
  }

  listNode.innerHTML = resultsMarkup;

  listItems = [...document.querySelectorAll('.list__item')];
  selectedListItemIndex = undefined;

  hideEmptyNotice();
  hideLoader();
}

function focus(id) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'FOCUS', data: id });
    console.log('popup sent focus request', id);
  });
}

function buildResultsMarkup(items = []) {
  if (!items.length) return '';

  return items.map(i => {
    return `<li><button class="list__item list__item_type_${i.type}" type="button" data-id="${i.id}">${i.name}</button></li>`
  }).join('');
}

function debounce(fn, ms) {
  let timeoutId = null;
  return (...rest) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, ms, ...rest);
  };
}

let loaderTimeout = null;
function showLoader() {
  clearTimeout(loaderTimeout);
  loaderTimeout = setTimeout(() => resultsNode.classList.add('results_loading'), 50);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  resultsNode.classList.remove('results_loading');
}

function showEmptyNotice() {
  resultsNode.classList.add('results_empty');
}

function hideEmptyNotice() {
  resultsNode.classList.remove('results_empty');
}

function showDeepSearch() {
  resultsNode.classList.add('results_deep-search-available');
}

function hideDeepSearch() {
  resultsNode.classList.remove('results_deep-search-available');
}
