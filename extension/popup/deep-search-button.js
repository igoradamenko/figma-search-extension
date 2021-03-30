class DeepSearchButton {
  constructor({ node, onClick }) {
    this.buttonNode = node;
    this.buttonNode.addEventListener('click', onClick);
  }


  /* PUBLIC */

  Hide() {
    this.buttonNode.classList.remove('deep-search-button_visible');
  }

  Show() {
    this.buttonNode.classList.add('deep-search-button_visible');
  }
}
