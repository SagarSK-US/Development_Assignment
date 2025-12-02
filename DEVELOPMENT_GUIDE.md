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

1. **One action per method** in page objects
2. **Clear test names** describing what is tested
3. **Independent tests** - don't rely on test order
4. **Meaningful assertions** at each critical step
5. **Comments** for complex logic only
6. **DRY principle** - reuse page objects
7. **Stable selectors** - prefer data-test attributes

## Next Steps

- Add more test scenarios (multiple users, edge cases)
- Implement test data management
- Add API testing with Playwright
- Set up CI/CD pipeline
- Add visual regression testing
- Implement parallel execution across browsers

---

## Interview Questions & Answers

### Q1: Why did you choose Playwright over other tools like Selenium or Cypress?

**Answer:** I chose Playwright for several reasons:
- **Auto-wait mechanism**: Playwright automatically waits for elements to be actionable, reducing flaky tests
- **Multi-browser support**: Works with Chromium, Firefox, and WebKit from a single API
- **Fast execution**: Built on modern architecture, tests run significantly faster
- **Better debugging**: Built-in tools like trace viewer, inspector, and codegen
- **Native async/await**: Modern JavaScript approach, easier to write and read
- **Better mobile emulation**: Can test responsive designs easily

### Q2: Explain the Page Object Model pattern you implemented.

**Answer:** Page Object Model (POM) is a design pattern where we create a class for each page of the application. Each class contains:
- **Locators**: All element selectors defined in one place
- **Methods**: User actions on that page (login, click, fill forms, etc.)

**Benefits:**
- If UI changes, we only update the page object, not every test
- Tests become more readable - they use business language instead of technical selectors
- Code reusability - multiple tests can use the same page objects
- Easier maintenance

**Example:** Instead of writing `page.locator('[data-test="username"]').fill('user')` in every test, we call `loginPage.login('user', 'pass')`.

### Q3: How do you handle random item selection in your test?

**Answer:** I implemented a random selection algorithm in the `InventoryPage` class:

```javascript
async addRandomItemsToCart(count) {
  const itemCount = await this.getItemCount();
  const randomIndices = new Set();
  
  // Set ensures unique random indices
  while (randomIndices.size < Math.min(count, itemCount)) {
    randomIndices.add(Math.floor(Math.random() * itemCount));
  }
  
  // Store item names for verification
  const addedItems = [];
  for (const index of randomIndices) {
    const item = this.inventoryItems.nth(index);
    const itemName = await item.locator('.inventory_item_name').textContent();
    await item.locator('button[id^="add-to-cart"]').click();
    addedItems.push(itemName);
  }
  
  return addedItems; // Used to verify in cart
}
```

**Key points:**
- Used `Set` to ensure no duplicate items
- Returned item names for verification in later steps
- Made it flexible by accepting count as parameter

### Q4: How do you ensure test reliability and avoid flaky tests?

**Answer:** Several strategies:

1. **Use Playwright's auto-wait**: Don't use fixed `sleep()` or `setTimeout()`
2. **Proper locators**: Prefer `data-test` attributes over CSS classes
3. **Wait for specific conditions**: 
   ```javascript
   await expect(page).toHaveURL(/.*inventory.html/);
   ```
4. **Verify state changes**: Check URL, element visibility, text content
5. **Screenshots/videos on failure**: Configured in playwright.config.js
6. **Retries**: Set up retries in CI environment
7. **Isolated tests**: Each test is independent, no shared state

### Q5: How do you verify the checkout flow is working correctly?

**Answer:** I implemented verification at multiple checkpoints:

1. **Login verification**: Check URL redirect to inventory page
2. **Cart count**: Verify badge shows correct number (3)
3. **Cart contents**: Match item names between selection and cart
4. **Navigation**: Verify URL changes at each checkout step
5. **Order overview**: Count items on final review page
6. **Confirmation**: Check success message and order completion text

Each assertion validates a critical step, ensuring the complete flow works end-to-end.

### Q6: What reporting mechanisms did you implement?

**Answer:** Three types of reports configured in `playwright.config.js`:

1. **HTML Report**: Visual report with screenshots, videos, traces
   - Command: `npm run test:report`
   - Shows pass/fail, execution time, error details
   
2. **JSON Report**: Machine-readable for CI/CD integration
   - File: `test-results.json`
   - Can be parsed for metrics and dashboards
   
3. **List Reporter**: Console output during test run
   - Real-time feedback
   - Shows test progress and failures immediately

### Q7: How would you handle testing with different user types?

**Answer:** I would implement a test data approach:

```javascript
const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_out_user', password: 'secret_sauce' },
  problem: { username: 'problem_user', password: 'secret_sauce' }
};

test('checkout with standard user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(users.standard.username, users.standard.password);
  // rest of test
});
```

Or use Playwright's test parametrization:

```javascript
for (const user of Object.values(users)) {
  test(`checkout with ${user.username}`, async ({ page }) => {
    await loginPage.login(user.username, user.password);
  });
}
```

### Q8: What would you do if an element takes a long time to load?

**Answer:** Multiple approaches:

1. **Increase timeout for specific action**:
   ```javascript
   await element.click({ timeout: 10000 });
   ```

2. **Wait for specific condition**:
   ```javascript
   await page.waitForSelector('.element', { state: 'visible' });
   ```

3. **Wait for network idle**:
   ```javascript
   await page.goto('/', { waitUntil: 'networkidle' });
   ```

4. **Wait for specific network request**:
   ```javascript
   await page.waitForResponse(response => 
     response.url().includes('/api/data') && response.status() === 200
   );
   ```

### Q9: How do you handle test failures in CI/CD?

**Answer:** Configuration in `playwright.config.js`:

```javascript
retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
workers: process.env.CI ? 1 : undefined,  // Single worker in CI
```

**CI/CD best practices:**
- Automatic retries for transient failures
- Screenshots and videos saved as artifacts
- Trace files for debugging
- JSON report for metrics tracking
- Fail the pipeline if tests fail after retries
- Send notifications with report links

### Q10: Explain how you selected locators for elements.

**Answer:** I followed a priority strategy:

1. **First choice - data-test attributes**:
   ```javascript
   page.locator('[data-test="username"]')
   ```
   - Most reliable, won't change with styling
   - Specifically for testing

2. **Second choice - id attributes**:
   ```javascript
   page.locator('#login-button')
   ```
   - Usually unique and stable

3. **Last choice - CSS classes**:
   ```javascript
   page.locator('.inventory_item')
   ```
   - Can change with redesigns
   - Used when no better option

4. **Avoid - XPath**:
   - Fragile, breaks with DOM changes
   - Hard to read and maintain

### Q11: How would you test the same flow on mobile devices?

**Answer:** Playwright supports device emulation:

```javascript
// In playwright.config.js
const { devices } = require('@playwright/test');

projects: [
  {
    name: 'Desktop Chrome',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'iPhone 13',
    use: { ...devices['iPhone 13'] },
  },
  {
    name: 'iPad Pro',
    use: { ...devices['iPad Pro'] },
  },
]
```

Tests run unchanged across all devices, Playwright handles viewport and user agent.

### Q12: What would you test additionally in a real project?

**Answer:** Additional scenarios:

1. **Negative scenarios**:
   - Invalid login credentials
   - Empty cart checkout
   - Invalid payment information
   - Session timeout

2. **Edge cases**:
   - Maximum cart items
   - Special characters in form fields
   - Network interruptions
   - Browser back button behavior

3. **Performance**:
   - Page load times
   - API response times

4. **Accessibility**:
   - Keyboard navigation
   - Screen reader compatibility
   - ARIA labels

5. **Security**:
   - SQL injection attempts
   - XSS protection
   - Authentication tokens

### Q13: How do you handle test data cleanup?

**Answer:** Strategies:

1. **Before each test** - Reset to known state:
   ```javascript
   test.beforeEach(async ({ page }) => {
     // Clear cookies, local storage
     await page.context().clearCookies();
   });
   ```

2. **After each test** - Clean up:
   ```javascript
   test.afterEach(async ({ page }) => {
     // Logout, clear cart, etc.
   });
   ```

3. **Independent tests** - Each test creates its own data
4. **API calls** - Use API to create/delete test data faster
5. **Database resets** - Reset test database between runs

### Q14: How would you implement API testing in this framework?

**Answer:** Playwright has built-in API testing:

```javascript
test('verify cart via API', async ({ request }) => {
  // Login via API
  const response = await request.post('/api/login', {
    data: { username: 'standard_user', password: 'secret_sauce' }
  });
  
  const token = await response.json();
  
  // Add item via API
  await request.post('/api/cart/add', {
    headers: { Authorization: `Bearer ${token}` },
    data: { itemId: 123 }
  });
  
  // Verify via API
  const cart = await request.get('/api/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  expect(cart.ok()).toBeTruthy();
  expect(await cart.json()).toHaveLength(1);
});
```

**Benefits:**
- Faster than UI tests
- Test API independently
- Set up test state quickly

### Q15: What metrics would you track for test effectiveness?

**Answer:** Key metrics:

1. **Test coverage**: Percentage of features tested
2. **Test execution time**: Track trends, optimize slow tests
3. **Flakiness rate**: Percentage of tests that fail intermittently
4. **Pass/fail ratio**: Overall health indicator
5. **Time to detect bugs**: How quickly tests catch issues
6. **Maintenance time**: Time spent fixing tests after code changes
7. **Bug escape rate**: Bugs found in production that tests missed

Track these in dashboards using JSON report data:

```javascript
// Parse test-results.json
const results = require('./test-results.json');
const passRate = (results.passed / results.total) * 100;
const avgDuration = results.duration / results.total;
```
