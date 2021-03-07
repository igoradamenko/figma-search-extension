(() => {
  const scriptNode = document.getElementById('figma-search-extension-request');

  const extId = scriptNode.dataset.extId;
  const type = scriptNode.dataset.type;
  const data = scriptNode.dataset.data;

  switch (type) {
    case 'SEARCH':
      processSearch(data, extId);
      return;
    case 'FOCUS':
      processFocus(data);
      return;
  }

  function processSearch(substr, extId) {
    const REVERSED_TYPES_ORDER = [
      'component-set',
      'component',
      'frame',
      'page',
    ];

    const result = figma.root
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

        const aTypeOrder = REVERSED_TYPES_ORDER.indexOf(a.type);
        const bTypeOrder = REVERSED_TYPES_ORDER.indexOf(b.type);

        // type order is reversed to cover -1 case,
        // so we calc B - A, but it's still ASC, not DESC
        return bTypeOrder - aTypeOrder;
      });

    chrome.runtime.sendMessage(extId, { type: 'SHOW_RESULT', data: result });
  }

  function processFocus(nodeId) {
    const item = figma.root.findOne(item => item.id === nodeId);
    let page = item;

    while (page.type !== 'PAGE') {
      page = page.parent;
    }

    figma.currentPage = page;
    figma.viewport.scrollAndZoomIntoView([item]);
    figma.currentPage.selection = [item];
  }
})();
