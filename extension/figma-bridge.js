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
    const result = figma.root
      .findAll(item => item.name.toLocaleLowerCase().includes(substr))
      .map(({ id, name, type }) => ({ id, name, type: type.toLocaleLowerCase().replace(/_/g, '-') }));

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