const fs = require('fs');
const path = require('path');
const http = require('http');

const puppeteer = require('puppeteer');
const { expect } = require('chai');

let browser, page, server;

before(async () => {
  browser = await puppeteer.launch();

  // TODO: move to separated script to make it possible to run it as a task
  server = http.createServer((req, res) => {
    fs.readFile(path.resolve(__dirname, '..', `./${req.url}`), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  }).listen(8080);
});

after(async () => {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async () => {
  page = await browser.newPage();

  page.on('error', handleFatalError);
  page.on('pageerror', handleFatalError);

  // page.on('console', msg => console.log(msg.text()));

  await page.setViewport({
    width: 800,
    height: 800,
  });

  await page.goto('http://localhost:8080/test/index.html');
});

afterEach(async () => {
  await page.close();
});

describe('Popup', () => {
  it('should open and close popup', async () => {
    const popup = await openPopup();

    await popup.focus('#input');

    await page.keyboard.type('adasdasdasd');

    await closePopup();
  });

  // TODO: keys handling: letters go to input even w/o focus
});

describe('Preloader', () => {
  it('should show & hide preloader on search', async () => {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.global-preloader_visible', { visible: true });
    await popup.waitForSelector('.global-preloader_visible', { hidden: true });
  });
});

describe('Filter', () => {
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

  // TODO: select all select items → everywhere selected
  // TODO: select closing?
});

describe('List', () => {
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

  // TODO: keyboard navigation
});

describe('Empty Notices', () => {
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

  // TODO: try search everywhere button
});

describe('Cache', () => {
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
    this.timeout(5000);

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

    await makeScreenshot();

    const scrollTopPrev = await popup.evaluate(() => {
      return document.getElementById('content').scrollTop;
    });

    expect(scrollTopPrev).not.eql(0);

    await closePopup();

    popup = await openPopup();

    await popup.waitForSelector('.list', { visible: true });
    await makeScreenshot();

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

  // TODO: keyboard navigation saving position?
});

describe('Deep Search', () => {
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
  await makeScreenshot();

  console.error(err);
  process.exit(1);
}

async function makeScreenshot() {
  const screenshotsDir = path.resolve(__dirname, 'screenshots');

  try {
    fs.mkdirSync(screenshotsDir);
  } catch(err) {
    if (err.code !== 'EEXIST') throw err;
  }

  await page.screenshot({ path: path.resolve(__dirname, 'screenshots', `${new Date().toJSON().replace(/:/g, '-')}.png`) });
}
