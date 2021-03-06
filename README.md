# figma-search-extension

Search though Figma objects even in “View only” mode.

## How to install

We're waiting for the extension being published in Chrome Web Store. So it's impossible to install it from there for now.

But you can download the repo and install the extension as ”unpacked”:

1. Open the Extension Management page by navigating to `chrome://extensions`.
   The Extension Management page can also be opened by clicking on the Chrome menu, hovering over “More Tools” then selecting “Extensions”.
2. Enable Developer Mode by clicking the toggle switch next to “Developer mode”.
3. Click the “Load Unpacked” button and select the extension directory.

## TODO

- Fix shortcut
- Omnibox: https://developer.chrome.com/docs/extensions/mv3/user_interface/#omnibox?
- Disable button on other sites
- Add more styles for items
- Improve icon
- Check Chrome & Firefox support
- Add keyboard navigation
- Check if all the pages are loaded. If not search for them through figma.root.children[i], open each and wait for loading. Then search.
