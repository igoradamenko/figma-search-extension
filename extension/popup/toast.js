class Toast {
  constructor({ node, onClick }) {
    this.node = node;

    this.node.addEventListener('click', onClick);
  }


  /* PUBLIC */

  Show() {
    this.node.classList.add('toast_visible');
  }

  Hide() {
    this.node.classList.remove('toast_visible');
  }
}
