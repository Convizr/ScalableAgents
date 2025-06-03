// --- In-memory cart state ---
const orderProductList = [];
let miniCartTimeout = null;

function updateCartContents(miniCart) {
  const totalItems = orderProductList.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = orderProductList.reduce((sum, i) => sum + i.price * i.quantity, 0);
  miniCart.innerHTML = `
    <div class="mini-cart-content">
      <h3>Your Cart (${totalItems} item${totalItems === 1 ? '' : 's'})</h3>
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
          quantity: i.quantity
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
}

function updateCartIcon(cartIcon) {
  const totalItems = orderProductList.reduce((sum, i) => sum + i.quantity, 0);
  cartIcon.querySelector('.cart-count').textContent = totalItems;
  cartIcon.style.display = totalItems > 0 ? 'flex' : 'none';
}

function showMiniCartWithTimeout(miniCart, cartIcon) {
  if (miniCartTimeout) clearTimeout(miniCartTimeout);
  updateCartContents(miniCart);
  miniCart.style.display = '';
  cartIcon.style.display = 'none';
  miniCartTimeout = setTimeout(() => {
    miniCart.style.display = 'none';
    updateCartIcon(cartIcon);
    cartIcon.style.display = 'flex';
  }, 5000);
}

// Expose for use in add buttons
window.addItemToOrderList = function(variantGID, title, price, imageUrl, miniCart, cartIcon) {
  const existing = orderProductList.find(i => i.variantGID === variantGID);
  if (existing) {
    existing.quantity += 1;
  } else {
    orderProductList.push({ variantGID, quantity: 1, title, price, imageUrl });
  }
  showMiniCartWithTimeout(miniCart, cartIcon);
  updateCartIcon(cartIcon);
};

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
    // Remove any previous mini-cart and cart icon
    const oldMiniCart = document.querySelector('.mini-cart');
    if (oldMiniCart) oldMiniCart.remove();
    const oldCartIcon = document.querySelector('.cart-icon');
    if (oldCartIcon) oldCartIcon.remove();

    // Create miniCart and cartIcon at the top
    const miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    const cartIcon = document.createElement('div');
    cartIcon.className = 'cart-icon';
    cartIcon.innerHTML = `
      <span class="cart-svg"> <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28"><g fill="#1a171b"><path d="M47.273 0h-6.544a.728.728 0 0 0-.712.58L38.63 7.219H.727a.727.727 0 0 0-.7.912l4.6 17.5c.006.021.019.037.026.059a.792.792 0 0 0 .042.094.747.747 0 0 0 .092.135.831.831 0 0 0 .065.068.626.626 0 0 0 .167.107.285.285 0 0 0 .045.029l13.106 5.145-5.754 2.184a4.382 4.382 0 1 0 .535 1.353l7.234-2.746 6.866 2.7A4.684 4.684 0 1 0 27.6 33.4l-5.39-2.113 13.613-5.164c.013-.006.021-.016.033-.021a.712.712 0 0 0 .188-.119.625.625 0 0 0 .063-.072.654.654 0 0 0 .095-.135.58.58 0 0 0 .04-.1.73.73 0 0 0 .033-.084l5.042-24.137h5.953a.728.728 0 0 0 0-1.455zM8.443 38.885a3.151 3.151 0 1 1 3.152-3.15 3.155 3.155 0 0 1-3.152 3.15zm23.1-6.3a3.151 3.151 0 1 1-3.143 3.149 3.155 3.155 0 0 1 3.148-3.152zM25.98 8.672l-.538 7.3H14.661l-.677-7.295zm-.645 8.75-.535 7.293h-9.328l-.672-7.293zM1.671 8.672h10.853l.677 7.3h-9.61zm2.3 8.75h9.362l.677 7.293H5.892zM20.2 30.5 9.175 26.17H31.6zm14.778-5.781h-8.722l.537-7.293h9.7zm1.822-8.752h-9.9l.537-7.295h10.889z"/><circle cx="8.443" cy="35.734" r=".728"/><circle cx="31.548" cy="35.734" r=".728"/></g></svg></span>
      <span class="cart-count">0</span>
    `;
    cartIcon.style.display = 'none';
    cartIcon.style.alignItems = 'center';
    cartIcon.style.cursor = 'pointer';
    cartIcon.style.position = 'fixed';
    cartIcon.style.right = '20px';
    cartIcon.style.bottom = '75px';
    cartIcon.style.background = 'white';
    cartIcon.style.borderRadius = '50%';
    cartIcon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    cartIcon.style.padding = '6px 10px 6px 6px';
    cartIcon.style.zIndex = '1001';
    cartIcon.querySelector('.cart-count').style.marginLeft = '4px';
    cartIcon.querySelector('.cart-count').style.fontWeight = 'bold';
    cartIcon.querySelector('.cart-count').style.color = '#447f76';

    // Cart icon click shows mini-cart and restarts timer
    cartIcon.addEventListener('click', () => {
      showMiniCartWithTimeout(miniCart, cartIcon);
    });

    // 1) Build the grid as before
    let payloadObj = {};
    if (trace.payload) {
      if (typeof trace.payload === 'string') {
        try {
          payloadObj = JSON.parse(trace.payload);
        } catch (e) {
          return;
        }
      } else {
        payloadObj = trace.payload;
      }
    }
    const recommendedStylingModels = Array.isArray(payloadObj.recommendedStylingModels) ? payloadObj.recommendedStylingModels : [];
    const shopifyProductData = payloadObj.shopifyProductData || {};

    // Main container
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .stylist-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
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
        .mini-cart {
          position: fixed;
          right: 20px;
          bottom: 75px;
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
        .cart-icon {
          position: fixed;
          right: 20px;
          bottom: 75px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          padding: 6px 10px 6px 6px;
          z-index: 1001;
          align-items: center;
          cursor: pointer;
          display: flex;
        }
        .cart-count {
          margin-left: 4px;
          font-weight: bold;
          color: #447f76;
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
        if (activeTile && activeTile !== tile) {
          activeTile.classList.remove('active');
          const prevPanel = activeTile.querySelector('.product-panel');
          if (prevPanel) prevPanel.remove();
        }
        const isReopening = tile.classList.toggle('active');
        activeTile = isReopening ? tile : null;
        if (isReopening) {
          grid.style.display = 'none';
          const prevFullPanel = container.querySelector('.full-width-panel');
          if (prevFullPanel) prevFullPanel.remove();
          const panel = document.createElement('div');
          panel.classList.add('product-panel', 'full-width-panel');
          let panelHTML = `
            <button class="back-btn" style="margin-bottom: 16px;">← Back</button>
            <img src="${imageUrl}" alt="${model['Look Name']}" class="look-image-full" />
            <div class="product-list-col">
              <h3 style="text-align:center; margin-bottom: 18px; font-size: 24px;">${model['Look Name']}</h3>
          `;
          const allProducts = Array.isArray(shopifyProductData) ? shopifyProductData : [];
          const connectedProductTitles = (model['Connected Products'] || '').split(',').map(t => t.trim()).filter(Boolean);
          const connectedProducts = allProducts.filter(p => connectedProductTitles.includes(p.title));
          panelHTML += connectedProducts.map(p => {
            const productImg = p.featuredMedia?.preview?.image?.url || 'https://via.placeholder.com/48';
            const price = p.variants?.edges?.[0]?.node?.price || 'N/A';
            const variantGID = p.variants?.edges?.[0]?.node?.id || '';
            return `
              <div class="product-card" data-product-title="${p.title}">
                <img src="${productImg}" class="product-thumb" />
                <div class="product-info">
                  <div class="product-title">${p.title}</div>
                  <div class="product-price">€${price}</div>
                </div>
                <div class="product-actions">
                  <button data-action="add" data-variant-gid="${variantGID}" data-title="${p.title}" data-price="${price}" data-image="${productImg}">Add</button>
                  <button data-action="view">View</button>
                </div>
              </div>
            `;
          }).join('');
          panelHTML += '</div>';
          panel.innerHTML = panelHTML;
          const backBtn = panel.querySelector('.back-btn');
          backBtn.addEventListener('click', () => {
            panel.remove();
            grid.style.display = '';
            if (activeTile) activeTile.classList.remove('active');
            activeTile = null;
          });
          panel.querySelectorAll('.product-card').forEach(card => {
            const productTitle = card.dataset.productTitle;
            card.querySelectorAll('button').forEach(btn => {
              btn.addEventListener('click', e => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'view') {
                  const product = connectedProducts.find(p => p.title === productTitle);
                  if (product && product.handle) {
                    const shopifyUrl = `https://yourshopifystore.com/products/${product.handle}`;
                    window.open(shopifyUrl, '_blank');
                    return;
                  }
                } else if (action === 'add') {
                  window.addItemToOrderList(
                    btn.dataset.variantGid,
                    btn.dataset.title,
                    parseFloat(btn.dataset.price),
                    btn.dataset.image,
                    miniCart,
                    cartIcon
                  );
                  return;
                }
                window.voiceflow.chat.interact({
                  type: 'complete',
                  payload: {
                    action,
                    productTitle
                  }
                });
              });
            });
          });
          container.appendChild(panel);
        }
      });
      grid.appendChild(tile);
    });
    // Add mini-cart and cart icon to the DOM (fixed position)
    document.body.appendChild(container);
    document.body.appendChild(cartIcon);
    document.body.appendChild(miniCart);
    // Initial state
    updateCartContents(miniCart);
    updateCartIcon(cartIcon);
    if (orderProductList.length > 0) {
      showMiniCartWithTimeout(miniCart, cartIcon);
    } else {
      miniCart.style.display = 'none';
      cartIcon.style.display = 'none';
    }
  },

  unmount: () => {
    const miniCart = document.querySelector('.mini-cart');
    if (miniCart) miniCart.remove();
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) cartIcon.remove();
    const containers = document.querySelectorAll('.ai-stylist-extension-root');
    containers.forEach(root => root.remove());
    orderProductList.length = 0;
    if (miniCartTimeout) clearTimeout(miniCartTimeout);
  }
};