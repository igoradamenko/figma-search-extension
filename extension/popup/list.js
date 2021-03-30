class List {
  constructor({ node, scrolledContainerNode, onItemFocus, onScroll }) {
    this.listNode = node;
    this.containerNode = scrolledContainerNode;

    this.selectedItemIndex = undefined;
    this.itemsNodes = [];

    this.pseudoFocusedItem = null;
    this.selectedItem = null;

    this.measurements = {
      containerTopOffset: this.containerNode.getBoundingClientRect().top,
      containerHeight: this.containerNode.offsetHeight,
      headlineHeight: 28, // *shrug*
    };

    this.onItemFocus = onItemFocus;
    this.onScroll = onScroll;

    this.listNode.addEventListener('click', this.onListClick.bind(this));
    this.containerNode.addEventListener('scroll', this.onContainerScroll.bind(this));
  }


  /* EVENT HANDLERS */

  onContainerScroll() {
    console.log('List container scrolled');
    this.onScroll(this.containerNode.scrollTop);
  }

  onListClick(e) {
    console.log('List clicked');

    const item = e.target.closest('.list__item');

    if (!item) {
      console.log('Clicked item not found')
      return;
    }

    console.log('Clicked item found');

    this.PseudoBlurItems();
    this.scrollToItem(item);
    this.selectItem(item);

    this.selectedItemIndex = this.itemsNodes.findIndex(i => i === item);

    this.onItemFocus({
      index: this.selectedItemIndex,
      id: item.dataset.id,
    });
  }


  /* PRIVATE */

  selectItem(item) {
    if (!this.selectedItem) {
      console.log('There is no previously selected item to deselect');
    } else {
      this.selectedItem.classList.remove('list__item_selected');
      console.log('Deselected previously selected item');
    }

    item.classList.add('list__item_selected');
    this.selectedItem = item;

    console.log('Item selected');
  }

  focusItemByIndex(index) {
    const item = this.itemsNodes[index];
    this.scrollToItem(item);

    item.focus();
    console.log(`Item #${index} focused`);
  }

  scrollToItem(item) {
    const itemBounds = item.getBoundingClientRect();

    const topBordersDiff = itemBounds.top - (this.measurements.containerTopOffset + this.measurements.headlineHeight);
    const bottomBordersDiff = (itemBounds.top + itemBounds.height) - (this.measurements.containerTopOffset + this.measurements.containerHeight);
    const isItemTopBorderOutside = topBordersDiff < 0;
    const isItemBottomBorderOutside = bottomBordersDiff > 0;

    if (isItemTopBorderOutside) {
      this.containerNode.scrollBy(0, topBordersDiff);
      console.log('Scrolled list container node');
      return;
    }

    if (isItemBottomBorderOutside) {
      this.containerNode.scrollBy(0, bottomBordersDiff);
      console.log('Scrolled list container node');
      return;
    }
  }

  buildGroupMarkup(name, items, { hideHeadline = false } = {}) {
    const headline = hideHeadline ? '' : `<div class="list__headline">${name}</div>`;
    let list;

    if (items.length) {
      const listItems = items.map(i => {
        return `<li><button class="list__item list__item_type_${i.type}" type="button" data-id="${i.id}">${i.name}</button></li>`
      }).join('');

      list = `<ul class="list__items">${listItems}</ul>`;
    } else {
      list = '<div class="list__empty-notice">Nothing found</div>';
    }

    return `<div class="list">${headline}${list}</div>`;
  }

  buildListMarkup(itemsByGroup) {
    return itemsByGroup
      .map(x => this.buildGroupMarkup(x.group, x.items, { hideHeadline: itemsByGroup.length === 1 }))
      .join('');
  }

  resetState() {
    this.containerNode.scrollTop = 0;
    this.selectedItemIndex = undefined;
    this.pseudoFocusedItem = null;
    this.selectedItem = null;
  }



  /* PUBLIC */

  Clear() {
    this.itemsNodes = [];
    this.listNode.innerHTML = '';

    this.resetState();
  }

  IsEmpty() {
    // it works even with items hiding, because we don't actually “hide” them
    // we rebuild the list w/o them; so there are no nodes for hidden items in DOM
    return this.itemsNodes.length === 0;
  }

  RenderItems(itemsByGroup) {
    this.listNode.innerHTML = this.buildListMarkup(itemsByGroup);
    this.itemsNodes = $$('.list__item', this.listNode);

    this.resetState();
  }

  FocusNextItem() {
    this.selectedItemIndex ??= -1;
    this.selectedItemIndex = (this.selectedItemIndex + 1) % this.itemsNodes.length;

    this.focusItemByIndex(this.selectedItemIndex);

    return this.selectedItemIndex;
  }

  FocusPreviousItem() {
    this.selectedItemIndex ??= 0;
    this.selectedItemIndex = (this.selectedItemIndex - 1 + this.itemsNodes.length) % this.itemsNodes.length;

    this.focusItemByIndex(this.selectedItemIndex);

    return this.selectedItemIndex;
  }

  PseudoBlurItems() {
    if (!this.pseudoFocusedItem) {
      console.log('There is no pseudo-focused item to blur');
      return;
    }

    this.pseudoFocusedItem.classList.remove('list__item_focused');
    this.pseudoFocusedItem = null;
  }

  PseudoFocusItemByIndex(index) {
    list.PseudoBlurItems();

    const item = this.itemsNodes[index];
    item.classList.add('list__item_focused');

    this.pseudoFocusedItem = item;

    this.selectedItemIndex = index;

    console.log(`Item #${index} pseudo-focused`);
  }

  SetScrollTop(position) {
    this.containerNode.scrollTop = position;
  }
}
