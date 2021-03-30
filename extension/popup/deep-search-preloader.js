class DeepSearchPreloader {
  constructor({ node, overlayNode }) {
    this.preloaderNode = node;
    this.overlayNode = overlayNode;
  }


  /* PUBLIC */

  Hide() {
    this.overlayNode.classList.remove('overlay_visible');
    this.preloaderNode.classList.remove('deep-search-preloader_visible');

    this.SetProgress(0);
  }

  Show() {
    this.overlayNode.classList.add('overlay_visible');
    this.preloaderNode.classList.add('deep-search-preloader_visible');
  }

  IsShown() {
    return this.preloaderNode.classList.contains('deep-search-preloader_visible');
  }

  SetProgress(fraction) {
    this.preloaderNode.style.setProperty('--progress-fraction', fraction.toString());
    console.log('Set Deep Search Preloader progress as', fraction);
  }
}
