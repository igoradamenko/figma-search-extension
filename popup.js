const requestNode = document.getElementById('request');
const resultsNode = document.getElementById('results');

requestNode.addEventListener('input', e => {
  console.log('input changed', e.target.value);

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const search = e.target.value.toLocaleLowerCase();
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SEARCH', data: search });
    console.log('popup sent search request', search);
  });
});

chrome.runtime.onMessageExternal.addListener(message => {
  console.log('popup got ext message', message);

  if (message.type !== 'SHOW_RESULT') return;

  resultsNode.innerHTML = buildResultsMarkup(message.data);

  [...document.querySelectorAll('#results button')].forEach(item => {
    item.addEventListener('click', e => {
      focus(e.target.dataset.id);
    });
  })
});

function focus(id) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'FOCUS', data: id });
    console.log('popup sent focus request', id);
  });
}

function buildResultsMarkup(items = []) {
  if (!items.length) return '';

  return items.map(i => {
    return `<li><button type="button" data-id="${i.id}">${i.name}</button></li>`
  }).join('');
}
