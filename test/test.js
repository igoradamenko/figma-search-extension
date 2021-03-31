const puppeteer = require('puppeteer');
const { expect } = require('chai');

let browser, page;

describe('Main', () => {
  before(async () => {
    browser = await puppeteer.launch();
  });

  after(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();

    await page.setViewport({
      width: 800,
      height: 800,
    });

    await page.goto('file://' + __dirname + '/index.html');
  });

  afterEach(async () => {
    await page.close();
  });

  it('should open and close popup', async () => {
    const popup = await openPopup();

    await popup.focus('#input');

    await page.keyboard.type('adasdasdasd');

    await closePopup();
  });
});

async function openPopup() {
  await page.click('#open-popup-button');

  await page.waitForSelector('iframe[src]', { visible: true });

  const [iframe] = await page.mainFrame().childFrames();

  return iframe;
}

async function closePopup() {
  await page.click('#close-popup-button');

  await page.waitForSelector('iframe[src]', { hidden: true });
}
