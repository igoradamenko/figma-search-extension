const rootNode = document.getElementById('root');
const requestNode = document.getElementById('request');
const resultsNode = document.getElementById('results');
const listNode = document.getElementById('list');
const deepSearchNode = document.getElementById('deep-search');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let DID_DEEP_SEARCH = false;
let CACHE = {
  request: '',
  searchResult: [],
  notLoadedPagesNumber: 0,
  didDeepSearch: false,
  selectedListItemIndex: undefined,
  resultsScrollTop: 0,
};

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, { type: 'FETCH_CACHE' });
});

requestNode.addEventListener('input', e => {
  const value = e.target.value;
  console.log('input changed', value);
  updateCache({ request: value });

  debouncedSendSearchRequest(value);
});

resultsNode.addEventListener('scroll', () => {
  updateCache({ resultsScrollTop: resultsNode.scrollTop });
});

deepSearchNode.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'LOAD_PAGES' });
    console.log('popup sent load pages request');
    showLoader();
    DID_DEEP_SEARCH = true;
    updateCache({ didDeepSearch: DID_DEEP_SEARCH });
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log('popup got message', message, sender);

  switch (message.type) {
    case 'SHOW_RESULT':
      updateCache({
        searchResult: message.data.searchResult,
        notLoadedPagesNumber: message.data.notLoadedPagesNumber,
      });
      showResult(message.data);
      return;

    case 'RETRY_SEARCH':
      sendSearchRequest(requestNode.value);
      return;

    case 'LOAD_CACHE':
      loadCache(message.data);
      return;
  }
});

let listItems = [];
let selectedListItemIndex;
rootNode.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' || listItems.length === 0) {
    requestNode.focus();
    return;
  }

  requestNode.blur();

  switch (e.key) {
    case 'Enter':
      // handled by this fn just to prevent handling on input
      // we don't need to preventDefault, so just return
      return;

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
  updateCache({ selectedListItemIndex });
}

function handleArrowUp() {
  selectedListItemIndex ??= 0;
  selectedListItemIndex = (selectedListItemIndex - 1 + listItems.length) % listItems.length;
  const item = document.getElementsByClassName('list__item')[selectedListItemIndex];
  item.focus();
  updateCache({ selectedListItemIndex });
}

function sendSearchRequest(searchString) {
  if (!searchString) {
    showResult([]);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const search = searchString.toLocaleLowerCase();
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SEARCH', data: search }); // TODO: make all datas objects?
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
  updateCache({ selectedListItemIndex, resultsScrollTop: 0 });

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

function updateCache(obj) {
  CACHE = {
    ...CACHE,
    ...obj,
  };

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'SAVE_CACHE',
      data: CACHE,
    });
  });
}

function loadCache(cache) {
  if (!cache) return;

  requestNode.value = cache.request;

  // TODO: think about it
  //  now it conflicts with item.focus(), probably we have to choose between them
  // requestNode.setSelectionRange(0, cache.request.length);

  DID_DEEP_SEARCH = cache.didDeepSearch;

  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });

  selectedListItemIndex = cache.selectedListItemIndex;

  const item = document.getElementsByClassName('list__item')[selectedListItemIndex];
  item.focus();

  resultsNode.scrollTop = cache.resultsScrollTop;


  // TODO: showResult updates it, so we update it again
  //  have to split caching and rendering (and restoring for sure)
  // TODO: probably does not work correctly; fails to load cache after several
  //  clicks on the icon
  updateCache(cache);
}
