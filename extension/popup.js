const rootNode = document.getElementById('root');
const inputNode = document.getElementById('input');
const contentNode = document.getElementById('content');
const listNode = document.getElementById('list');
const deepSearchButtonNode = document.getElementById('deep-search');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let DID_DEEP_SEARCH = false;
let CACHE = {
  inputValue: '',
  searchResult: [],
  notLoadedPagesNumber: 0,
  didDeepSearch: false,
  selectedListItemIndex: undefined,
  contentScrollTop: 0,
};
let listItems = [];
let selectedListItemIndex;

run();

function run() {
  inputNode.addEventListener('input', onInputChange);
  contentNode.addEventListener('scroll', onResultsScroll);
  deepSearchButtonNode.addEventListener('click', onDeepSearchButtonClick);
  rootNode.addEventListener('keydown', onRootKeyDown);
  listNode.addEventListener('click', onListClick);
  chrome.runtime.onMessage.addListener(onMessageGet);

  sendMessage({ type: 'FETCH_CACHE' });
}

function onInputChange(e) {
  const value = e.target.value;

  console.log('Input changed', value);

  updateCache({ inputValue: value });

  debouncedSendSearchRequest(value);
}

function onResultsScroll(e) {
  updateCache({ contentScrollTop: contentNode.scrollTop });
}

function onDeepSearchButtonClick(e) {
  sendMessage({ type: 'LOAD_PAGES' });
  showLoader();
}

function onMessageGet(message) {
  console.log(`Popup got ${message.type}`);

  switch (message.type) {
    case 'SHOW_RESULT':
      updateCache({
        searchResult: message.data.searchResult,
        notLoadedPagesNumber: message.data.notLoadedPagesNumber,
      });
      showResult(message.data);
      return;

    case 'RETRY_SEARCH':
      // TODO: probably not the best place to make it,
      //  because RETRY_SEARCH knows nothing about deep search
      DID_DEEP_SEARCH = true;
      updateCache({ didDeepSearch: DID_DEEP_SEARCH });
      sendSearchRequest(inputNode.value);
      return;

    case 'LOAD_CACHE':
      loadCache(message.data);
      return;
  }
}

function onRootKeyDown(e) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' || listItems.length === 0) {
    inputNode.focus();
    return;
  }

  inputNode.blur();

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
}

function onListClick(e) {
  const item = e.target.closest('.list__item');
  if (!item) return;

  focus(item.dataset.id);
}

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

  const search = searchString.toLocaleLowerCase();
  sendMessage({ type: 'SEARCH', data: search }); // TODO: make all datas objects?
  showLoader();
}

function showResult(data) {
  const contentMarkup = buildResultsMarkup(data.searchResult);

  if (data.notLoadedPagesNumber && !DID_DEEP_SEARCH) {
    showDeepSearch();
  } else {
    hideDeepSearch();
  }

  if (!contentMarkup) {
    listNode.innerHTML = '';
    showEmptyNotice();
    hideLoader();
    return;
  }

  listNode.innerHTML = contentMarkup;

  listItems = [...document.querySelectorAll('.list__item')];
  selectedListItemIndex = undefined;
  updateCache({ selectedListItemIndex, contentScrollTop: 0 });

  hideEmptyNotice();
  hideLoader();
}

function focus(id) {
  sendMessage({ type: 'FOCUS', data: id });
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
  loaderTimeout = setTimeout(() => contentNode.classList.add('content_loading'), 50);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  contentNode.classList.remove('content_loading');
}

function showEmptyNotice() {
  contentNode.classList.add('content_empty');
}

function hideEmptyNotice() {
  contentNode.classList.remove('content_empty');
}

function showDeepSearch() {
  contentNode.classList.add('content_deep-search-available');
}

function hideDeepSearch() {
  contentNode.classList.remove('content_deep-search-available');
}

function updateCache(obj) {
  CACHE = {
    ...CACHE,
    ...obj,
  };

  sendMessage({ type: 'SAVE_CACHE', data: CACHE });
}

function loadCache(cache) {
  if (!cache) return;

  inputNode.value = cache.inputValue;

  inputNode.setSelectionRange(0, cache.inputValue.length);

  DID_DEEP_SEARCH = cache.didDeepSearch;

  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });

  // TODO: add focused state to the selected item
  selectedListItemIndex = cache.selectedListItemIndex;

  contentNode.scrollTop = cache.contentScrollTop;

  // TODO: showResult updates it, so we update it again
  //  have to split caching and rendering (and restoring for sure)
  // TODO: probably does not work correctly; fails to load cache after several
  //  clicks on the icon
  updateCache(cache);
}

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
    console.log(`Popup sent ${message.type}`);
  });
}
