# Sauce Labs Test Automation

End-to-end test automation for Sauce Labs demo e-commerce site using Playwright + JavaScript.

## What's Tested

This suite automates a complete customer journey: browse products, add 3 random items to cart, and checkout with dynamically generated test data.

## Tech Stack

- **Playwright** - Fast, reliable browser automation with advanced fixtures
- **JavaScript** - Simple and straightforward
- **Page Object Model** - Clean, maintainable test architecture
- **Faker.js** - Realistic test data generation
- **Custom Fixtures** - Reusable test setup and teardown
- **dotenv** - Environment variable management

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npx playwright install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your test credentials (default values work for saucedemo.com):
   ```
   TEST_USERNAME=standard_user
   TEST_PASSWORD=secret_sauce
   ```

### Run Tests

```bash
npm test                    # headless
npm run test:headed         # see the browser
npm run test:debug          # step through
npm run test:ui            # interactive UI
npm run test:report        # view results
```

## Test Flow

1. Automatic login via custom fixtures (credentials from .env)
2. Add 3 random products to cart
3. Verify cart contents
4. Enter shipping details with faker-generated data
5. Complete order and verify confirmation

## Project Structure

```
fixtures/
  fixtures.js           # Custom Playwright fixtures
pages/                  # Page objects
  LoginPage.js
  InventoryPage.js
  CartPage.js
  CheckoutPage.js
tests/
  checkout.spec.js      # Main test suite
playwright.config.js    # Test configuration
.env.example           # Environment variables template
```

## Key Features

### Advanced Playwright Features

- **Custom Fixtures**: Automatic authentication and page object injection
- **Environment Variables**: Secure credential management
- **Faker Integration**: Dynamic test data generation
- **Page Object Fixtures**: Simplified test setup

### Config Highlights

- Base URL: `https://www.saucedemo.com`
- Browser: Chromium
- Reports: HTML + JSON
- Screenshots/videos on failure
- Trace on retry
- Environment-based configuration

## Dependencies

```json
{
  "@playwright/test": "^1.40.0",
  "@faker-js/faker": "^8.3.1",
  "dotenv": "^16.3.1"
}
```

## Troubleshooting

**Browsers not found?**  
Run `npx playwright install`

**Tests timing out?**  
Check your internet connection

**Environment variables not loading?**  
Ensure `.env` file exists and contains valid credentials

## Best Practices Implemented

✅ No hardcoded credentials  
✅ Custom Playwright fixtures for test setup  
✅ Dynamic test data with Faker  
✅ Reusable page object patterns  
✅ Environment-based configuration  
✅ Proper error handling and validation
