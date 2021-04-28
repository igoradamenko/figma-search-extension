// we need it for tests
// but it's safe for users because window.parent in extension is its window itself
if (window.parent.__PATCH_WINDOW_FOR_TESTS__) {
  window.parent.__PATCH_WINDOW_FOR_TESTS__(window);
}

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let select, input, list, emptyNotice, globalPreloader, deepSearchPreloader, deepSearchButton, tabs, toast;

let groupsOrder;


let preloadedStateChanged = false;

// special group in case of adding new types of items by Figma
// which won't be handled by the extension
const UNKNOWN_GROUP = 'Unknown';

run();

function run() {
  $('#root').addEventListener('keydown', onRootKeyDown);

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
    scrolledContainerNode: $('#content'),
    onItemFocus: onListItemFocus,
    onScroll: onListScroll,
  });

  emptyNotice = new EmptyNotice({
    node: $('#empty-notice'),
    overlayNode,
    onSearchButtonClick: onEmptyNoticeSearchButtonClick,
  });

  globalPreloader = new GlobalPreloader({
    node: $('#global-preloader'),
    overlayNode,
  });

  deepSearchPreloader = new DeepSearchPreloader({
    node: $('#deep-search-preloader'),
    overlayNode,
  });

  deepSearchButton = new DeepSearchButton({
    node: $('#deep-search-button'),
    onClick: onDeepSearchButtonClick,
  });

  tabs = new Tabs({
    node: $('#tabs'),
    onTabSwitch: onPagesFilterUpdate,
  });

  toast = new Toast({
    node: $('#toast'),
    onClick: onToastClick,
  });

  groupsOrder = [...select.GetValuesOrder(), UNKNOWN_GROUP];

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
        currentPageId: message.data.currentPageId,
      });
      showResult(message.data);
      resetContentState();
      return;

    case 'PAGES_LOADED':
      updateDeepSearchLoadingState(message.data);
      return;

    case 'DEEP_SEARCH_COMPLETED':
      updateCache({ didDeepSearch: true });
      sendSearchRequest(input.GetValue(), { deepSearch: true });
      return;

    case 'CACHE_EXISTS':
      loadCache(message.data);
      return;

    case 'CACHE_QUICK_UPDATE_COMPLETED':
      processQuickCacheUpdate(message.data);
      return;

    case 'CACHE_SLOW_UPDATE_COMPLETED':
      processSlowCacheUpdate(message.data);
      return;
  }
}



/* EVENT HANDLERS */

function onSelectUpdate(filters) {
  updateCache({ selectedFilters: filters });

  if (cache.inputValue.length === 0) return;

  rerenderResult();
  resetContentState();
}

function onInputUpdate(value) {
  console.log('Input changed', value);

  preloadedStateChanged = true;

  updateCache({ inputValue: value });

  debouncedSendSearchRequest(value);
}

function onListScroll(listScrollTop) {
  updateCache({ listScrollTop });
}

function onDeepSearchButtonClick() {
  console.log('Deep Search Button clicked');

  preloadedStateChanged = true;

  input.Disable();
  select.Disable();

  emptyNotice.Hide();
  deepSearchButton.Hide();

  deepSearchPreloader.Show();

  sendMessage({ type: 'DEEP_SEARCH_STARTED' });
}

function onRootKeyDown(e) {
  console.log(e.key, 'key pressed');

  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
    // do not move focus on input if select is open
    if (select.IsOpen()) return;

    console.log('Keypress left unhandled');
    list.PseudoBlurItems();
    input.Focus();
    return;
  }

  input.Blur();

  switch (e.key) {
    case 'Enter':
      // handled by this fn just to prevent handling on input (we blurred it)
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
  updateCache({ selectedListItemIndex: index });

  sendMessage({
    type: 'ITEM_FOCUSED',
    data: {
      itemId: id,
    },
  });
}

function handleArrowDown() {
  const selectedListItemIndex = list.FocusNextItem();
  updateCache({ selectedListItemIndex });
}

function handleArrowUp() {
  const selectedListItemIndex = list.FocusPreviousItem();
  updateCache({ selectedListItemIndex });
}

function onEmptyNoticeSearchButtonClick() {
  updateCache({ selectedFilters: [] });
  select.SetSelectedValues([]);
  showResult({
    searchResult: cache.searchResult,
    notLoadedPagesNumber: cache.notLoadedPagesNumber,
  });
  resetContentState();
}

function onPagesFilterUpdate(selectedFilter) {
  updateCache({ selectedPagesFilter: selectedFilter });

  if (cache.inputValue.length === 0) return;

  rerenderResult();
}

function onToastClick() {
  sendSearchRequest(cache.inputValue);
  toast.Hide();
}


/* SEARCH */

function sendSearchRequest(searchString, { deepSearch = false }  = {}) {
  if (!searchString) {
    showResult(null);
    resetContentState();
    updateCache({ searchResult: [] });
    return;
  }

  searchString = searchString.toLocaleLowerCase();
  sendMessage({
    type: 'SEARCH_STARTED',
    data: { searchString },
  });

  if (!deepSearch) {
    emptyNotice.Hide();
    globalPreloader.Show();
  }
}



/* MARKUP */

function showResult(data) {
  input.Enable();
  select.Enable();

  if (deepSearchPreloader.IsShown()) {
    // fill up the progress and hide it
    deepSearchPreloader.SetProgress(1);
    setTimeout(() => deepSearchPreloader.Hide());
  }

  globalPreloader.Hide();

  if (data === null) {
    list.Clear();
    emptyNotice.Hide();
    deepSearchButton.Hide();
    return;
  }

  if (data.notLoadedPagesNumber && !cache.didDeepSearch && cache.selectedPagesFilter === Tabs.TAB.ALL_PAGES) {
    deepSearchButton.Show();
  } else {
    deepSearchButton.Hide();
  }

  if (!data.searchResult.length) {
    list.Clear();
    emptyNotice.Show(EmptyNotice.TYPE.GLOBAL);
    return;
  }

  const itemsByGroups = buildResultItems(data.searchResult);

  if (itemsByGroups.every(x => x.items.length === 0)) {
    list.Clear();

    if (itemsByGroups.length === 1) {
      emptyNotice.Show(EmptyNotice.TYPE.CATEGORY);
    } else {
      emptyNotice.Show(EmptyNotice.TYPE.CATEGORIES);
    }

    return;
  }

  list.RenderItems(itemsByGroups, {
    view: cache.selectedPagesFilter === Tabs.TAB.ALL_PAGES ? List.VIEW_MODIFIERS.FULL : List.VIEW_MODIFIERS.FILTERED,
  });
  emptyNotice.Hide();
}

function rerenderResult() {
  showResult({
    searchResult: cache.searchResult,
    notLoadedPagesNumber: cache.notLoadedPagesNumber,
    currentPageId: cache.currentPageId,
  });
}

function buildResultItems(items) {
  if (cache.selectedPagesFilter === Tabs.TAB.CURRENT_PAGE) {
    items = items.filter(i => cache.currentPageId === i.pageId);
  }

  // mutation here, but we don't want to copy the huge array to prevent perf drop
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

  if (!cache.selectedFilters.length) {
    return itemsByGroup.filter(x => x.items.length)
  }

  return itemsByGroup.filter(x => cache.selectedFilters.includes(x.group))
}

function typeToGroup(type) {
  type = type.split('-')[0];
  const group = type[0].toUpperCase() + type.substr(1);

  if (!groupsOrder.includes(group)) return UNKNOWN_GROUP;
  return group;
}



/* MARKUP STATES */

function updateDeepSearchLoadingState({ total, loaded }) {
  console.log('Deep search loading state are getting updated; total:', total, 'loaded:', loaded);

  if (loaded > total) loaded = total;

  // we add 1 fake page to reuse deep search progress when all the pages
  // are loaded, but we're still waiting for search request
  total += 1;

  deepSearchPreloader.SetProgress(loaded / total);
}

function resetContentState() {
  updateCache({ selectedListItemIndex: undefined, listScrollTop: 0 });
}



/* CACHE */

let cache = {
  inputValue: '',
  searchResult: [],
  notLoadedPagesNumber: 0,
  didDeepSearch: false,
  selectedListItemIndex: undefined,
  listScrollTop: 0,
  selectedFilters: [],
  selectedPagesFilter: Tabs.TAB.ALL_PAGES,
  currentPageId: '',
};

function updateCache(obj) {
  cache = {
    ...cache,
    ...obj,
  };

  sendMessage({ type: 'CACHE_UPDATED', data: cache });
}

function loadCache(loadedCache) {
  if (!loadedCache) {
    tabs.Init();
    return;
  }

  cache = loadedCache;

  select.SetSelectedValues(cache.selectedFilters);

  // TODO: version before 1.3.0 may not have selectedPagesFilter in cache
  //  so we fallback it; it should be removed when all the users migrate to 1.3.0+
  cache.selectedPagesFilter = cache.selectedPagesFilter || 0;
  tabs.SwitchTab(cache.selectedPagesFilter)
  setTimeout(() => tabs.Init());

  input.SetValue(cache.inputValue);

  if (!cache.inputValue) return;

  input.SelectAll();

  rerenderResult();

  if (typeof cache.selectedListItemIndex !== 'undefined') {
    list.PseudoFocusItemByIndex(cache.selectedListItemIndex);
  }

  list.SetScrollTop(cache.listScrollTop);
}

function processQuickCacheUpdate(updatedCache) {
  // do not handle it when user changed preloaded state
  if (preloadedStateChanged) return;

  if (updatedCache.notLoadedPagesNumber !== cache.notLoadedPagesNumber) {
    // do not save new notLoadedPagesNumber to make sure that toast shows until
    // search results will be updated
    if (cache.inputValue) {
      toast.Show();
    }
  }

  if (updatedCache.currentPageId !== cache.currentPageId) {
    cache.currentPageId = updatedCache.currentPageId;

    if (cache.selectedPagesFilter === Tabs.TAB.CURRENT_PAGE) {
      rerenderResult();
    }
  }
}

function processSlowCacheUpdate(updatedCache) {
  // do not handle it when user changed preloaded state
  if (preloadedStateChanged) return;

  if (updatedCache.searchResult.length !== cache.searchResult.length) {
    toast.Show();
  }
}


/* HELPERS */

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, message);
    console.log(`Popup sent ${message.type}`);
  });
}
