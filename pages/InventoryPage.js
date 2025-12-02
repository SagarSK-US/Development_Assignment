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
