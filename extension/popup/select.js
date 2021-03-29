class Select {
  constructor({ groupsOrder, onSelectUpdate }) {
    this.rootNode = $('#root');
    this.selectNode = $('#select');
    this.selectButtonNode = $('#select-button');
    this.selectButtonTextNode = $('#select-button-text');
    this.selectBodyNode = $('#select-body');

    this.groupsOrder = groupsOrder;

    this.state = {
      filters: [],
      onUpdateCallbacks: [onSelectUpdate],
    }

    this.selectButtonNode.addEventListener('click', this.onSelectButtonClick.bind(this));
    this.selectBodyNode.addEventListener('click', this.onBodyClick.bind(this));
  }

  updateFilters(filters) {
    this.state.filters = filters;

    this.updateSelectItemsState();
    this.updateSelectorButtonText();

    this.state.onUpdateCallbacks.forEach(f => f(filters));
  }

  setFilters(filters) {
    this.state.filters = filters;

    this.updateSelectItemsState();
    this.updateSelectorButtonText();
  }

  onSelectButtonClick(e) {
    this.disableSelectButton();

    this.showSelectBody();

    this.setSelectOutsideClickHandler();

    // stop to prevent handling by outside click handler
    e.stopPropagation();

    this.updateSelectItemsState();
  }

  onBodyClick(e) {
    const item = e.target.closest('.select__item');

    if (!item) return;

    if ('groupToggle' in item.dataset) {
      $('.select__group', this.selectBodyNode).style.display = 'block';
      item.remove();

      // to prevent click outside the select body
      e.stopPropagation();

      return;
    }

    const filter = item.textContent.trim();

    if (filter === 'Everywhere') {
      this.updateFilters([]);
      return;
    }

    let newFilters = [...this.state.filters];
    if (newFilters.includes(filter)) {
      newFilters = newFilters.filter(f => f !== filter);
    } else {
      newFilters = newFilters.concat(filter);
    }

    // last element of groupsOrder is Other which does not exist as filter
    if (newFilters.length === this.groupsOrder.length - 1) {
      newFilters = [];
    }

    this.updateFilters(newFilters);
  }

  updateSelectItemsState() {
    const items = $$('.select__item', this.selectBodyNode);

    items.forEach(x => x.classList.remove('select__item_selected'));

    if (!this.state.filters.length) {
      items[0].classList.add('select__item_selected');
      return;
    }

    this.state.filters.forEach(filter => {
      items.find(item => item.textContent.trim() === filter).classList.add('select__item_selected');
    });
  }

  setSelectOutsideClickHandler() {
    const handler = (e) => {
      if (e.target.closest('.select__body')) return;

      this.enableSelectButton();
      this.hideSelectBody();

      this.rootNode.removeEventListener('click', handler);
    }

    this.rootNode.addEventListener('click', handler);
  }

  updateSelectorButtonText() {
    if (!this.state.filters.length) {
      this.selectButtonTextNode.innerHTML = 'Everywhere';
      return;
    }

    let filters = [...this.state.filters];

    filters.sort((a, b) => groupsOrder.indexOf(a) - groupsOrder.indexOf(b));

    // assume that 5 is the max number of filters we can show w/o problem
    if (filters.length > 5) {
      filters = filters.map(f => this.shortFilter(f));
    }

    this.selectButtonTextNode.innerHTML = filters.join(', ');
  }

  shortFilter(filter) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstLetter = filter[0];

    filter = [...filter].slice(1).filter(l => !vowels.includes(l.toLowerCase())).join('');

    return firstLetter + filter[0];
  }

  showSelectBody() {
    this.selectNode.classList.add('select_open');
  }

  hideSelectBody() {
    this.selectNode.classList.remove('select_open');
  }

  isSelectBodyShown() {
    return this.selectNode.classList.contains('select_open');
  }

  disableSelectButton() {
    this.selectButtonNode.setAttribute('disabled', 'disabled');
  }

  enableSelectButton() {
    this.selectButtonNode.removeAttribute('disabled');
  }
}
