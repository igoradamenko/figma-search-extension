const rootNode = $('#root');
const contentNode = $('#content');
const deepSearchButtonNode = $('#deep-search');
const deepSearchProgressNode = $('#deep-search-progress');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let listItems = [];
let selectedFilters = [];
let selectedListItemIndex;
let didDeepSearch = false;

let groupsOrder;

let select;
let input;
let list;
let emptyNotice;
let globalPreloader;

run();

function run() {
  deepSearchButtonNode.addEventListener('click', onDeepSearchButtonClick);
  rootNode.addEventListener('keydown', onRootKeyDown);
  chrome.runtime.onMessage.addListener(onMessageGet);

  const overlayNode = $('#overlay');

  input = new Input({
    node: $('#input'),
    onUpdate: onInputUpdate,
  })

  select = new Select({
    node: $('#select'),
    onUpdate: onSelectUpdate,
  });

  list = new List({
    node: $('#results'),
    scrolledContainerNode: contentNode,
    onItemFocus: onListItemFocus,
    onScroll: onListScroll,
  });

  emptyNotice = new EmptyNotice({
    node: $('#empty-notice'),
    overlayNode,
    // TODO: onSearchButtonClick
  });

  globalPreloader = new GlobalPreloader({
    node: $('#global-preloader'),
    overlayNode,
  });

  groupsOrder = [...select.GetValuesOrder(), 'Other'];

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
      sendSearchRequest(input.GetValue(), { deepSearch: true });
      return;

    case 'CACHE_EXISTS':
      loadCache(message.data);
      return;
  }
}



/* EVENT HANDLERS */

function onSelectUpdate(filters) {
  selectedFilters = filters;
  updateCache({ selectedFilters });
  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });
}

function onInputUpdate(value) {
  console.log('Input changed', value);

  updateCache({ inputValue: value });

  debouncedSendSearchRequest(value);
}

function onListScroll(listScrollTop) {
  updateCache({ listScrollTop });
}

function onDeepSearchButtonClick(e) {
  console.log('Deep search button clicked');

  input.Disable();
  select.Disable();

  emptyNotice.Hide();
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
    input.Focus();
    return;
  }

  console.log(`It is ${e.key} key`);
  input.Blur();

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
      if (!select.IsOpen()) return;
      e.preventDefault();
      select.Close();
      return;
  }
}

function onListItemFocus({ index, id }) {
  selectedListItemIndex = index; // TODO: move to List?
  updateCache({ selectedListItemIndex: index });

  sendMessage({
    type: 'ITEM_FOCUSED',
    data: {
      itemId: id,
    },
  });
}

function handleArrowDown() {
  selectedListItemIndex ??= -1;
  selectedListItemIndex = (selectedListItemIndex + 1) % listItems.length;
  updateCache({ selectedListItemIndex });

  list.FocusItemByIndex(selectedListItemIndex);
}

function handleArrowUp() {
  selectedListItemIndex ??= 0;
  selectedListItemIndex = (selectedListItemIndex - 1 + listItems.length) % listItems.length;
  updateCache({ selectedListItemIndex });

  list.FocusItemByIndex(selectedListItemIndex);
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
    globalPreloader.Show();
  }
}



/* MARKUP */

function showResult(data) {
  input.Enable();
  select.Enable();

  if (isDeepSearchingNoticeShown) {
    // fill up the progress and hide it
    setDeepSearchProgress(1);
    setTimeout(() => hideDeepSearchingNotice());
  }

  globalPreloader.Hide();

  if (data === null) {
    // TODO: should we reset selectedListItem?
    list.Clear();
    emptyNotice.Hide();
    hideDeepSearchButton();
    return;
  }

  if (data.notLoadedPagesNumber && !didDeepSearch) {
    showDeepSearchButton();
  } else {
    hideDeepSearchButton();
  }

  if (!data.searchResult.length) {
    // TODO: should we reset selectedListItem?
    list.Clear();

    // TODO: sure about global here?
    emptyNotice.Show(EmptyNotice.TYPE.GLOBAL);
    return;
  }

  list.SetMarkup(buildResultsMarkup(data.searchResult));

  // TODO: does it work with items hiding?
  listItems = $$('.list__item');

  emptyNotice.Hide();
}

function buildResultsMarkup(items) {
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
    const headline = selectedFilters.length === 1 ? '' : `<div class="list__headline">${obj.group}</div>`;
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

function resetContentState() {
  list.ResetState();

  selectedListItemIndex = undefined;
  updateCache({ selectedListItemIndex, listScrollTop: 0 });

  console.log('Content state reset');
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
  listScrollTop: 0,
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
  select.SetSelectedValues(selectedFilters);

  input.SetValue(cache.inputValue);

  if (!cache.inputValue) return;

  input.SelectAll();

  didDeepSearch = cache.didDeepSearch;

  showResult({ searchResult: cache.searchResult, notLoadedPagesNumber: cache.notLoadedPagesNumber });

  selectedListItemIndex = cache.selectedListItemIndex;

  if (typeof selectedListItemIndex !== 'undefined') {
    pseudoFocusListItem(selectedListItemIndex);
  }

  list.SetScrollTop(cache.listScrollTop);
}



/* HELPERS */

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
    console.log(`Popup sent ${message.type}`);
  });
}
