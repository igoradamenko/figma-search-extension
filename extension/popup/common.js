function debounce(fn, ms) {
  let timeoutId = null;
  return (...rest) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, ms, ...rest);
  };
}

function $(selector, node = document) {
  return node.querySelector(selector);
}

function $$(selector, node = document) {
  return [...node.querySelectorAll(selector)];
}
