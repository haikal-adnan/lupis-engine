// Util UI generik untuk E2E.
// QUIRK: locator.click() hang pada beberapa elemen di env ini;
// gunakan mouseClick() yang klik via koordinat boundingBox.
export async function mouseClick(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) throw new Error('elemen tidak punya bounding box (tidak visible)');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

export async function mouseRightClick(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) throw new Error('elemen tidak punya bounding box (tidak visible)');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
}
