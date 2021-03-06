const requestNode = document.getElementById('request');
const resultsNode = document.getElementById('results');

const debouncedSendSearchRequest = debounce(sendSearchRequest, 400);

requestNode.addEventListener('input', e => {
  console.log('input changed', e.target.value);

  debouncedSendSearchRequest(e.target.value);
});

chrome.runtime.onMessageExternal.addListener(message => {
  console.log('popup got ext message', message);

  if (message.type !== 'SHOW_RESULT') return;

  showResult(message.data);
});

function sendSearchRequest(searchString) {
  if (!searchString) {
    showResult([]);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const search = searchString.toLocaleLowerCase();
    chrome.tabs.sendMessage(tabs[0].id, { type: 'SEARCH', data: search });
    console.log('popup sent search request', search);
    showLoader();
  });
}

function showResult(result) {
  resultsNode.innerHTML = buildResultsMarkup(result);

  [...document.querySelectorAll('.list__item')].forEach(item => {
    item.addEventListener('click', e => {
      focus(e.target.dataset.id);
    });
  })

  hideLoader();
}

function focus(id) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'FOCUS', data: id });
    console.log('popup sent focus request', id);
  });
}

function buildResultsMarkup(items = []) {
  if (!items.length) return '';

  return items.map(i => {
    return `<li><button class="list__item" type="button" data-id="${i.id}">${i.name}</button></li>`
  }).join('');
}

function debounce(fn, ms) {
  let timeoutId = null;
  return (...rest) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, ms, ...rest);
  };
}

let loaderTimeout = null;
function showLoader() {
  clearTimeout(loaderTimeout);
  loaderTimeout = setTimeout(() => resultsNode.classList.add('list_loading'), 50);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  resultsNode.classList.remove('list_loading');
}
