(() => {
  window.initSelect = initSelect;

  const rootNode = $('#root');
  const selectNode = $('#select');
  const selectButtonNode = $('#select-button');
  const selectButtonTextNode = $('#select-button-text');
  const selectBodyNode = $('#select-body');

  const STATE = {
    set filters(value) {
      this._filters = value;

      updateSelectItemsState();
      updateSelectorButtonText();

      this.onUpdateCallback(this._filters);
    },

    get filters() {
      return this._filters || [];
    },

    set onUpdate(value) {
      this.onUpdateCallback = value;
    },

    forceSetFilters(value) {
      this._filters = value;

      updateSelectItemsState();
      updateSelectorButtonText();
    }
  }

  function initSelect(onSelectUpdate) {
    selectButtonNode.addEventListener('click', onSelectButtonClick);
    selectBodyNode.addEventListener('click', onBodyClick);

    STATE.onUpdate = onSelectUpdate;

    return {
      hideSelectBody,
      isSelectBodyShown,
      disableSelectButton,
      enableSelectButton,
      setFilters,
    };
  }

  function setFilters(filters) {
    STATE.forceSetFilters(filters);
  }

  function onSelectButtonClick(e) {
    disableSelectButton();

    showSelectBody();

    setSelectOutsideClickHandler();

    // stop to prevent handling by outside click handler
    e.stopPropagation();

    updateSelectItemsState();
  }

  function onBodyClick(e) {
    const item = e.target.closest('.select__item');

    if (!item) return;

    if ('groupToggle' in item.dataset) {
      selectBodyNode.querySelector('.select__group').style.display = 'block';
      item.remove();

      // to prevent click outside the select body
      e.stopPropagation();

      return;
    }

    const filter = item.textContent.trim();

    if (filter === 'Everywhere') {
      STATE.filters = [];
      return;
    }

    if (STATE.filters.includes(filter)) {
      STATE.filters = STATE.filters.filter(f => f !== filter);
    } else {
      STATE.filters = STATE.filters.concat(filter);
    }

    // last element of groupsOrder is Other which does not exist as filter
    if (STATE.filters.length === groupsOrder.length - 1) {
      STATE.filters = [];
    }
  }

  function updateSelectItemsState() {
    const items = $$('.select__item', selectBodyNode);

    items.forEach(x => x.classList.remove('select__item_selected'));

    if (!STATE.filters.length) {
      items[0].classList.add('select__item_selected');
      return;
    }

    STATE.filters.forEach(filter => {
      items.find(item => item.textContent.trim() === filter).classList.add('select__item_selected');
    });
  }

  function setSelectOutsideClickHandler() {
    rootNode.addEventListener('click', handler);

    function handler(e) {
      if (e.target.closest('.select__body')) return;

      enableSelectButton();
      hideSelectBody();

      rootNode.removeEventListener('click', handler);
    }
  }

  function updateSelectorButtonText() {
    if (!STATE.filters.length) {
      selectButtonTextNode.innerHTML = 'Everywhere';
      return;
    }

    let filters = [...STATE.filters];

    filters.sort((a, b) => groupsOrder.indexOf(a) - groupsOrder.indexOf(b));

    // assume that 5 is the max number of filters we can show w/o problem
    if (filters.length > 5) {
      filters = filters.map(f => shortFilter(f));
    }

    selectButtonTextNode.innerHTML = filters.join(', ');

    function shortFilter(filter) {
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      const firstLetter = filter[0];

      filter = [...filter].slice(1).filter(l => !vowels.includes(l.toLowerCase())).join('');

      return firstLetter + filter[0];
    }
  }

  function showSelectBody() {
    selectNode.classList.add('select_open');
  }

  function hideSelectBody() {
    selectNode.classList.remove('select_open');
  }

  function isSelectBodyShown() {
    return selectNode.classList.contains('select_open');
  }

  function disableSelectButton() {
    selectButtonNode.setAttribute('disabled', 'disabled');
  }

  function enableSelectButton() {
    selectButtonNode.removeAttribute('disabled');
  }
})();
