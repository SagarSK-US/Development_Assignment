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

    // Step 2: Verify successful login and add 3 random items
    const inventoryPage = new InventoryPage(page);
    await expect(page).toHaveURL(/.*inventory.html/);
    
    const addedItems = await inventoryPage.addRandomItemsToCart(3);
    expect(addedItems.length).toBe(3);
    
    // Verify cart badge shows 3 items
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe('3');

    // Step 3: Go to cart and verify items
    await inventoryPage.goToCart();
    const cartPage = new CartPage(page);
    await expect(page).toHaveURL(/.*cart.html/);
    
    const cartItemCount = await cartPage.getCartItemCount();
    expect(cartItemCount).toBe(3);
    
    const cartItemNames = await cartPage.getCartItemNames();
    expect(cartItemNames.length).toBe(3);
    
    // Verify all added items are in the cart
    for (const itemName of addedItems) {
      expect(cartItemNames).toContain(itemName);
    }

    // Step 4: Proceed to checkout
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/.*checkout-step-one.html/);

    // Step 5: Fill checkout information
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillCheckoutInformation('John', 'Doe', '12345');
    await expect(page).toHaveURL(/.*checkout-step-two.html/);

    // Step 6: Verify items on checkout overview page
    const overviewItems = await page.locator('.cart_item').count();
    expect(overviewItems).toBe(3);

    // Step 7: Complete checkout
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete.html/);

    // Step 8: Verify order completion
    const confirmationText = await checkoutPage.getOrderConfirmationText();
    expect(confirmationText).toBe('Thank you for your order!');
    
    await expect(checkoutPage.completeText).toContainText('Your order has been dispatched');
  });
});
