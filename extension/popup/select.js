class Select {
  constructor({ node, rootNode, onUpdate }) {
    this.rootNode = rootNode;
    this.selectNode = node;
    this.buttonNode = $('.select__button', node);
    this.buttonTextNode = $('.select__button-text', node);
    this.bodyNode = $('.select__body', node);

    this.valuesOrder = $$('[data-item]', this.bodyNode).map(x => x.textContent.trim());
    this.onUpdate = onUpdate;

    this.selectedValues = [];

    this.buttonNode.addEventListener('click', this.onButtonClick.bind(this));
    this.bodyNode.addEventListener('click', this.onBodyClick.bind(this));
  }


  /* EVENT HANDLERS */

  onButtonClick(e) {
    this.Disable();

    this.Open();

    this.setOutsideClickHandler();

    // stop to prevent handling by outside click handler
    e.stopPropagation();

    this.updateItemsState();
  }

  onBodyClick(e) {
    const item = e.target.closest('.select__item');

    if (!item) return;

    if ('groupToggle' in item.dataset) {
      $('.select__group', this.bodyNode).style.display = 'block';
      item.remove();

      // to prevent click outside the select body
      e.stopPropagation();

      return;
    }

    if ('all' in item.dataset) {
      this.updateSelectedValues([]);
      return;
    }

    let newSelectedValues = [...this.selectedValues];
    const itemValue = item.textContent.trim();

    if (newSelectedValues.includes(itemValue)) {
      newSelectedValues = newSelectedValues.filter(f => f !== itemValue);
    } else {
      newSelectedValues = newSelectedValues.concat(itemValue);
    }

    if (newSelectedValues.length === this.valuesOrder.length) {
      newSelectedValues = [];
    }

    this.updateSelectedValues(newSelectedValues);
  }

  updateSelectedValues(newValues) {
    this.selectedValues = newValues;

    this.updateItemsState();
    this.updateSelectorButtonText();

    this.onUpdate(newValues);
  }

  updateItemsState() {
    const items = $$('.select__item', this.bodyNode);

    items.forEach(x => x.classList.remove('select__item_selected'));

    if (!this.selectedValues.length) {
      items[0].classList.add('select__item_selected');
      return;
    }

    this.selectedValues.forEach(filter => {
      items.find(item => item.textContent.trim() === filter).classList.add('select__item_selected');
    });
  }

  setOutsideClickHandler() {
    const handler = (e) => {
      if (e.target.closest('.select__body')) return;

      this.Enable();
      this.Close();

      this.rootNode.removeEventListener('click', handler);
    }

    this.rootNode.addEventListener('click', handler);
  }

  updateSelectorButtonText() {
    if (!this.selectedValues.length) {
      this.buttonTextNode.innerHTML = 'Everywhere';
      return;
    }

    let selectedValues = [...this.selectedValues];

    selectedValues.sort((a, b) => this.valuesOrder.indexOf(a) - this.valuesOrder.indexOf(b));

    // assume that 5 is the max number of filters we can show w/o problem
    if (selectedValues.length > 5) {
      selectedValues = selectedValues.map(v => this.shortValue(v));
    }

    this.buttonTextNode.innerHTML = selectedValues.join(', ');
  }

  shortValue(value) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstLetter = value[0];

    value = [...value].slice(1).filter(l => !vowels.includes(l.toLowerCase())).join('');

    return firstLetter + value[0];
  }


  /* PUBLIC */

  Open() {
    this.selectNode.classList.add('select_open');
  }

  Close() {
    this.selectNode.classList.remove('select_open');
  }

  IsOpen() {
    return this.selectNode.classList.contains('select_open');
  }

  Enable() {
    this.buttonNode.removeAttribute('disabled');
  }

  Disable() {
    this.buttonNode.setAttribute('disabled', 'disabled');
  }

  SetFilters(filters) {
    this.selectedValues = filters;

    this.updateItemsState();
    this.updateSelectorButtonText();
  }

  GetValuesOrder() {
    return this.valuesOrder;
  }
}
