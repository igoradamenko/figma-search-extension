const rootNode = document.getElementById('root');
const inputNode = document.getElementById('input');
const contentNode = document.getElementById('content');
const listNode = document.getElementById('list');
const deepSearchButtonNode = document.getElementById('deep-search');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let listItems = [];
let selectedListItemIndex;
let didDeepSearch = false;

run();

function run() {
  inputNode.addEventListener('input', onInputChange);
  contentNode.addEventListener('scroll', onContentScroll);
  deepSearchButtonNode.addEventListener('click', onDeepSearchButtonClick);
  rootNode.addEventListener('keydown', onRootKeyDown);
  listNode.addEventListener('click', onListClick);
  chrome.runtime.onMessage.addListener(onMessageGet);

  sendMessage({ type: 'FETCH_CACHE' });
}



/* COMMUNICATION */

function onMessageGet(message) {
  console.log(`Popup got ${message.type}`);

  switch (message.type) {
    case 'SHOW_RESULT':
      updateCache({
        searchResult: message.data.searchResult,
        notLoadedPagesNumber: message.data.notLoadedPagesNumber,
      });
      showResult(message.data);
      resetContentState();
      return;

    case 'RETRY_SEARCH':
      // TODO: probably not the best place to make it,
      //  because RETRY_SEARCH knows nothing about deep search
      didDeepSearch = true;
      updateCache({ didDeepSearch });
      sendSearchRequest(inputNode.value);
      return;

    case 'LOAD_CACHE':
      loadCache(message.data);
      return;
  }
}


/* DOM EVENTS HANDLERS */

function onInputChange(e) {
  const value = e.target.value;

  console.log('Input changed', value);

  updateCache({ inputValue: value });

  debouncedSendSearchRequest(value);
}

function onContentScroll(e) {
  console.log('Content scrolled');
  updateCache({ contentScrollTop: contentNode.scrollTop });
}

function onDeepSearchButtonClick(e) {
  console.log('Deep search button clicked');
  sendMessage({ type: 'LOAD_PAGES' });
  showLoader();
}

function onRootKeyDown(e) {
  console.log('Some key pressed');

  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' || listItems.length === 0) {
    console.log('Keypress left unhandled');
    pseudoBlurListItems();
    inputNode.focus();
    return;
  }

  console.log(`It is ${e.key} key`);
  inputNode.blur();

  switch (e.key) {
    case 'Enter':
      // handled by this fn just to prevent handling on input
      // we don't need to preventDefault, so just return
      return;

    case 'ArrowDown':
      // do not scroll the scrolling area
      e.preventDefault();
      handleArrowDown();
      return;

    case 'ArrowUp':
      // do not scroll the scrolling area
      e.preventDefault();
      handleArrowUp();
      return;
  }
}

function onListClick(e) {
  console.log('List clicked');

  const item = e.target.closest('.list__item');
  if (!item) {
    console.log('Clicked item not found')
    return;
  }

  console.log('Clicked item found');

  pseudoBlurListItems();
  selectedListItemIndex = [...document.querySelectorAll('.list__item')].findIndex(i => i === item);
  updateCache({ selectedListItemIndex });

  sendMessage({
    type: 'FOCUS',
    data: {
      itemId: item.dataset.id,
    },
  });
}

function handleArrowDown() {
  selectedListItemIndex ??= -1;
  selectedListItemIndex = (selectedListItemIndex + 1) % listItems.length;
  updateCache({ selectedListItemIndex });

  focusListItem(selectedListItemIndex);
}

function handleArrowUp() {
  selectedListItemIndex ??= 0;
  selectedListItemIndex = (selectedListItemIndex - 1 + listItems.length) % listItems.length;
  updateCache({ selectedListItemIndex });

  focusListItem(selectedListItemIndex);
}


/* SEARCH */

function sendSearchRequest(searchString) {
  if (!searchString) {
    showResult([]);
    resetContentState();
    return;
  }

  searchString = searchString.toLocaleLowerCase();
  sendMessage({
    type: 'SEARCH',
    data: { searchString },
  });
  showLoader();
}



/* MARKUP */

function showResult(data) {
  const contentMarkup = buildResultsMarkup(data.searchResult);

  if (data.notLoadedPagesNumber && !didDeepSearch) {
    showDeepSearchButton();
  } else {
    hideDeepSearchButton();
  }

  if (!contentMarkup) {
    listNode.innerHTML = '';
    showEmptyNotice();
    hideLoader();
    return;
  }

  listNode.innerHTML = contentMarkup;

  listItems = [...document.querySelectorAll('.list__item')];

  hideEmptyNotice();
  hideLoader();
}

function buildResultsMarkup(items = []) {
  if (!items.length) return '';

  return items.map(i => {
    return `<li><button class="list__item list__item_type_${i.type}" type="button" data-id="${i.id}">${i.name}</button></li>`
  }).join('');
}



/* MARKUP STATES */

function focusListItem(listItemId) {
  pseudoBlurListItems();

  const item = document.getElementsByClassName('list__item')[listItemId];
  item.focus();
  console.log(`Item #${listItemId} focused`);
}

function pseudoFocusListItem(listItemId) {
  pseudoBlurListItems();

  const item = document.getElementsByClassName('list__item')[listItemId];
  item.classList.add('list__item_focused');
  console.log(`Item #${listItemId} pseudo-focused`);
}

function pseudoBlurListItems() {
  [...document.getElementsByClassName('list__item_focused')].forEach(i => i.classList.remove('list__item_focused'));
  console.log('Pseudo-focused items blurred');
}

function resetContentState() {
  contentNode.scrollTop = 0;
  selectedListItemIndex = undefined;
  updateCache({ selectedListItemIndex, contentScrollTop: 0 });

  console.log('Content state reset');
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

function showDeepSearchButton() {
  contentNode.classList.add('content_deep-search-available');
}

function hideDeepSearchButton() {
  contentNode.classList.remove('content_deep-search-available');
}



/* CACHE */

let cache = {
  inputValue: '',
  searchResult: [],
  notLoadedPagesNumber: 0,
  didDeepSearch: false,
  selectedListItemIndex: undefined,
  contentScrollTop: 0,
};

function updateCache(obj) {
  cache = {
    ...cache,
    ...obj,
  };

  sendMessage({ type: 'SAVE_CACHE', data: cache });
}

function loadCache(loadedCache) {
  if (!loadedCache) return;

  cache = loadedCache;

  inputNode.value = cache.inputValue;
  inputNode.setSelectionRange(0, cache.inputValue.length);

  didDeepSearch = cache.didDeepSearch;

  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });

  selectedListItemIndex = cache.selectedListItemIndex;

  if (typeof selectedListItemIndex !== 'undefined') {
    pseudoFocusListItem(selectedListItemIndex);
  }

  contentNode.scrollTop = cache.contentScrollTop;
}



/* HELPERS */

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
    console.log(`Popup sent ${message.type}`);
  });
}

function debounce(fn, ms) {
  let timeoutId = null;
  return (...rest) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, ms, ...rest);
  };
}
