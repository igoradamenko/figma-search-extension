const rootNode = $('#root');
const inputNode = $('#input');
const contentNode = $('#content');
const resultsNode = $('#results');
const deepSearchButtonNode = $('#deep-search');
const deepSearchProgressNode = $('#deep-search-progress');
const selectNode = $('#select');
const selectButtonNode = $('#select-button');
const selectButtonTextNode = $('#select-button-text');
const selectBodyNode = $('#select-body');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let listItems = [];
let selectedFilters = [];
let selectedListItemIndex;
let didDeepSearch = false;

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

run();

function run() {
  inputNode.addEventListener('input', onInputChange);
  contentNode.addEventListener('scroll', onContentScroll);
  deepSearchButtonNode.addEventListener('click', onDeepSearchButtonClick);
  rootNode.addEventListener('keydown', onRootKeyDown);
  resultsNode.addEventListener('click', onResultsClick);
  selectButtonNode.addEventListener('click', onSelectButtonClick);
  chrome.runtime.onMessage.addListener(onMessageGet);

  setSelectItemClickHandler();

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

    case 'PAGES_LOADED':
      updateDeepSearchLoadingState(message.data);
      return;

    case 'DEEP_SEARCH_COMPLETED':
      didDeepSearch = true;
      updateCache({ didDeepSearch });
      sendSearchRequest(inputNode.value, { deepSearch: true });
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

  inputNode.setAttribute('disabled', 'disabled');
  selectButtonNode.setAttribute('disabled', 'disabled');

  hideEmptyNotice();
  hideDeepSearchButton();

  setDeepSearchProgress(0);
  showDeepSearchingNotice();

  sendMessage({ type: 'DEEP_SEARCH_STARTED' });
}

function onRootKeyDown(e) {
  console.log('Some key pressed');

  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape' || listItems.length === 0) {
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

    case 'Escape':
      if (!isSelectBodyShown()) return;
      e.preventDefault();
      selectButtonNode.removeAttribute('disabled');
      hideSelectBody();
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

  selectedListItemIndex = $$('.list__item').findIndex(i => i === item);
  updateCache({ selectedListItemIndex });

  sendMessage({
    type: 'ITEM_FOCUSED',
    data: {
      itemId: item.dataset.id,
    },
  });
}

function onSelectButtonClick(e) {
  selectButtonNode.setAttribute('disabled', 'disabled');

  showSelectBody();

  setSelectOutsideClickHandler();

  // stop to prevent handling by outside click handler
  e.stopPropagation();

  updateSelectItemsState();
}

function setSelectItemClickHandler() {
  selectBodyNode.addEventListener('click', handler);

  function handler(e) {
    const item = e.target.closest('.select__item');

    if (!item) return;

    if ('groupToggle' in item.dataset) {
      selectBodyNode.querySelector('.select__group').style.display = 'block';
      item.remove();

      // to prevent click outside the select body
      e.stopPropagation();

      return;
    }

    const filter = item.textContent.trim();

    if (filter === 'Everywhere') {
      selectedFilters = [];
      updateSelectItemsState();
      applySelectedFilters();
      return;
    }

    if (selectedFilters.includes(filter)) {
      selectedFilters = selectedFilters.filter(f => f !== filter);
    } else {
      selectedFilters = selectedFilters.concat(filter);
    }

    // last element of groupsOrder is Other which does not exist as filter
    if (selectedFilters.length === groupsOrder.length - 1) {
      selectedFilters = [];
    }

    updateSelectItemsState();
    applySelectedFilters();
  }
}

function updateSelectItemsState() {
  const items = [...selectBodyNode.querySelectorAll('.select__item')];

  items.forEach(x => x.classList.remove('select__item_selected'));

  if (!selectedFilters.length) {
    items[0].classList.add('select__item_selected');
    return;
  }

  selectedFilters.forEach(filter => {
    items.find(item => item.textContent.trim() === filter).classList.add('select__item_selected');
  });
}

function applySelectedFilters() {
  updateCache({ selectedFilters });

  updateSelectorButtonText();

  filterResults();
}

function filterResults() {
  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });
}

function updateSelectorButtonText() {
  if (!selectedFilters.length) {
    selectButtonTextNode.innerHTML = 'Everywhere';
    return;
  }

  let filters = [...selectedFilters];

  filters.sort((a, b) => groupsOrder.indexOf(a) - groupsOrder.indexOf(b));

  // assume that 5 is the max number of filters we can show w/o problem
  if (filters.length > 5) {
    filters = filters.map(f => shortFilter(f));
  }

  selectButtonTextNode.innerHTML = filters.join(', ');

  function shortFilter(filter) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstLetter = filter[0];

    filter = [...filter].slice(1).filter(l => !vowels.includes(l.toLowerCase())).join('');

    return firstLetter + filter[0];
  }
}


function setSelectOutsideClickHandler() {
  rootNode.addEventListener('click', handler);

  function handler(e) {
    if (e.target.closest('.select__body')) return;

    selectButtonNode.removeAttribute('disabled');
    hideSelectBody();

    rootNode.removeEventListener('click', handler);
  }
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

function sendSearchRequest(searchString, options = {}) {
  if (!searchString) {
    showResult(null);
    updateCache({ searchResult: [] });
    resetContentState();
    return;
  }

  searchString = searchString.toLocaleLowerCase();
  sendMessage({
    type: 'SEARCH_STARTED',
    data: { searchString },
  });

  if (!options.deepSearch) {
    showLoader();
  }
}



/* MARKUP */

function showResult(data) {
  inputNode.removeAttribute('disabled');
  selectButtonNode.removeAttribute('disabled');

  if (isDeepSearchingNoticeShown) {
    // fill up the progress and hide it
    setDeepSearchProgress(1);
    setTimeout(() => hideDeepSearchingNotice());
  }

  hideLoader();

  if (data === null) {
    resultsNode.innerHTML = '';
    hideEmptyNotice();
    hideDeepSearchButton();
    return;
  }

  const contentMarkup = buildResultsMarkup(data.searchResult);

  if (data.notLoadedPagesNumber && !didDeepSearch) {
    showDeepSearchButton();
  } else {
    hideDeepSearchButton();
  }

  if (!contentMarkup) {
    resultsNode.innerHTML = '';
    showEmptyNotice();
    return;
  }

  resultsNode.innerHTML = contentMarkup;

  listItems = $$('.list__item');

  hideEmptyNotice();
}

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

  if (!selectedFilters.length) {
    return itemsByGroup
      .filter(x => x.items.length)
      .map(renderGroup)
      .join('');
  }

  return itemsByGroup
    .filter(x => selectedFilters.includes(x.group))
    .map(renderGroup)
    .join('');

  function renderGroup(obj) {
    const headline = `<div class="list__headline">${obj.group}</div>`;
    let list;

    if (obj.items.length) {
      const listItems = obj.items.map(i => {
        return `<li><button class="list__item list__item_type_${i.type}" type="button" data-id="${i.id}">${i.name}</button></li>`
      }).join('');

      list = `<ul class="list__items">${listItems}</ul>`;
    } else {
      list = '<div class="list__empty-notice">Nothing found</div>';
    }

    return `<div class="list">${headline}${list}</div>`;
  }
}

function typeToGroup(type) {
  type = type.split('-')[0];
  const group = type[0].toUpperCase() + type.substr(1);

  if (!groupsOrder.includes(group)) return 'Unknown';
  return group;
}



/* MARKUP STATES */

function focusListItem(listItemId) {
  const item = $$('.list__item')[listItemId];
  scrollToItem(item);

  item.focus();
  console.log(`Item #${listItemId} focused`);
}

const contentTop = contentNode.getBoundingClientRect().top;
const contentHeight = contentNode.offsetHeight;
const headlineHeight = 28; // *shrug*

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

function updateDeepSearchLoadingState({ total, loaded }) {
  console.log('Deep search loading state are getting updated; total:', total, 'loaded:', loaded);

  if (loaded > total) loaded = total;

  // we add 1 fake page to reuse deep search progress when all the pages
  // are loaded, but we're still waiting for search request
  total += 1;

  setDeepSearchProgress(loaded / total);
}

function pseudoFocusListItem(listItemId) {
  pseudoBlurListItems();

  const item = $$('.list__item')[listItemId];
  item.classList.add('list__item_focused');
  console.log(`Item #${listItemId} pseudo-focused`);
}

function pseudoBlurListItems() {
  $$('.list__item_focused').forEach(i => i.classList.remove('list__item_focused'));
  console.log('Pseudo-focused items blurred');
}

function selectListItem(item) {
  item.classList.add('list__item_selected');
  console.log('Item selected');
}

function deselectListItems() {
  $$('.list__item_selected').forEach(i => i.classList.remove('list__item_selected'));
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
  loaderTimeout = setTimeout(() => {
    rootNode.classList.add('root_loading');
    contentNode.classList.add('content_loading');
  }, 50);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  rootNode.classList.remove('root_loading');
  contentNode.classList.remove('content_loading');
}

function showDeepSearchingNotice() {
  rootNode.classList.add('root_loading');
  contentNode.classList.add('content_deep-searching');
}

function hideDeepSearchingNotice() {
  rootNode.classList.remove('root_loading');
  contentNode.classList.remove('content_deep-searching');
}

function isDeepSearchingNoticeShown() {
  return contentNode.classList.contains('content_deep-searching');
}

function setDeepSearchProgress(fraction) {
  deepSearchProgressNode.style.setProperty('--progress-fraction', fraction.toString());
  console.log('Set deep search progress as', fraction);
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

function showSelectBody() {
  selectNode.classList.add('select_open');
}

function hideSelectBody() {
  selectNode.classList.remove('select_open');
}

function isSelectBodyShown() {
  return selectNode.classList.contains('select_open');
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

  // TODO: versions before 1.1.0 may now have selectedFilters in a cache
  //  so we fallback it; it should be removed when all the users migrate to 1.1.0+
  selectedFilters = cache.selectedFilters || [];
  applySelectedFilters();

  inputNode.value = cache.inputValue;

  if (!cache.inputValue) return;

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
