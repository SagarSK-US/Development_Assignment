const { test, expect } = require('../fixtures/fixtures');
const { faker } = require('@faker-js/faker');

test.describe('Swag Labs Checkout Flow', () => {
  test('should successfully checkout with 3 random items', async ({ 
    authenticatedPage, 
    inventoryPage, 
    cartPage, 
    checkoutPage 
  }) => {
    const page = authenticatedPage;
    // Step 1: Add 3 random items to cart
    const addedItems = await inventoryPage.addRandomItemsToCart(3);
    expect(addedItems.length).toBe(3);
    
    // Verify cart badge shows 3 items
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe('3');

    // Step 2: Go to cart and verify items
    await inventoryPage.goToCart();
    await expect(page).toHaveURL(/.*cart.html/);
    
    const cartItemCount = await cartPage.getCartItemCount();
    expect(cartItemCount).toBe(3);
    
    const cartItemNames = await cartPage.getCartItemNames();
    expect(cartItemNames.length).toBe(3);
    
    // Verify all added items are in the cart
    for (const itemName of addedItems) {
      expect(cartItemNames).toContain(itemName);
    }

    // Step 3: Proceed to checkout
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/.*checkout-step-one.html/);

    // Step 4: Fill checkout information with faker-generated data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const postalCode = faker.location.zipCode();
    
    await checkoutPage.fillCheckoutInformation(firstName, lastName, postalCode);
    await expect(page).toHaveURL(/.*checkout-step-two.html/);

    // Step 5: Verify items on checkout overview page
    const overviewItems = await page.locator('.cart_item').count();
    expect(overviewItems).toBe(3);

    // Step 6: Complete checkout
    await checkoutPage.finishCheckout();
    await expect(page).toHaveURL(/.*checkout-complete.html/);

    // Step 7: Verify order completion
    const confirmationText = await checkoutPage.getOrderConfirmationText();
    expect(confirmationText).toBe('Thank you for your order!');
    
    await expect(checkoutPage.completeText).toContainText('Your order has been dispatched');
  });
});
