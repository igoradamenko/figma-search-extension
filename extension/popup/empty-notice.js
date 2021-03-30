class EmptyNotice {
  constructor({ node, overlayNode, onSearchButtonClick }) {
    this.noticeNode = node;
    this.overlayNode = overlayNode;

    this.onSearchButtonClick = onSearchButtonClick;

    $$('.empty-notice__search-button', this.noticeNode).forEach(button => {
      button.addEventListener('click', this.onSearchButtonClick.bind(this));
    });
  }


  /* PUBLIC */

  Hide() {
    this.overlayNode.classList.remove('overlay_visible');
    this.noticeNode.className = 'empty-notice';
  }

  Show(type) {
    this.overlayNode.classList.add('overlay_visible');
    this.noticeNode.className = `empty-notice empty-notice_visible empty-notice_type_${type}`;
  }
}

EmptyNotice.TYPE = {
  GLOBAL: 'global',
  CATEGORY: 'category',
  CATEGORIES: 'categories',
};
