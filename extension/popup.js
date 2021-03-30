const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

let select, input, list, emptyNotice, globalPreloader, deepSearchPreloader, deepSearchButton;

let groupsOrder;

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
    // TODO: onSearchButtonClick
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
      });
      showResult(message.data);
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
  }
}



/* EVENT HANDLERS */

function onSelectUpdate(filters) {
  updateCache({ selectedFilters: filters });
  showResult({
    searchResult: cache.searchResult,
    notLoadedPagesNumber: cache.notLoadedPagesNumber,
  });
}

function onInputUpdate(value) {
  console.log('Input changed', value);

  updateCache({ inputValue: value });

  debouncedSendSearchRequest(value);
}

function onListScroll(listScrollTop) {
  updateCache({ listScrollTop });
}

function onDeepSearchButtonClick() {
  console.log('Deep Search Button clicked');

  input.Disable();
  select.Disable();

  emptyNotice.Hide();
  deepSearchButton.Hide();

  deepSearchPreloader.Show();

  sendMessage({ type: 'DEEP_SEARCH_STARTED' });
}

function onRootKeyDown(e) {
  console.log(e.key, 'key pressed');

  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape' || list.IsEmpty()) {
    console.log('Keypress left unhandled');
    list.PseudoBlurItems();
    input.Focus();
    return;
  }

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


/* SEARCH */

function sendSearchRequest(searchString, { deepSearch = false }  = {}) {
  if (!searchString) {
    showResult(null);
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
  updateCache({ selectedListItemIndex: undefined, listScrollTop: 0 });

  input.Enable();
  select.Enable();

  if (deepSearchPreloader.IsShown()) {
    // fill up the progress and hide it
    deepSearchPreloader.SetProgress(1);
    setTimeout(() => deepSearchPreloader.Hide());
  }

  globalPreloader.Hide();

  if (data === null) {
    // TODO: should we reset selectedListItem?
    list.Clear();
    emptyNotice.Hide();
    deepSearchButton.Hide();
    return;
  }

  if (data.notLoadedPagesNumber && !cache.didDeepSearch) {
    deepSearchButton.Show();
  } else {
    deepSearchButton.Hide();
  }

  if (!data.searchResult.length) {
    // TODO: should we reset selectedListItem?
    list.Clear();

    // TODO: sure about global here?
    emptyNotice.Show(EmptyNotice.TYPE.GLOBAL);
    return;
  }

  const itemsByGroups = buildResultItems(data.searchResult);
  list.RenderItems(itemsByGroups, cache.selectedFilters);

  emptyNotice.Hide();
}

function buildResultItems(items) {
  // TODO: mutation?
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

  return itemsByGroup;
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

  // TODO: versions before 1.1.0 may not have selectedFilters in cache
  //  so we fallback it; it should be removed when all the users migrate to 1.1.0+
  const selectedFilters = cache.selectedFilters || [];
  select.SetSelectedValues(selectedFilters);

  input.SetValue(cache.inputValue);

  if (!cache.inputValue) return;

  input.SelectAll();

  showResult({
    searchResult: cache.searchResult,
    notLoadedPagesNumber: cache.notLoadedPagesNumber,
  });

  if (typeof cache.selectedListItemIndex !== 'undefined') {
    list.PseudoFocusItemByIndex(cache.selectedListItemIndex);
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
