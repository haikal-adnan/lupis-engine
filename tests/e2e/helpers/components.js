// Branch: inspector components — tambah komponen via dropdown "Add Component..."
// lalu baca/tulis field-nya. Label dropdown -> value:
// 'Physics Body'->Physics, 'Collider'->Collider, 'Audio'->Audio, dst.
import { expect } from '@playwright/test';
import { mouseClick } from './ui.js';

export async function addComponent(page, label) {
  // BaseSelect trigger menampilkan placeholder "Add Component..."
  const trigger = page.locator('div').filter({ hasText: /^Add Component\.\.\.$/ }).first();
  await mouseClick(page, trigger);
  await page.waitForTimeout(600);
  // Opsi muncul di dropdown; klik berdasarkan label persis
  await mouseClick(page, page.getByText(label, { exact: true }).last());
  await page.waitForTimeout(800);
}

export async function expectComponentSection(page, title, timeout = 10000) {
  await expect
    .poll(
      async () =>
        page.evaluate(
          (t) => [...document.querySelectorAll('*')].filter((e) => e.textContent?.trim() === t).length,
          title,
        ),
      { timeout },
    )
    .toBeGreaterThan(0);
}

// Set field BaseNumber di dalam section berlabel `sectionTitle`, row berlabel `rowLabel`,
// axis = prefix span ('X'/'Y'/null untuk single).
export async function setSectionField(page, sectionTitle, rowLabel, value, axis = null) {
  const input = await page.evaluateHandle(
    ({ sec, row, ax }) => {
      const secEl = [...document.querySelectorAll('*')].find((e) => e.textContent?.trim() === sec);
      if (!secEl) return null;
      const container = secEl.closest('.group\\/section') || secEl.closest('section, div');
      const label = [...container.querySelectorAll('label')].find((e) => e.textContent.trim() === row);
      if (!label) return null;
      const rowBox = label.closest('div.flex.flex-col');
      const inputs = [...rowBox.querySelectorAll('input, textarea')];
      if (!ax) return inputs[0] || null;
      return (
        inputs.find((i) => i.closest('div.group')?.querySelector('span')?.textContent?.trim() === ax) ||
        null
      );
    },
    { sec: sectionTitle, row: rowLabel, ax: axis },
  );
  const el = input.asElement();
  if (!el) throw new Error(`field ${sectionTitle}/${rowLabel}${axis ? '/' + axis : ''} tidak ketemu`);
  await el.scrollIntoViewIfNeeded();
  await el.click();
  await el.fill(String(value));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

export async function getSectionField(page, sectionTitle, rowLabel, axis = null) {
  const input = await page.evaluateHandle(
    ({ sec, row, ax }) => {
      const secEl = [...document.querySelectorAll('*')].find((e) => e.textContent?.trim() === sec);
      if (!secEl) return null;
      const container = secEl.closest('.group\\/section') || secEl.closest('section, div');
      const label = [...container.querySelectorAll('label')].find((e) => e.textContent.trim() === row);
      if (!label) return null;
      const rowBox = label.closest('div.flex.flex-col');
      const inputs = [...rowBox.querySelectorAll('input, textarea')];
      if (!ax) return inputs[0] || null;
      return (
        inputs.find((i) => i.closest('div.group')?.querySelector('span')?.textContent?.trim() === ax) ||
        null
      );
    },
    { sec: sectionTitle, row: rowLabel, ax: axis },
  );
  const el = input.asElement();
  if (!el) throw new Error('field tidak ketemu');
  return el.inputValue();
}
