const rootNode = document.getElementById('root');
const inputNode = document.getElementById('input');
const contentNode = document.getElementById('content');
const resultsNode = document.getElementById('results');
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
  resultsNode.addEventListener('click', onResultsClick);
  chrome.runtime.onMessage.addListener(onMessageGet);

  sendMessage({ type: 'POPUP_OPEN' });
}



/* COMMUNICATION */

function onMessageGet(message) {
  console.log(`Popup got ${message.type}`);

  switch (message.type) {
    case 'SEARCH_COMPLETED':
      updateCache({
        searchResult: message.data.searchResult,
        notLoadedPagesNumber: message.data.notLoadedPagesNumber,
      });
      showResult(message.data);
      resetContentState();
      return;

    case 'DEEP_SEARCH_COMPLETED':
      didDeepSearch = true;
      updateCache({ didDeepSearch });
      sendSearchRequest(inputNode.value);
      return;

    case 'CACHE_EXISTS':
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
  sendMessage({ type: 'DEEP_SEARCH_STARTED' });
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

function onResultsClick(e) {
  console.log('Results clicked');

  const item = e.target.closest('.list__item');
  if (!item) {
    console.log('Clicked item not found')
    return;
  }

  console.log('Clicked item found');

  pseudoBlurListItems();
  deselectListItems();
  scrollToItem(item);
  selectListItem(item);

  selectedListItemIndex = [...document.querySelectorAll('.list__item')].findIndex(i => i === item);
  updateCache({ selectedListItemIndex });

  sendMessage({
    type: 'ITEM_FOCUSED',
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
    type: 'SEARCH_STARTED',
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
    resultsNode.innerHTML = '';
    showEmptyNotice();
    hideLoader();
    return;
  }

  resultsNode.innerHTML = contentMarkup;

  listItems = [...document.querySelectorAll('.list__item')];

  hideEmptyNotice();
  hideLoader();
}

const groupsOrder = [
  'Page',
  'Frame',
  'Component',
  'Group',
  'Instance',
  'Slice',
  'Vector',
  'Ellipse',
  'Polygon',
  'Star',
  'Line',
  'Arrow',
  'Text',
  'Rectangle',
  'Boolean',
  'Other',
];

function buildResultsMarkup(items = []) {
  if (!items.length) return '';

  items.sort((a, b) => {
    const aGroup = typeToGroup(a.type);
    const bGroup = typeToGroup(b.type);

    const aGroupOrder = groupsOrder.indexOf(aGroup);
    const bGroupOrder = groupsOrder.indexOf(bGroup);

    if (aGroupOrder !== bGroupOrder) {
      return aGroupOrder - bGroupOrder;
    }

    const aIndex = a.loweredName.indexOf(cache.inputValue);
    const bIndex = b.loweredName.indexOf(cache.inputValue);

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.name.localeCompare(b.name);
  })

  const itemsByGroup = groupsOrder.map(groupName => ({ group: groupName, items: [] }));

  items.forEach(item => {
    const itemGroup = typeToGroup(item.type);

    const groupToPut = itemsByGroup.find(obj => obj.group === itemGroup);
    groupToPut.items.push(item);
  });

  return itemsByGroup
    .filter(x => x.items.length)
    .map(obj => {
      const headline = `<div class="list__headline">${obj.group}</div>`;
      const listItems = obj.items.map(i => {
        return `<li><button class="list__item list__item_type_${i.type}" type="button" data-id="${i.id}">${i.name}</button></li>`
      }).join('');

      return `<div class="list">${headline}<ul class="list__items">${listItems}</ul></div>`;
    })
    .join('');
}

function typeToGroup(type) {
  type = type.split('-')[0];
  const group = type[0].toUpperCase() + type.substr(1);

  if (!groupsOrder.includes(group)) return 'Unknown';
  return group;
}



/* MARKUP STATES */

function focusListItem(listItemId) {
  const item = document.getElementsByClassName('list__item')[listItemId];
  scrollToItem(item);

  item.focus();
  console.log(`Item #${listItemId} focused`);
}

const contentTop = contentNode.getBoundingClientRect().top;
const contentHeight = contentNode.offsetHeight;
const headlineHeight = 28; // TODO: calc?

function scrollToItem(item) {
  const itemBounds = item.getBoundingClientRect();

  const topBordersDiff = itemBounds.top - (contentTop + headlineHeight);
  const bottomBordersDiff = (itemBounds.top + itemBounds.height) - (contentTop + contentHeight);
  const isItemTopBorderOutside = topBordersDiff < 0;
  const isItemBottomBorderOutside = bottomBordersDiff > 0;

  if (isItemTopBorderOutside) {
    contentNode.scrollBy(0, topBordersDiff);
    console.log('Scrolled content node');
    return;
  }

  if (isItemBottomBorderOutside) {
    contentNode.scrollBy(0, bottomBordersDiff);
    console.log('Scrolled content node');
    return;
  }
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

function selectListItem(item) {
  item.classList.add('list__item_selected');
  console.log('Item selected');
}

function deselectListItems() {
  [...document.getElementsByClassName('list__item_selected')].forEach(i => i.classList.remove('list__item_selected'));
  console.log('Items deselected');
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
  loaderTimeout = setTimeout(() => rootNode.classList.add('root_loading'), 50);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  rootNode.classList.remove('root_loading');
}

function showEmptyNotice() {
  contentNode.classList.add('content_empty');
}

function hideEmptyNotice() {
  contentNode.classList.remove('content_empty');
}

function showDeepSearchButton() {
  deepSearchButtonNode.style.display = 'block';
}

function hideDeepSearchButton() {
  deepSearchButtonNode.style.display = 'none';
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

  sendMessage({ type: 'CACHE_UPDATED', data: cache });
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
