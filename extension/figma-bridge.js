(() => {
  const MAX_PAGE_LOAD_WAITING_MS = 2000;

  const scriptNode = document.getElementById('figma-search-extension-request');

  const type = scriptNode.dataset.type;
  const data = JSON.parse(scriptNode.dataset.data);

  switch (type) {
    case 'SEARCH_STARTED':
      processSearch(data);
      return;
    case 'ITEM_FOCUSED':
      processFocus(data);
      return;
    case 'DEEP_SEARCH_STARTED':
      processPagesLoad();
      return;
    case 'CACHE_SENT':
      processCacheUpdate(data);
      return;
  }

  function processSearch({ searchString }) {
    sendMessage({
      type: 'SEARCH_COMPLETED',
      data: {
        searchResult: search(searchString),
        notLoadedPagesNumber: getNotLoadedPagesNumber(),
        currentPageId: figma.currentPage.id,
      }
    });
  }

  function processFocus({ itemId }) {
    const item = figma.root.findOne(item => item.id === itemId);

    if (!item) {
      log('Could not find item with ID', itemId);
      return;
    }

    let page = item;

    while (page.type !== 'PAGE') {
      page = page.parent;
    }

    figma.currentPage = page;
    figma.viewport.scrollAndZoomIntoView([item]);

    if (item.type !== 'PAGE') {
      figma.currentPage.selection = [item];
    }
  }

  function processPagesLoad() {
    const currentPage = figma.currentPage;
    const currentSelection = figma.currentPage.selection;

    const pagesToLoad = figma.root.children.filter(x => x.children.length === 0);
    let loadedPagesNumber = 0;

    log(pagesToLoad.length, 'pages to load');

    figma.on('currentpagechange', pageLoadHandler);

    if (pagesToLoad[0] === currentPage) {
      // it means that current page is the first one to search,
      // but it's already loaded and empty; so we skip it,
      // because otherwise going to it won't trigger 'currentpagechange' event
      loadedPagesNumber += 1;
    }

    loadNextPage();

    function pageLoadHandler() {
      loadedPagesNumber += 1;
      log(loadedPagesNumber, 'pages loaded');

      sendMessage({ type: 'PAGES_LOADED', data: { loaded: loadedPagesNumber , total: pagesToLoad.length } });

      if (loadedPagesNumber === pagesToLoad.length) {
        log('All pages loaded');
        figma.currentPage = currentPage;
        figma.currentPage.selection = currentSelection;
        return;
      }

      if (loadedPagesNumber === pagesToLoad.length + 1) {
        log('Current page is the original one');
        figma.off('currentpagechange', pageLoadHandler);
        sendMessage({ type: 'DEEP_SEARCH_COMPLETED' });
        return;
      }

      waitAndLoadNextPage();
    }

    function loadNextPage() {
      log('Loading next page');
      figma.currentPage = pagesToLoad[loadedPagesNumber];
    }

    function waitAndLoadNextPage(alreadyWaitedMS = 0) {
      if (alreadyWaitedMS === MAX_PAGE_LOAD_WAITING_MS) {
        log('Waited for max allowed time, loading next page');
        loadNextPage();
        return;
      }

      const currentPageItemsNumber = figma.currentPage.findAll().length;
      if (currentPageItemsNumber) {
        log(`Current page has ${currentPageItemsNumber} items, loading next page`);
        loadNextPage();
        return;
      }

      setTimeout(waitAndLoadNextPage.bind(null, alreadyWaitedMS + 100), 100);
    }
  }

  function processCacheUpdate({ searchString }) {
    sendMessage({
      type: 'CACHE_QUICK_UPDATE_COMPLETED',
      data: {
        notLoadedPagesNumber: getNotLoadedPagesNumber(),
        currentPageId: figma.currentPage.id,
      }
    });

    if (searchString) {
      sendMessage({
        type: 'CACHE_SLOW_UPDATE_COMPLETED',
        data: {
          searchResult: search(searchString),
        },
      });
    }
  }

  function search(searchString) {
    return figma.root
      .findAll(item => item.name.toLocaleLowerCase().includes(searchString) && item.type !== 'DOCUMENT')
      .map(item => {
        const { id, name, type } = item;
        const { pageTitle, frameTitle } = findRootParentTitles(item);

        let page = item;

        while (page.type !== 'PAGE') {
          page = page.parent;
        }

        return {
          id,
          name,
          loweredName: name.toLocaleLowerCase(),
          type: type.toLocaleLowerCase().replace(/_/g, '-'),
          pageTitle,
          frameTitle,
          pageId: page.id,
        }
      });
  }

  function findRootParentTitles(node) {
    let pageNode = node;
    let frameNode = node;

    while (pageNode.type !== 'PAGE') {
      frameNode = pageNode;
      pageNode = pageNode.parent;
    }

    const result = {};

    if (pageNode === node) return result;

    result.pageTitle = pageNode.name;

    if (frameNode.type === 'FRAME' && frameNode !== node) {
      result.frameTitle = frameNode.name;
    }

    return result;
  }

  function getNotLoadedPagesNumber() {
    return figma.root.children.filter(x => x.children.length === 0).length;
  }

  function sendMessage(message) {
    const event = new CustomEvent('figma-search-extension-event', {
      detail: message
    });
    scriptNode.dispatchEvent(event);
    log(`Sent message ${message.type} to bg`);
  }

  function log(...rest) {
    console.log('[FIGMA SEARCH: BRIDGE]', ...rest);
  }
})();
