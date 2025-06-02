// AIStylistExtension.js

// ─────────────────────────────────────────────────────────────────────────────
// 1) Mini-cart state + helpers (same as before)
// ─────────────────────────────────────────────────────────────────────────────

let isChatOpen = false;
const orderProductList = [];

function handleChatOpen() {
  isChatOpen = true;
  updateMiniCartPosition();
}

function handleChatClose() {
  isChatOpen = false;
  const miniCart = document.querySelector('.mini-cart');
  if (miniCart) miniCart.style.display = 'none';
}

function updateMiniCartPosition() {
  const miniCart = document.querySelector('.mini-cart');
  if (!miniCart) return;
  if (!isChatOpen) {
    miniCart.style.display = 'none';
    return;
  }
  miniCart.style.display = '';
  const isMobile = window.innerWidth <= 600;
  miniCart.style.top = '';
  miniCart.style.right = '';
  miniCart.style.bottom = '';
  miniCart.style.right  = isMobile ? '20px'  : '425px';
  miniCart.style.bottom = '75px';
}

function renderMiniCart() {
  let miniCart = document.querySelector('.mini-cart');
  if (!miniCart) {
    miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    document.body.appendChild(miniCart);

    // Inject CSS once
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
          payload: { event: { name: "ContinueToCheckout", data: payloadData } }
        }
      });
    });
  }

  updateMiniCartPosition();
}

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
// 2) Define the extension object; use the init() hook to register open/close events
// ─────────────────────────────────────────────────────────────────────────────

export const AIStylistExtension = {
  name: 'AIStylistExtension',
  type: 'response',

  // match() decides when your extension’s UI should appear
  match: ({ trace }) => {
    return (
      trace.type === 'ext_ai_stylist' ||
      (trace.payload && trace.payload.name === 'ext_ai_stylist')
    );
  },

  // render() builds your product‐grid UI that calls addItemToOrderList()
  render: ({ trace, element }) => {
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

    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .stylist-grid { display: grid; gap: 16px; grid-template-columns: repeat(2,1fr); margin: 20px 0; }
        .stylist-tile { border-radius: 5px; overflow: hidden; cursor: pointer; transition: box-shadow .2s; display: flex; flex-direction: column; align-items: center; padding: 8px; }
        .stylist-tile img { width: 120px; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
        .stylist-tile.active { box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 2; }
        .product-panel { border-radius: 12px; padding: 20px 10px; margin-top: 12px; display: flex; flex-direction: column; align-items: center; background: #e9e9e9; width: 100%; box-sizing: border-box; }
        .back-btn { background: #fff; color: #447f76; border: 1px solid #447f76; border-radius: 6px; padding: 6px 18px; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 16px; transition: background 0.2s, color 0.2s; }
        .back-btn:hover { background: #447f76; color: #fff; }
        .look-image-large { width: 70%; max-width: 220px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 18px; }
        .product-list-col { width: 100%; }
        .product-list-col h3 { text-align: center; margin-bottom: 10px; font-size: 22px; }
        .product-card { display: flex; align-items: center; background: #fff; border-radius: 8px; margin-bottom: 14px; padding: 10px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); gap: 12px; }
        .product-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; margin-right: 10px; }
        .product-info { flex: 1; }
        .product-title { font-weight: 600; font-size: 15px; margin-bottom: 2px; }
        .product-price { color: #447f76; font-size: 14px; }
        .product-actions { display: flex; flex-direction: column; gap: 4px; }
        .product-actions button { background: #447f76; color: #fff; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 12px; margin-bottom: 2px; transition: background-color 0.2s; }
        .product-actions button:hover { background: #35635c; }
      </style>
      <div class="stylist-grid"></div>
    `;
    element.appendChild(container);
    const grid = container.querySelector('.stylist-grid');
    let activeTile = null;

    recommendedStylingModels.forEach((model) => {
      const tile = document.createElement('div');
      tile.classList.add('stylist-tile');
      const imageUrl = model.Attachments?.[0]?.url || '';
      tile.innerHTML = `<img src="${imageUrl}" alt="${model['Look Name']}" />`;

      tile.addEventListener('click', () => {
        if (activeTile && activeTile !== tile) {
          activeTile.classList.remove('active');
          const prevPanel = activeTile.parentElement.querySelector('.product-panel');
          if (prevPanel) prevPanel.remove();
        }
        const isReopening = tile.classList.toggle('active');
        activeTile = isReopening ? tile : null;
        if (isReopening) {
          grid.style.display = 'none';
          const panel = document.createElement('div');
          panel.classList.add('product-panel');
          const connectedProductTitles = (model['Connected Products'] || '').split(',').map(t => t.trim()).filter(Boolean);
          const connectedProducts = shopifyProductData.filter(p => connectedProductTitles.includes(p.title));

          let panelHTML = `<button class="back-btn">← Back</button>
            <img src="${imageUrl}" alt="${model['Look Name']}" class="look-image-large" />
            <div class="product-list-col"><h3>${model['Look Name']}</h3>`;

          connectedProducts.forEach(p => {
            const productImg  = p.featuredMedia?.preview?.image?.url || '';
            const price       = p.variants?.edges?.[0]?.node?.price || '0.00';
            const variantGID  = p.variants?.edges?.[0]?.node?.id || '';
            const handle      = p.handle || '';

            panelHTML += `
              <div class="product-card">
                <img src="${productImg}" class="product-thumb" />
                <div class="product-info">
                  <div class="product-title">${p.title}</div>
                  <div class="product-price">€${price}</div>
                </div>
                <div class="product-actions">
                  <button class="add-btn" data-variant-gid="${variantGID}" data-title="${p.title}" data-price="${price}" data-image="${productImg}">Add</button>
                  <button class="view-btn" data-handle="${handle}">View</button>
                </div>
              </div>
            `;
          });

          panelHTML += `</div>`;
          panel.innerHTML = panelHTML;
          element.appendChild(panel);

          panel.querySelector('.back-btn').addEventListener('click', () => {
            panel.remove();
            grid.style.display = '';
            if (activeTile) activeTile.classList.remove('active');
          });

          panel.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', e => {
              e.stopPropagation();
              const vg  = btn.dataset.variantGid;
              const ti  = btn.dataset.title;
              const pr  = parseFloat(btn.dataset.price);
              const img = btn.dataset.image;
              addItemToOrderList(vg, ti, pr, img);
            });
          });
          panel.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const h = btn.dataset.handle;
              if (h) window.open(`https://yourshopifystore.com/products/${h}`, '_blank');
            });
          });
        }
      });

      grid.appendChild(tile);
    });
  },

  /**
   * init() is called once, right after the widget loads and your extension is registered.
   * This is a guaranteed safe place to call voiceflow.chat.on('open') / .on('close').
   */
  init: () => {
    // At this point, voiceflow.chat is definitely available
    window.voiceflow.chat.on('open', handleChatOpen);
    window.voiceflow.chat.on('close', handleChatClose);
    console.log('[extension] Registered open/close in init()');
  }
};