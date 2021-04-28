class EmptyNotice {
  constructor({ node, overlayNode, onSearchButtonClick }) {
    this.noticeNode = node;
    this.overlayNode = overlayNode;

    this.shownType = null;

    this.onSearchButtonClick = onSearchButtonClick;

    $$('.empty-notice__search-button', this.noticeNode).forEach(button => {
      button.addEventListener('click', () => this.onSearchButtonClick(this.shownType));
    });
  }


  /* PUBLIC */

  Hide() {
    this.shownType = null;
    this.overlayNode.classList.remove('overlay_visible');
    this.noticeNode.className = 'empty-notice';
  }

  Show(type) {
    this.shownType = type;
    this.overlayNode.classList.add('overlay_visible');
    this.noticeNode.className = `empty-notice empty-notice_visible empty-notice_type_${type}`;
  }
}

EmptyNotice.TYPE = {
  GLOBAL: 'global',
  CATEGORY: 'category',
  CATEGORIES: 'categories',
  PAGE: 'page',
};
