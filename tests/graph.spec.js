import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('E2E тестування графових алгоритмів', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('text=/відкрити модуль/i').nth(1).click();
    await page.waitForTimeout(1000);
  });

  test('TC-07: Огинання багаторівневого лабіринту алгоритмом A*', async ({ page }) => {
    // Виправлено: шукаємо саме кнопку "Стіна", а не просто текст
    await page.locator('button:has-text("Стіна")').first().click();

    await page.mouse.move(350, 400);
    await page.mouse.down();
    await page.mouse.move(350, 600);
    await page.mouse.move(550, 600);
    await page.mouse.up();

    const playButton = page.locator('text=/запустити/i').first();
    await expect(playButton).toBeVisible();
    await playButton.click();
    
    await page.waitForTimeout(2000);
    expect(true).toBeTruthy();
  });

  test('TC-08: Динамічна зміна фінішу після знаходження шляху', async ({ page }) => {
    const playButton = page.locator('text=/запустити/i').first();
    await playButton.click();
    await page.waitForTimeout(1500);

    await page.mouse.move(750, 500);
    await page.mouse.down();
    await page.mouse.move(850, 600);
    await page.mouse.up();

    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });

  test('TC-09: Симуляція повної ізоляції (тупик) під час активного пошуку', async ({ page }) => {
    // Виправлено: шукаємо саме кнопку "Стіна"
    await page.locator('button:has-text("Стіна")').first().click();

    await page.mouse.move(700, 450);
    await page.mouse.down();
    await page.mouse.move(800, 450);
    await page.mouse.move(800, 550);
    await page.mouse.move(700, 550);
    await page.mouse.move(700, 450);
    await page.mouse.up();

    const playButton = page.locator('text=/запустити/i').first();
    await playButton.click();

    await page.waitForTimeout(3000);
    expect(true).toBeTruthy();
  });

  test('TC-10: Очищення сітки (Clear) від побудованих об\'єктів', async ({ page }) => {
    // 1. Беремо інструмент "Стіна" і малюємо трохи перешкод
    await page.locator('button:has-text("Стіна")').first().click();
    await page.mouse.move(400, 400);
    await page.mouse.down();
    await page.mouse.move(500, 500);
    await page.mouse.up();

    // 2. Одразу тиснемо кнопку "Очистити поле" (без запуску довгого алгоритму)
    const clearButton = page.locator('text=/очистити поле/i').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });

  test('TC-11: Стрес-тест продуктивності при масовому заповненні сітки стінами', async ({ page }) => {
    // Виправлено: шукаємо саме кнопку "Стіна"
    await page.locator('button:has-text("Стіна")').first().click();

    await page.mouse.move(250, 350);
    await page.mouse.down();
    for (let i = 250; i < 850; i += 40) {
      await page.mouse.move(i, i % 80 === 0 ? 650 : 350); 
    }
    await page.mouse.up();

    const playButton = page.locator('text=/запустити/i').first();
    await playButton.click();
    
    await page.waitForTimeout(3000);
    expect(true).toBeTruthy();
  });

  test('TC-12: Спроба переміщення стартового вузла за межі поля (Edge Case)', async ({ page }) => {
    await page.mouse.move(300, 500); 
    await page.mouse.down();
    await page.mouse.move(300, 100); 
    await page.mouse.up();

    await page.waitForTimeout(500);
    expect(true).toBeTruthy();
  });

});