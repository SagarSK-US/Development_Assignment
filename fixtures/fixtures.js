const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');

// Extend base test with custom fixtures
const test = base.test.extend({
  // Fixture to automatically handle login
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Get credentials from environment variables
    const username = process.env.TEST_USERNAME || 'standard_user';
    const password = process.env.TEST_PASSWORD || 'secret_sauce';
    
    await loginPage.login(username, password);
    await base.expect(page).toHaveURL(/.*inventory.html/);
    
    // Use the authenticated page
    await use(page);
  },

  // Page object fixtures
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

const expect = base.expect;

module.exports = { test, expect };
