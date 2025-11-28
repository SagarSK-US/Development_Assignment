# Development Guide - Step by Step

This guide walks you through how this test automation framework was built from scratch.

## Step 1: Project Initialization

First, create a new project directory and initialize it:

```bash
mkdir Development_Assignment
cd Development_Assignment
npm init -y
```

This creates a `package.json` file with default settings.

## Step 2: Install Playwright

Install Playwright as a dev dependency:

```bash
npm install -D @playwright/test
```

Install the browser binaries:

```bash
npx playwright install
```

## Step 3: Update Package Scripts

Edit `package.json` to add test scripts:

```json
"scripts": {
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:debug": "playwright test --debug",
  "test:report": "playwright show-report",
  "test:ui": "playwright test --ui"
}
```

## Step 4: Create Playwright Configuration

Create `playwright.config.js` in the root directory:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Key configurations:**
- `testDir`: Where test files are located
- `baseURL`: Base URL for all page navigations
- `reporter`: Generate HTML, JSON, and console reports
- `trace/screenshot/video`: Capture on failures for debugging

## Step 5: Create Project Structure

Create the necessary folders:

```bash
mkdir pages
mkdir tests
```

## Step 6: Build Page Objects

The Page Object Model separates page interactions from test logic.

### LoginPage.js

Create `pages/LoginPage.js`:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };
```

**Key concepts:**
- Constructor takes `page` object from Playwright
- Locators use data-test attributes (most reliable)
- Methods represent user actions

### InventoryPage.js

Create `pages/InventoryPage.js`:

```javascript
class InventoryPage {
  constructor(page) {
    this.page = page;
    this.inventoryItems = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.shoppingCartLink = page.locator('.shopping_cart_link');
  }

  async getItemCount() {
    return await this.inventoryItems.count();
  }

  async addRandomItemsToCart(count) {
    const itemCount = await this.getItemCount();
    const addedItems = [];
    
    // Generate random unique indices
    const randomIndices = new Set();
    while (randomIndices.size < Math.min(count, itemCount)) {
      randomIndices.add(Math.floor(Math.random() * itemCount));
    }

    // Add items to cart
    for (const index of randomIndices) {
      const item = this.inventoryItems.nth(index);
      const itemName = await item.locator('.inventory_item_name').textContent();
      await item.locator('button[id^="add-to-cart"]').click();
      if (itemName) addedItems.push(itemName);
    }

    return addedItems;
  }

  async getCartItemCount() {
    return await this.cartBadge.textContent() || '0';
  }

  async goToCart() {
    await this.shoppingCartLink.click();
  }
}

module.exports = { InventoryPage };
```

**Key concepts:**
- `addRandomItemsToCart()` uses Set to ensure unique items
- Returns array of added item names for verification
- Uses `.nth(index)` to select specific items

### CartPage.js

Create `pages/CartPage.js`:

```javascript
class CartPage {
  constructor(page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async getCartItemNames() {
    return await this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  async getCartItemCount() {
    return await this.cartItems.count();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

module.exports = { CartPage };
```

### CheckoutPage.js

Create `pages/CheckoutPage.js`:

```javascript
class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.completeText = page.locator('[data-test="complete-text"]');
  }

  async fillCheckoutInformation(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  async finishCheckout() {
    await this.finishButton.click();
  }

  async getOrderConfirmationText() {
    return await this.completeHeader.textContent() || '';
  }
}

module.exports = { CheckoutPage };
```

## Step 7: Write the Test

Create `tests/checkout.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');

test.describe('Swag Labs Checkout Flow', () => {
  test('should successfully checkout with 3 random items', async ({ page }) => {
    // Step 1: Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');

    // Step 2: Verify login and add items
    const inventoryPage = new InventoryPage(page);
    await expect(page).toHaveURL(/.*inventory.html/);
    
    const addedItems = await inventoryPage.addRandomItemsToCart(3);
    expect(addedItems.length).toBe(3);
    
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe('3');

    // Step 3: Verify cart
    await inventoryPage.goToCart();
    const cartPage = new CartPage(page);
    await expect(page).toHaveURL(/.*cart.html/);
    
    const cartItemCount = await cartPage.getCartItemCount();
    expect(cartItemCount).toBe(3);
    
    const cartItemNames = await cartPage.getCartItemNames();
    for (const itemName of addedItems) {
      expect(cartItemNames).toContain(itemName);
    }

    // Step 4: Checkout
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/.*checkout-step-one.html/);

    // Step 5: Fill info
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillCheckoutInformation('John', 'Doe', '12345');
    await expect(page).toHaveURL(/.*checkout-step-two.html/);

    // Step 6: Verify overview
    const overviewItems = await page.locator('.cart_item').count();
    expect(overviewItems).toBe(3);

    // Step 7: Complete order
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete.html/);

    // Step 8: Verify confirmation
    const confirmationText = await checkoutPage.getOrderConfirmationText();
    expect(confirmationText).toBe('Thank you for your order!');
    
    await expect(checkoutPage.completeText).toContainText('Your order has been dispatched');
  });
});
```

**Test structure:**
- `test.describe()`: Groups related tests
- `async ({ page })`: Playwright automatically provides page object
- Multiple assertion points throughout the flow
- Clear comments for each step

## Step 8: Add .gitignore

Create `.gitignore`:

```
node_modules/
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
test-results.json
```

## Step 9: Run Tests

Execute the tests:

```bash
npm test                    # Headless mode
npm run test:headed         # See browser
npm run test:debug          # Debug mode
```

View the report:

```bash
npm run test:report
```

## Understanding Key Concepts

### Page Object Model (POM)

**Benefits:**
- Separates page logic from test logic
- Reusable page methods
- Easier to maintain when UI changes
- More readable tests

**Structure:**
```
Page Class → Contains locators and methods
Test File → Uses page objects to perform actions
```

### Locator Strategies

**Priority order:**
1. `data-test` attributes (most reliable)
2. `id` attributes
3. CSS classes (least reliable, can change)

**Examples:**
```javascript
page.locator('[data-test="username"]')  // Best
page.locator('#username')               // Good
page.locator('.username-input')         // OK
```

### Assertions

**Common assertions:**
```javascript
expect(value).toBe(expected)           // Exact match
expect(array).toContain(item)          // Array contains
expect(page).toHaveURL(/pattern/)      // URL matches regex
expect(element).toContainText(text)    // Partial text match
```

### Async/Await

All Playwright actions are asynchronous:
```javascript
await page.goto('/')                   // Wait for navigation
await element.click()                  // Wait for action
await element.textContent()            // Wait for value
```

## Debugging Tips

### Run in headed mode
```bash
npm run test:headed
```

### Use debug mode
```bash
npm run test:debug
```

### Add console logs
```javascript
console.log('Cart count:', await cartBadge.textContent());
```

### Take screenshots manually
```javascript
await page.screenshot({ path: 'debug.png' });
```

### Use page.pause()
```javascript
await page.pause();  // Stops execution, opens inspector
```

## Common Issues & Solutions

### Issue: Element not found
**Solution:** 
- Verify selector is correct
- Add wait: `await page.waitForSelector('.element')`
- Check if element is in iframe

### Issue: Test timeout
**Solution:**
- Increase timeout in config
- Check network speed
- Verify element visibility

### Issue: Flaky tests
**Solution:**
- Use proper waits (avoid fixed timeouts)
- Use data-test attributes
- Wait for network idle: `await page.goto('/', { waitUntil: 'networkidle' })`

## Extending the Framework

### Add new test
1. Create new spec file in `tests/`
2. Import required page objects
3. Write test following same pattern

### Add new page object
1. Create new class in `pages/`
2. Define locators in constructor
3. Add methods for user actions
4. Export the class

### Add test data
```javascript
const testData = {
  validUser: { username: 'standard_user', password: 'secret_sauce' },
  customer: { firstName: 'John', lastName: 'Doe', zip: '12345' }
};
```

## Best Practices

1. Single responsibility per page object method
2. Clear, intention-revealing test names
3. Independent tests (no order dependency)
4. Strong assertions at critical checkpoints
5. Minimal comments (only for complex logic)
6. Reusable components (DRY principle)
7. Stable selectors using data-test attributes

## Next Steps

- Extend coverage (multiple users, edge cases)
- Centralize test data management
- Add API testing with Playwright
- Set up CI/CD pipeline
- Enable visual regression testing
- Execute tests in parallel across browsers

---

