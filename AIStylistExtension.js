// Tracks whether the Voiceflow chat is currently open or closed.
// We presume "closed" by default; as soon as the user opens the widget, we'll flip to true.
let isChatOpen = false;

// Our in-memory "cart" (only { variantGID, quantity, title, price, imageUrl } objects).
const orderProductList = [];

/**
 * Called whenever the Voiceflow chat becomes visible.
 * We set isChatOpen = true, then reposition (or show) the mini-cart if it exists.
 */
function handleChatOpen() {
  isChatOpen = true;
  updateMiniCartPosition();
}

/**
 * Called whenever the Voiceflow chat is minimized or closed.
 * We set isChatOpen = false, then immediately hide the mini-cart (if rendered).
 */
function handleChatClose() {
  isChatOpen = false;
  const miniCart = document.querySelector('.mini-cart');
  if (miniCart) {
    miniCart.style.display = 'none';
  }
}

/**
 * Position (or hide) the mini-cart based on isChatOpen and window width.
 * If isChatOpen === false, hide it. Otherwise show & position it beside the widget.
 */
function updateMiniCartPosition() {
  const miniCart = document.querySelector('.mini-cart');
  if (!miniCart) return;

  // If the chat is closed, hide the mini-cart and return
  if (!isChatOpen) {
    miniCart.style.display = 'none';
    return;
  }

  // Otherwise, show + position next to the open chat widget
  miniCart.style.display = '';
  const isMobile = window.innerWidth <= 600;

  // Clear any previous positioning
  miniCart.style.top    = '';
  miniCart.style.right  = '';
  miniCart.style.bottom = '';

  // On desktop, place 425px from right, 75px from bottom
  // On mobile, place 20px from right, 75px from bottom
  miniCart.style.right  = isMobile ? '20px'  : '425px';
  miniCart.style.bottom = '75px';
}

/**
 * Render (or re-render) the mini-cart HTML based on orderProductList.
 * This function:
 * 1. Creates the .mini-cart container if it doesn't exist.
 * 2. Populates its innerHTML with all items + totals + a "Continue to Checkout" button.
 * 3. Attaches a click handler on "Continue to Checkout" that fires a Voiceflow event.
 * 4. Calls updateMiniCartPosition() to show/hide appropriately.
 */
function renderMiniCart() {
  let miniCart = document.querySelector('.mini-cart');
  if (!miniCart) {
    miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    document.body.appendChild(miniCart);

    // Inject CSS for mini-cart once
    if (!document.getElementById('mini-cart-styles')) {
      const style = document.createElement('style');
      style.id = 'mini-cart-styles';
      style.textContent = `
        .mini-cart {
          position: fixed;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 16px;
          max-width: 300px;
          z-index: 1000;
        }
        .mini-cart-content { display: flex; flex-direction: column; gap: 12px; }
        .mini-cart h3 { margin: 0; font-size: 16px; color: #333; }
        .mini-cart-items { max-height: 200px; overflow-y: auto; }
        .mini-cart-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #eee; }
        .mini-cart-item img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
        .item-details { flex: 1; }
        .item-title { font-size: 14px; color: #333; }
        .item-price { font-size: 12px; color: #666; }
        .mini-cart-total { text-align: right; padding-top: 8px; border-top: 1px solid #eee; }
        .checkout-btn {
          background: #447f76; color: white; border: none; padding: 10px;
          border-radius: 6px; cursor: pointer; font-weight: 500;
          transition: background-color 0.2s;
        }
        .checkout-btn:hover { background: #35635c; }
      `;
      document.head.appendChild(style);
    }
  }

  // Build the innerHTML from orderProductList
  const totalItems = orderProductList.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = orderProductList.reduce((sum, i) => sum + i.price * i.quantity, 0);

  miniCart.innerHTML = `
    <div class="mini-cart-content">
      <h3>Your Cart (${totalItems} items)</h3>
      <div class="mini-cart-items">
        ${orderProductList.map(item => `
          <div class="mini-cart-item">
            <img src="${item.imageUrl}" alt="${item.title}" />
            <div class="item-details">
              <div class="item-title">${item.title}</div>
              <div class="item-price">€${item.price} × ${item.quantity}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="mini-cart-total">
        <strong>Total: €${totalPrice.toFixed(2)}</strong>
      </div>
      <button id="checkoutButton" class="checkout-btn">Continue to Checkout</button>
    </div>
  `;

  // Attach the "Continue to Checkout" listener only once
  const checkoutButton = miniCart.querySelector('#checkoutButton');
  if (checkoutButton && !checkoutButton.dataset.bound) {
    checkoutButton.dataset.bound = 'true';
    checkoutButton.addEventListener('click', () => {
      const payloadData = {
        orderList: orderProductList.map(i => ({
          variantGID: i.variantGID,
          quantity:   i.quantity
        }))
      };
      window.voiceflow.chat.interact({
        action: {
          type: "event",
          payload: {
            event: {
              name: "ContinueToCheckout",
              data: payloadData
            }
          }
        }
      });
    });
  }

  // Position (or hide) the mini-cart based on isChatOpen
  updateMiniCartPosition();
}

/**
 * Helper you can call whenever a user clicks "Add" on a product in your extension.
 * Simply pass in the variantGID, title, price, and imageUrl.
 */
function addItemToOrderList(variantGID, title, price, imageUrl) {
  const existing = orderProductList.find(i => i.variantGID === variantGID);
  if (existing) {
    existing.quantity += 1;
  } else {
    orderProductList.push({ variantGID, quantity: 1, title, price, imageUrl });
  }
  renderMiniCart();
}
window.addItemToOrderList = addItemToOrderList;

// ─────────────────────────────────────────────────────────────────────────────
// 2) Define your extension object and, inside its render(), display your product grid.
//    It will call addItemToOrderList(...) whenever the user clicks "Add".
// ─────────────────────────────────────────────────────────────────────────────

export const AIStylistExtension = {
  name: 'AIStylistExtension',
  type: 'response',
  match: ({ trace }) => {
    return (
      trace.type === 'ext_ai_stylist' ||
      (trace.payload && trace.payload.name === 'ext_ai_stylist')
    );
  },
  render: ({ trace, element }) => {
    // Example payload parsing (as you already do)
    let payloadObj = {};
    if (trace.payload) {
      try {
        payloadObj = typeof trace.payload === 'string'
          ? JSON.parse(trace.payload)
          : trace.payload;
      } catch {
        return;
      }
    }
    const recommendedStylingModels = Array.isArray(payloadObj.recommendedStylingModels)
      ? payloadObj.recommendedStylingModels
      : [];
    const shopifyProductData = payloadObj.shopifyProductData || [];

    // Build your product grid UI exactly as before …
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .stylist-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, 1fr);
          margin: 20px 0;
        }
        .stylist-tile {
          border-radius: 5px;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow .2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
        }
        .stylist-tile img {
          width: 120px;
          height: 160px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .stylist-tile.active {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          z-index: 2;
        }
        .product-panel.vertical-panel {
          border-radius: 12px;
          padding: 20px 10px;
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .look-image-large {
          width: 70%;
          max-width: 220px;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          margin-bottom: 18px;
        }
        .product-list-col {
          width: 100%;
        }
        .product-list-col h3 {
          text-align: center;
          margin-bottom: 10px;
          font-size: 22px;
        }
        .keywords {
          font-size: 12px;
          color: #666;
          margin-bottom: 18px;
          text-align: center;
        }
        .keywords span {
          display: inline-block;
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 12px;
          margin: 2px 4px 2px 0;
        }
        .product-card {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 8px;
          margin-bottom: 14px;
          padding: 10px 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          gap: 12px;
        }
        .product-thumb {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
          margin-right: 10px;
        }
        .product-info {
          flex: 1;
        }
        .product-title {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .product-price {
          color: #447f76;
          font-size: 14px;
        }
        .product-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .product-actions button {
          background: #447f76;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 12px;
          margin-bottom: 2px;
          transition: background-color 0.2s;
        }
        .product-actions button:hover {
          background: #35635c;
        }
        .product-panel.full-width-panel {
          background: #e9e9e9;
          border-radius: 12px;
          padding: 20px 10px;
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
        }
        .look-image-full {
          width: 100%;
          max-width: 340px;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          margin-bottom: 18px;
          display: block;
        }
        .back-btn {
          background: #fff;
          color: #447f76;
          border: 1px solid #447f76;
          border-radius: 6px;
          padding: 6px 18px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 16px;
          transition: background 0.2s, color 0.2s;
        }
        .back-btn:hover {
          background: #447f76;
          color: #fff;
        }
      </style>
      <div class="stylist-grid"></div>
    `;
    element.appendChild(container);
    const grid = container.querySelector('.stylist-grid');
    let activeTile = null;

    recommendedStylingModels.forEach((model) => {
      const tile = document.createElement('div');
      tile.classList.add('stylist-tile');
      tile.dataset.modelId = model['Model ID'];
      const imageUrl = model.Attachments && model.Attachments[0]?.url;
      tile.innerHTML = `<img src="${imageUrl}" alt="${model['Look Name']}" />`;
      tile.addEventListener('click', () => {
        // Your existing "open panel / show products" logic goes here …
        const connectedProductTitles = (model['Connected Products'] || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        const allProducts = Array.isArray(shopifyProductData) ? shopifyProductData : [];
        const connectedProducts = allProducts.filter((p) =>
          connectedProductTitles.includes(p.title)
        );

        // Build a panel that shows connectedProducts with "Add" buttons
        const panel = document.createElement('div');
        panel.classList.add('product-panel');
        panel.innerHTML = `
          <button class="back-btn">← Back</button>
          <img src="${imageUrl}" alt="${model['Look Name']}" class="look-image-large" />
          <div class="product-list-col">
            <h3>${model['Look Name']}</h3>
            ${connectedProducts
              .map((p) => {
                const productImg = p.featuredMedia?.preview?.image?.url || '';
                const price = p.variants?.edges?.[0]?.node?.price || '0.00';
                const variantGID = p.variants?.edges?.[0]?.node?.id || '';

                return `
                  <div class="product-card">
                    <img src="${productImg}" class="product-thumb" />
                    <div class="product-info">
                      <div class="product-title">${p.title}</div>
                      <div class="product-price">€${price}</div>
                    </div>
                    <div class="product-actions">
                      <button class="add-btn" data-variant-gid="${variantGID}" data-title="${p.title}" data-price="${price}" data-image="${productImg}">Add</button>
                      <button class="view-btn" data-handle="${p.handle}">View</button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
        element.appendChild(panel);

        // "Back" button hides this panel and shows the grid again
        panel.querySelector('.back-btn').addEventListener('click', () => {
          panel.remove();
          grid.style.display = '';
          if (activeTile) activeTile.classList.remove('active');
        });

        // Bind each "Add" and "View" button inside panel
        panel.querySelectorAll('.product-card').forEach((card) => {
          const addBtn = card.querySelector('.add-btn');
          const viewBtn = card.querySelector('.view-btn');
          addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const variantGID = addBtn.dataset.variantGid;
            const title       = addBtn.dataset.title;
            const price       = parseFloat(addBtn.dataset.price);
            const imageUrl    = addBtn.dataset.image;

            // Add item to our mini-cart
            addItemToOrderList(variantGID, title, price, imageUrl);
          });

          viewBtn.addEventListener('click', () => {
            const handle = viewBtn.dataset.handle;
            if (handle) {
              window.open(`https://yourshopifystore.com/products/${handle}`, '_blank');
            }
          });
        });

        // Hide the grid while the panel is open
        grid.style.display = 'none';
      });

      grid.appendChild(tile);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3) Register chat.on('open') / chat.on('close') as soon as the widget loads
// ─────────────────────────────────────────────────────────────────────────────

// We wrap this in an IIFE so it runs immediately when the extension is imported.
// It polls until voiceflow.chat is available, then hooks our handlers.
(function waitForVoiceflowChat() {
  if (window.voiceflow && window.voiceflow.chat && typeof window.voiceflow.chat.on === 'function') {
    // Attach open/close listeners here (only once)
    window.voiceflow.chat.on('open',  handleChatOpen);
    window.voiceflow.chat.on('close', handleChatClose);
  } else {
    // Try again in 200ms
    setTimeout(waitForVoiceflowChat, 200);
  }
})();