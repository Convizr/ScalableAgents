// --- Helper variables and functions ---
const orderProductList = [];
let isChatOpen = true;

function updateMiniCartPosition() {
  const miniCart = document.querySelector('.mini-cart');
  if (!miniCart) return; // If no mini‐cart in DOM, nothing to do.

  // If the widget is minimized/closed, hide the mini-cart
  if (!isChatOpen) {
    miniCart.style.display = 'none';
    return;
  }

  // If the widget is open, show + position the mini-cart
  miniCart.style.display = ''; // revert to default CSS/display value
  const isMobile = window.innerWidth <= 600;

  // Reset any previously set positioning
  miniCart.style.top = '';
  miniCart.style.right = '';
  miniCart.style.bottom = '';

  if (isChatOpen) {
    // Voic eflow widget is open
    miniCart.style.right = isMobile ? '20px' : '425px';
    miniCart.style.bottom = '75px';
  } else {
    // (This branch should never be hit, because we returned earlier if !isChatOpen)
    miniCart.style.right = '20px';
    miniCart.style.bottom = '100px';
  }
}

function addItemToOrderList(variantGID, title, price, imageUrl) {
  const existing = orderProductList.find(item => item.variantGID === variantGID);
  if (existing) {
    existing.quantity += 1;
  } else {
    orderProductList.push({ variantGID, quantity: 1, title, price, imageUrl });
  }
  renderMiniCart();
}

function renderMiniCart() {
  // 1. Find or create the .mini-cart DIV
  let miniCart = document.querySelector('.mini-cart');
  if (!miniCart) {
    miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    document.body.appendChild(miniCart);
  }

  // 2. Populate its innerHTML
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

  // Add back the style injection for the mini-cart
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

  // 3. Once the DOM is updated, call updateMiniCartPosition() to sync visibility/position
  updateMiniCartPosition();

  // 4. Bind the checkout button listener (only once)
  const checkoutButton = miniCart.querySelector('#checkoutButton');
  if (checkoutButton && !checkoutButton.dataset.bound) {
    checkoutButton.dataset.bound = 'true';
    checkoutButton.addEventListener('click', () => {
      const payloadData = {
        orderList: orderProductList.map(i => ({ variantGID: i.variantGID, quantity: i.quantity }))
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

// --- The extension object ---
export const AIStylistExtension = {
  name: 'AIStylistExtension',
  type: 'response',
  match: ({ trace }) => {
    return trace.type === 'ext_ai_stylist' ||
      (trace.payload && trace.payload.name === 'ext_ai_stylist');
  },
  render: ({ trace, element }) => {
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
                  addItemToOrderList(
                    btn.dataset.variantGid,
                    btn.dataset.title,
                    parseFloat(btn.dataset.price),
                    btn.dataset.image
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
  }
};