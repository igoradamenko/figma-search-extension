class GlobalPreloader {
  constructor({ node, overlayNode }) {
    this.preloaderNode = node;
    this.overlayNode = overlayNode;

    this.loaderTimeout = null;
  }


  /* PUBLIC */

  Hide() {
    clearTimeout(this.loaderTimeout);

    this.overlayNode.classList.remove('overlay_visible');
    this.preloaderNode.classList.remove('global-preloader_visible');
  }

  Show() {
    clearTimeout(this.loaderTimeout);

    this.loaderTimeout = setTimeout(() => {
      this.overlayNode.classList.add('overlay_visible');
      this.preloaderNode.classList.add('global-preloader_visible');
    }, 50);
  }
}
