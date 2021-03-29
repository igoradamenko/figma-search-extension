class List {
  constructor({ node, scrolledContainerNode, onItemFocus, onScroll }) {
    this.listNode = node;
    this.containerNode = scrolledContainerNode;

    this.selectedListItemIndex = undefined;

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

    this.pseudoBlurListItems();
    this.deselectListItems();
    this.scrollToItem(item);
    this.selectListItem(item);

    this.selectedListItemIndex = $$('.list__item', this.listNode).findIndex(i => i === item);

    this.onItemFocus({
      index: this.selectedListItemIndex,
      id: item.dataset.id,
    });
  }


  /* PRIVATE */

  pseudoBlurListItems() {
    $$('.list__item_focused', this.listNode).forEach(i => [
      i.classList.remove('list__item_focused')
    ]);

    console.log('Pseudo-focused items blurred');
  }

  selectListItem(item) {
    item.classList.add('list__item_selected');
    console.log('Item selected');
  }

  deselectListItems() {
    $$('.list__item_selected', this.listNode).forEach(i => {
      i.classList.remove('list__item_selected')
    });

    console.log('Items deselected');
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


  /* PUBLIC */

  Clear() {
    this.listNode.innerHTML = '';
  }

  SetMarkup(markup) {
    this.listNode.innerHTML = markup;
  }

  FocusItemByIndex(index) {
    const item = $$('.list__item', this.listNode)[index];
    this.scrollToItem(item);

    item.focus();
    console.log(`Item #${index} focused`);
  }

  ResetState() {
    this.containerNode.scrollTop = 0;
    this.selectedListItemIndex = undefined;
  }

  SetScrollTop(position) {
    this.containerNode.scrollTop = position;
  }
}
