class Tabs {
  constructor({ node, onTabSwitch }) {
    this.node = node;
    this.tabs = $$('.tabs__button', node);
    this.tabs.forEach(t => t.addEventListener('click', this.handleTabClick.bind(this)));

    this.onTabSwitch = onTabSwitch;
  }

  /* PRIVATE */

  handleTabClick(e) {
    const tabIndex = this.tabs.findIndex(t => t === e.target);

    this.switchTab(tabIndex);
    this.onTabSwitch(tabIndex);
  }

  switchTab(index) {
    this.tabs.forEach((tab, i) => {
      tab.classList[i === index ? 'add' : 'remove']('tabs__button_selected');
    });
    this.node.style.setProperty('--tabs-selected-item-index', index);
  }


  /* PUBLIC */

  Init() {
    this.node.classList.add('tabs_inited');
  }

  SwitchTab(index) {
    this.switchTab(index);
  }
}

Tabs.TAB = {
  ALL_PAGES: 0,
  CURRENT_PAGE: 1,
};
