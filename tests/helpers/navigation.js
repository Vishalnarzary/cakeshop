async function gotoReady(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function waitForProducts(page) {
  await page.locator('#loading-state').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.locator('#product-grid:visible, #empty-state:visible').waitFor({ timeout: 15_000 });
}

module.exports = { gotoReady, waitForProducts };
