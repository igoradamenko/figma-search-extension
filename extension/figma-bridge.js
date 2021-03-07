(() => {
  const scriptNode = document.getElementById('figma-search-extension-request');

  const type = scriptNode.dataset.type;
  const data = scriptNode.dataset.data;

  switch (type) {
    case 'SEARCH':
      processSearch(data);
      return;
    case 'FOCUS':
      processFocus(data);
      return;
    case 'LOAD_PAGES':
      processPagesLoad();
      return;
  }

  function processSearch(substr) {
    const REVERSED_TYPES_ORDER = [
      'component-set',
      'component',
      'frame',
      'page',
    ];

    const searchResult = figma.root
      .findAll(item => item.name.toLocaleLowerCase().includes(substr))
      .map(({ id, name, type }) => {
        return {
          id,
          name,
          loweredName: name.toLocaleLowerCase(),
          type: type.toLocaleLowerCase().replace(/_/g, '-'),
        }
      })
      .sort((a, b) => {
        const nameDiff = a.loweredName.indexOf(substr) - b.loweredName.indexOf(substr);

        if (nameDiff) return nameDiff;

        // TODO: maybe to show pages always on top?
        const aTypeOrder = REVERSED_TYPES_ORDER.indexOf(a.type);
        const bTypeOrder = REVERSED_TYPES_ORDER.indexOf(b.type);

        // type order is reversed to cover -1 case,
        // so we calc B - A, but it's still ASC, not DESC
        return bTypeOrder - aTypeOrder;
      });

    const notLoadedPagesNumber = figma.root.children.filter(x => x.children.length === 0).length;

    sendMessage({ type: 'SHOW_RESULT', data: { searchResult, notLoadedPagesNumber } });
  }

  function processFocus(nodeId) {
    const item = figma.root.findOne(item => item.id === nodeId);
    let page = item;

    while (page.type !== 'PAGE') {
      page = page.parent;
    }

    figma.currentPage = page;
    figma.viewport.scrollAndZoomIntoView([item]);
    figma.currentPage.selection = [item]; // TODO: cannot select a page node
  }

  function processPagesLoad() {
    const currentPage = figma.currentPage;
    const currentSelection = figma.currentPage.selection;

    const pagesToLoad = figma.root.children.filter(x => x.children.length === 0);
    let loadedPagesNumber = 0;

    figma.on('currentpagechange', pageLoadHandler);

    loadNextPage();

    function pageLoadHandler() {
      console.log('page changed', figma.root.findAll().length);

      // TODO: send process notifications?
      loadedPagesNumber += 1;

      // all pages are loaded
      if (loadedPagesNumber === pagesToLoad.length) {
        figma.currentPage = currentPage;
        figma.currentPage.selection = currentSelection;
        return;
      }

      // currentPage changed to the original one
      if (loadedPagesNumber === pagesToLoad.length + 1) {
        figma.off('currentpagechange', pageLoadHandler);
        sendMessage({ type: 'RETRY_SEARCH' });
        return;
      }

      waitAndLoadNextPage();
    }

    function loadNextPage() {
      figma.currentPage = pagesToLoad[loadedPagesNumber];
    }

    const MAX_WAITING_MS = 2000;
    function waitAndLoadNextPage(alreadyWaitedMS = 0) {
      if (alreadyWaitedMS === MAX_WAITING_MS) {
        loadNextPage();
        return;
      }

      if (figma.currentPage.findAll().length) {
        loadNextPage();
        return;
      }

      setTimeout(waitAndLoadNextPage.bind(null, alreadyWaitedMS + 100), 100);
    }
  }

  function sendMessage(message) {
    const event = new CustomEvent('figma-search-extension-event', {
      detail: message
    });
    scriptNode.dispatchEvent(event);
  }
})();
