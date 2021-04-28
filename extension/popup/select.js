class Select {
  constructor({ node, onUpdate }) {
    this.selectNode = node;
    this.buttonNode = $('.select__button', node);
    this.buttonTextNode = $('.select__button-text', node);
    this.bodyNode = $('.select__body', node);

    this.itemsNodes = $$('[data-item]', this.bodyNode);

    this.valuesOrder = this.itemsNodes.map(x => x.textContent.trim());
    this.onUpdate = onUpdate;

    this.selectedValues = [];

    this.buttonNode.addEventListener('click', this.onButtonClick.bind(this));
    this.bodyNode.addEventListener('click', this.onBodyClick.bind(this));
  }


  /* EVENT HANDLERS */

  onButtonClick(e) {
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
      this.showHiddenGroup();

      // to prevent click outside the select body
      e.stopPropagation();

      return;
    }

    if ('all' in item.dataset) {
      if (this.selectedValues.length !== 0) {
        this.updateSelectedValues([]);
      }

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


  /* PRIVATE */

  showHiddenGroup() {
    $('.select__group', this.bodyNode).style.display = 'block';
    $('[data-group-toggle]', this.bodyNode).remove();
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

      document.body.removeEventListener('click', handler);
    }

    document.body.addEventListener('click', handler);
  }

  updateSelectorButtonText() {
    if (!this.selectedValues.length) {
      this.buttonTextNode.innerHTML = 'Everything';
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

  isValueHidden(value) {
    const item = this.itemsNodes.find(x => x.textContent.trim() === value);

    return !!item && item.parentElement.classList.contains('select__group');
  }


  /* PUBLIC */

  Open() {
    this.Disable();
    this.selectNode.classList.add('select_open');
  }

  Close() {
    this.selectNode.classList.remove('select_open');
    this.Enable();
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

  SetSelectedValues(selectedValues) {
    this.selectedValues = selectedValues;

    if (this.selectedValues.some(v => this.isValueHidden(v))) {
      this.showHiddenGroup();
    }

    this.updateItemsState();
    this.updateSelectorButtonText();
  }

  GetValuesOrder() {
    return this.valuesOrder;
  }
}
