const fs = require('fs');
const path = require('path');

const puppeteer = require('puppeteer');
const { expect } = require('chai');

const startServer = require('./server');

let browser, page, server;

process.on('exit', () => {
  browser.close();
  server.close();
});

before(async function() {
  server = await startServer();
  browser = await puppeteer.launch();
});

after(async function() {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async function() {
  page = await browser.newPage();

  // set timeout to force tests to fail before mocha timeout
  // makes it easier to figure out an error
  page.setDefaultTimeout(3000);

  page.on('error', handleFatalError);
  page.on('pageerror', handleFatalError);

  // page.on('console', msg => console.log(msg.text()));

  await page.setViewport({
    width: 800,
    height: 800,
  });

  await page.goto('http://localhost:8080/test/index.html');
});

afterEach(async function() {
  await page.close();
});

describe('Popup', function() {
  it('should open and close popup', async () => {
    const popup = await openPopup();

    await popup.focus('#input');

    await page.keyboard.type('adasdasdasd');

    await closePopup();
  });

  it('should handle letters keys even w/o focusing on input', async () => {
    const popup = await openPopup();

    // for some reason .focus does not work here
    // probably due to “unfocusability” of the non-input block
    await popup.click('#content');

    await page.keyboard.type('asd');

    await popup.waitForFunction('document.getElementById("input").value === "asd"');
  });
});

describe('Preloader', function() {
  it('should show & hide preloader on search', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.global-preloader_visible', { visible: true });
    await popup.waitForSelector('.global-preloader_visible', { hidden: true });
  });
});

describe('Filter', function() {
  it('should not show DOCUMENT node in results', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('ios');

    await popup.waitForSelector('.list', { visible: true });

    const documentNodesCount = await popup.evaluate(() => {
      return [...document.querySelectorAll('.list__item-title')].filter(x => x.textContent === '(Variants) iOS & iPadOS 14 UI Kit for Figma (Community)').length;
    });

    expect(documentNodesCount).eql(0);
  });

  it('should show groups filter', async () => {
    const popup = await openPopup();

    await popup.waitForSelector('#select', { visible: true });
  });

  it('should open groups filter', async () => {
    const popup = await openPopup();

    await popup.waitForSelector('#select button', { visible: true });
    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });
  });

  it('should open ”others...” group in groups filter', async () => {
    const popup = await openPopup();

    await popup.waitForSelector('#select button', { visible: true });
    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });
    await popup.waitForSelector('.select__group', { hidden: true });

    await popup.click('.select__item[data-group-toggle]');
    await popup.waitForSelector('.select__item[data-group-toggle]', { hidden: true });

    await popup.waitForSelector('.select__group', { visible: true });
  });

  it('should select item in groups filter', async () => {
    const popup = await openPopup();

    await popup.waitForSelector('#select button', { visible: true });

    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Everywhere"]', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });
    await popup.waitForSelector('.select__item_selected[data-all]', { visible: true });

    await popup.click('.select__item[data-item]');
    await popup.waitForSelector('.select__item_selected[data-item]', { visible: true });
    await popup.waitForSelector('.select__item_selected[data-all]', { hidden: true });
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Page"]', { visible: true });
  });

  it('should filter results using groups filter', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    const itemsCountPrev = await popup.evaluate(() => {
      return document.querySelectorAll('.list__item').length;
    });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(4)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Frame"]', { visible: true });

    const itemsCountNext = await popup.evaluate(() => {
      return document.querySelectorAll('.list__item').length;
    });

    expect(itemsCountPrev > itemsCountNext).eql(true);
    expect(itemsCountNext).eql(1);
  });

  it('should select “everywhere“ when all the items are selected', async () => {
    const popup = await openPopup();

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-group-toggle]');
    await popup.waitForSelector('.select__item[data-group-toggle]', { hidden: true });

    const notSelectedItemsSelector = '.select__separator ~ .select__item:not(.select__item_selected),.select__separator ~ .select__group .select__item:not(.select__item_selected)';

    const itemsCount = await popup.evaluate(`document.querySelectorAll("${notSelectedItemsSelector}").length`);

    for (let i = 0; i < itemsCount - 1; i++) {
      await popup.click(notSelectedItemsSelector);
      await popup.waitForFunction(`document.querySelectorAll("${notSelectedItemsSelector}").length === ${itemsCount - i - 1}`);
    }

    await popup.click(notSelectedItemsSelector);
    await popup.waitForFunction(`document.querySelectorAll("${notSelectedItemsSelector}").length === ${itemsCount}`);
    await popup.waitForFunction(`document.querySelector(".select__item_selected").textContent === "Everywhere"`);
  });

  it('should close when Esc pressed', async () => {
    const popup = await openPopup();

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await page.keyboard.press('Escape');

    await popup.waitForSelector('.select_open', { hidden: true });
  });

  it('should short filter titles when 5+ selected', async () => {
    const popup = await openPopup();

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-group-toggle]');
    await popup.waitForSelector('.select__item[data-group-toggle]', { hidden: true });

    const notSelectedItemsSelector = '.select__separator ~ .select__item:not(.select__item_selected),.select__separator ~ .select__group .select__item:not(.select__item_selected)';

    const itemsCount = await popup.evaluate(`document.querySelectorAll("${notSelectedItemsSelector}").length`);

    for (let i = 0; i < 6; i++) {
      await popup.click(notSelectedItemsSelector);
      await popup.waitForFunction(`document.querySelectorAll("${notSelectedItemsSelector}").length === ${itemsCount - i - 1}`);
    }

    await popup.waitForFunction(`document.querySelector(".select__button-text").textContent === "Pg, Fr, Cm, Gr, In, Sl"`);
  });

  it('should not move focus on input when open', async () => {
    const popup = await openPopup();

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await page.keyboard.type('widget');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.waitForFunction(`document.getElementById('input').value === ''`);
  });

  it('should not filter when current selected values are not changed', async () => {
    const popup = await openPopup();

    await popup.click('#select button');
    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item_selected');

    await page.keyboard.press('Escape');
    await popup.waitForSelector('.select_open', { hidden: true });

    await popup.waitForSelector('.empty-notice_visible', { hidden: true });
  });

  it('should not filter when input field is empty', async () => {
    const popup = await openPopup();

    await popup.click('#select button');
    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item:not(.select__item_selected)');
    await popup.waitForSelector('.select__separator + .select__item_selected', { visible: true });

    await page.keyboard.press('Escape');
    await popup.waitForSelector('.select_open', { hidden: true });

    await popup.waitForSelector('.empty-notice_visible', { hidden: true });
  });
});

describe('List', function() {
  it('should select items on click', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('.list__item_type_frame')
    await popup.waitForSelector('.list__item_selected', { visible: true });
  });

  it('should not show group headlines when only one group is selected', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(4)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Frame"]', { visible: true });

    await popup.waitForSelector('.list__headline', { hidden: true });
  });

  it('should show group headlines when only two groups are selected', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(4)');
    await popup.click('.select__item[data-item]:nth-child(5)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Frame, Component"]', { visible: true });

    await popup.waitForSelector('.list__headline', { visible: true });
  });

  it('should navigate through list using keyboard', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    // three times just for sure, nothing special here
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await popup.waitForSelector('.list__item_selected', { visible: true });
  });
});

describe('Empty Notices', function() {
  it('should show not found when nothing found', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('фшгравфлоывр');

    await popup.waitForSelector('.empty-notice_visible', { visible: true });
  });

  it('should show global empty notice when one empty group is selected', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(3)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Page"]', { visible: true });

    await popup.waitForSelector('.empty-notice_visible', { visible: true });
  });

  it('should show global empty notice when two empty groups are selected', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(3)');

    await popup.click('.select__item[data-group-toggle]');
    await popup.waitForSelector('.select__item[data-group-toggle]', { hidden: true });

    await popup.click('.select__item[data-item]:nth-child(8)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Page, Arrow"]', { visible: true });


    await popup.waitForSelector('.empty-notice_visible', { visible: true });
  });

  it('should show empty group notice when two groups are selected and one of them is empty', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item[data-item]:nth-child(3)');
    await popup.click('.select__item[data-item]:nth-child(4)');
    await popup.waitForXPath('//*[@id="select"]/button/span[text()="Page, Frame"]', { visible: true });

    await popup.waitForSelector('.list__empty-notice', { visible: true });
  });

  it('should change filter to Everywhere when “Try Search Everywhere” pressed (one group)', async () => {
    const popup = await openPopup();

    await popup.click('#select button');
    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item:not(.select__item_selected)');
    await popup.waitForSelector('.select__separator + .select__item_selected', { visible: true });
    await popup.waitForFunction('document.querySelector(".select__button-text").textContent === "Page"');

    await page.keyboard.press('Escape');
    await popup.waitForSelector('.select_open', { hidden: true });

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.empty-notice_visible', { visible: true });
    await popup.click('.empty-notice__text_type_category .empty-notice__search-button');


    await popup.waitForFunction('document.querySelector(".select__button-text").textContent === "Everywhere"');
    await popup.waitForSelector('.empty-notice_visible', { hidden: true });
    await popup.waitForSelector('.list', { visible: true });
  });

  it('should change filter to Everywhere when “Try Search Everywhere” pressed (many groups)', async () => {
    const popup = await openPopup();

    await popup.click('#select button');
    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item:not(.select__item_selected)');
    await popup.waitForSelector('.select__separator + .select__item_selected', { visible: true });

    await popup.click('.select__item[data-group-toggle]');
    await popup.waitForSelector('.select__group', { visible: true });

    await popup.click('.select__group .select__item:nth-child(2)');
    await popup.waitForSelector('.select__group .select__item.select__item_selected:nth-child(2)', { visible: true });
    await popup.waitForFunction('document.querySelector(".select__button-text").textContent === "Page, Slice"');

    await page.keyboard.press('Escape');
    await popup.waitForSelector('.select_open', { hidden: true });

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.empty-notice_visible', { visible: true });
    await popup.click('.empty-notice__text_type_categories .empty-notice__search-button');

    await popup.waitForFunction('document.querySelector(".select__button-text").textContent === "Everywhere"');
    await popup.waitForSelector('.empty-notice_visible', { hidden: true });
    await popup.waitForSelector('.list', { visible: true });
  });
});

describe('Cache', function() {
  it('should restore previous search results', async () => {
    let popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await closePopup();

    popup = await openPopup();

    await popup.waitForSelector('.list', { visible: true });
  });

  it('should restore scroll on previous search results', async function() {
    let popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    const body = await popup.$('body');
    const boundingBox = await body.boundingBox();
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );

    await page.mouse.down();

    await page.mouse.wheel({ deltaY: 1000 });

    // it takes some time to scroll the view
    await new Promise(resolve => setTimeout(resolve, 1000));

    const scrollTopPrev = await popup.evaluate(() => {
      return document.getElementById('content').scrollTop;
    });

    expect(scrollTopPrev).not.eql(0);

    await closePopup();

    popup = await openPopup();

    await popup.waitForSelector('.list', { visible: true });

    const scrollTopNext = await popup.evaluate(() => {
      return document.getElementById('content').scrollTop;
    });

    expect(scrollTopPrev).eql(scrollTopNext);
  });

  it('should set focus on previously selected items', async () => {
    let popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.click('.list__item_type_frame');
    await popup.waitForSelector('.list__item_selected', { visible: true });

    await closePopup();

    popup = await openPopup();

    await popup.waitForSelector('.list__item_focused', { visible: true });
  });

  it('should restore previously keyboard-selected item', async () => {
    let popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    // three times just for sure, nothing special here
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await closePopup();

    popup = await openPopup();

    await popup.waitForSelector('.list__item_focused', { visible: true });
  });

  it('should restore filter state', async () => {
    let popup = await openPopup();

    await popup.click('#select button');

    await popup.waitForSelector('.select_open', { visible: true });

    await popup.click('.select__item:not(.select__item_selected)');
    await popup.waitForSelector('.select__separator + .select__item_selected');

    await page.keyboard.press('Escape');
    await popup.waitForSelector('.select_open', { hidden: true });

    await popup.waitForFunction(`document.querySelector('.select__button-text').textContent === 'Page'`);

    await closePopup();

    popup = await openPopup();

    await popup.waitForFunction(`document.querySelector('.select__button-text').textContent === 'Page'`);
  });
});

describe('Deep Search', function() {
  it('should show deep search button', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.waitForSelector('.deep-search-button_visible', { visible: true });
  });

  it('should show preloader during deep search', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.list', { visible: true });

    await popup.waitForSelector('.deep-search-button_visible', { visible: true });
    await popup.click('.deep-search-button_visible');

    await popup.waitForSelector('.deep-search-preloader_visible', { visible: true });
  });

  it('should add more items after deep search', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('top nav. bar');

    await popup.waitForSelector('.list', { visible: true });

    const itemsCountPrev = await popup.evaluate(() => {
      return document.querySelectorAll('.list__item').length;
    });

    await popup.waitForSelector('.deep-search-button_visible', { visible: true });
    await popup.click('.deep-search-button_visible');

    await popup.waitForSelector('.deep-search-preloader_visible', { visible: true });
    await popup.waitForSelector('.deep-search-preloader_visible', { hidden: true });

    await popup.waitForSelector('.list', { visible: true });

    const itemsCountNext = await popup.evaluate(() => {
      return document.querySelectorAll('.list__item').length;
    });

    expect(itemsCountNext > itemsCountPrev).eql(true);
  });
});

async function openPopup() {
  await page.click('#open-popup-button');

  await page.waitForSelector('iframe[src]', { visible: true });

  const [iframe] = await page.mainFrame().childFrames();

  return iframe;
}

async function closePopup() {
  // do two clicks, because sometimes first does not work,
  // probably because focus is on the iframe
  await page.click('#close-popup-button');
  await page.click('#close-popup-button');

  await page.waitForSelector('iframe[src]', { hidden: true });
}

async function handleFatalError(err) {
  await takeScreenshot();

  throw err;
}

async function takeScreenshot() {
  const screenshotsDir = path.resolve(__dirname, 'screenshots');

  try {
    fs.mkdirSync(screenshotsDir);
  } catch(err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const filename = `${new Date().toJSON().replace(/:/g, '-')}.png`;

  await page.screenshot({ path: path.resolve(__dirname, 'screenshots', filename) });

  console.log('Took screenshot:', filename);
}
