# Figma Search Extension

<img align="right"
     alt="Project logo: magnifying glass with component icon inside"
     src="icon.svg"
     width="128"
     height="128">

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/lfofpannpmmeeicgiiacjghmcfgnebbi?label=Chrome%20Web%20Store) ![Mozilla Add-on](https://img.shields.io/amo/v/figma-search?label=Mozilla%20Add-ons)

Search though Figma objects even in “View only” mode.

Supported browsers: Chrome, Firefox, and any Chromium-based browser (Edge, Opera, Yandex.Browser, etc).

[![Figma Search in Chrome Web Store](./add-to-chrome.svg)](https://chrome.google.com/webstore/detail/figma-search/lfofpannpmmeeicgiiacjghmcfgnebbi)
[![Figma Search in Mozilla Add-ons](./add-to-firefox.svg)](https://addons.mozilla.org/en-US/firefox/addon/figma-search/)

[![Demo Video on YouTube](./youtube-demo.png)](https://www.youtube.com/watch?v=lINTurBElgM)

## Contents

- [Rationale](#rationale)
- [Features](#features)
  - [Shortcut](#shortcut)
  - [Keyboard navigation](#keyboard-navigation)
  - [Deep search](#deep-search)
- [How to install](#how-to-install)
  - [Chrome Web Store](#chrome-web-store)
  - [Firefox Add-ons](#firefox-add-ons)
  - [Manual installation](#manual-installation)
    - [Chrome or other Chromium-based browser](#chrome-or-other-chromium-based-browser)
    - [Firefox](#firefox)

## Rationale

Currently Figma does not have such built-in option. You can use Figma plugins, but they don't work in “View only” mode.
You may copy every file into your drafts and use plugins there, but it's kinda tediously.

So this plugin was built as a temporary solution, until the time when Figma developers implement native search.

## Features

There are some things you should probably know about this extension.

### Shortcut

If you press `Alt` + `Shift` + `F`, it will open the extension.

It's possible to change this shortcut in your browser's settings.

### Keyboard navigation

Any key that you press while extension's popup is open will be sent into its search field.
Any key except `Arrow Down`, `Arrow Up` and `Enter`. Use these keys to faster go through search results.

### Deep search

Sadly, but sometimes Figma does not load all pages in “View only” mode, which does not allow us to search through all the existed 
objects. So if your file has a lot of pages, you have to load them all.

To make it a bit easier the extension shows button “Try Deep Search” in such cases. Click on this button will load 
all the pages for you and retry the current search request. 

## How to install

### Chrome Web Store

If you use Chrome or any Chromium-based browser (Edge, Opera, Yandex.Browser, etc) it's easy to install 
the extension from the official store:

**[Figma Search](https://chrome.google.com/webstore/detail/figma-search/lfofpannpmmeeicgiiacjghmcfgnebbi) in Crome Web Store**

Just click on the link above and press “Add to Chrome”.

### Firefox Add-ons

If you use Mozilla Firefox, then install the extension from the official store:

**[Figma Search](https://addons.mozilla.org/en-US/firefox/addon/figma-search/) in Firefox Browser Add-ons**

Open the link above and press “Add to Firefox”.

### Manual installation

#### Chrome or other Chromium-based browser

1. [Download the latest release](https://github.com/igoradamenko/figma-search-extension/releases).
2. Unpack the downloaded archive somewhere, where you won't remove it accidentally.
3. Open `chrome://extensions` in your browser.
4. Enable “Developer mode” (usually it looks like a radio-button in a corner of the page).
5. Press “Load unpacked” button (appears only in developer mode).
6. Select the folder with the unpacked extension (from 2nd step). 
7. Reload Figma pages that had been open before you installed the extension, and you're ready to go.

Your browser may throw you alerts after restart, which say that this extension is not trusted or something.
But that's the price for installing an extension directly from the sources.

#### Firefox

If you use Windows or macOS, you have to install [Firefox Developer Edition](https://www.mozilla.org/ru/firefox/developer/)
or [Firefox Nightly](https://www.mozilla.org/ru/firefox/channel/desktop/#nightly). It's impossible to install unpacked
extension permanently into a regular Firefox.

If you use Linux or have already installed one of those editions, then:

1. [Download the latest release](https://github.com/igoradamenko/figma-search-extension/releases).
2. Open `about:config` and accept the risk, find variable `xpinstall.signatures.required` and set it to `false`.
3. Open `about:addons`, press on a settings icon and pick “Install Add-on From File...” from a dropdown menu.
4. Select the downloaded ZIP extension (from 1st step).
5. Approve an installation.
