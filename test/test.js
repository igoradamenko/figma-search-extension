const fs = require('fs');
const path = require('path');
const http = require('http');

const puppeteer = require('puppeteer');
const { expect } = require('chai');

let browser, page, server;

describe('Main', () => {
  before(async () => {
    browser = await puppeteer.launch();

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

    await page.setViewport({
      width: 800,
      height: 800,
    });

    await page.goto('http://localhost:8080/test/index.html');
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

  it('should show & hide preloader on search', async function() {
    const popup = await openPopup();

    await popup.focus('#input');
    await page.keyboard.type('widget');

    await popup.waitForSelector('.global-preloader_visible', { visible: true });
    await popup.waitForSelector('.global-preloader_visible', { hidden: true });
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
