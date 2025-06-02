// --- In-memory cart state ---
const orderProductList = [];
let miniCartTimeout = null;

function updateCartContents(miniCart, show = true) {
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
  if (show) {
    miniCart.style.display = '';
  } else {
    miniCart.style.display = 'none';
  }
}

function updateCartIcon(cartIcon) {
  const totalItems = orderProductList.reduce((sum, i) => sum + i.quantity, 0);
  cartIcon.querySelector('.cart-count').textContent = totalItems;
  cartIcon.style.display = totalItems > 0 ? 'flex' : 'none';
}

function showMiniCartWithTimeout(miniCart, cartIcon) {
  if (miniCartTimeout) clearTimeout(miniCartTimeout);
  updateCartContents(miniCart, true);
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
    // Remove any previous root
    const oldRoot = element.querySelector('.ai-stylist-extension-root');
    if (oldRoot) oldRoot.remove();

    // 1) Create root container
    const root = document.createElement('div');
    root.className = 'ai-stylist-extension-root';
    element.appendChild(root);

    // 2) Create grid and cart container
    const gridAndCart = document.createElement('div');
    gridAndCart.className = 'grid-and-cart';
    root.appendChild(gridAndCart);

    // 3) Build stylist grid
    const grid = document.createElement('div');
    grid.className = 'stylist-grid';
    gridAndCart.appendChild(grid);

    // 4) Mini-cart and cart icon
    const miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    gridAndCart.appendChild(miniCart);

    const cartIcon = document.createElement('div');
    cartIcon.className = 'cart-icon';
    cartIcon.innerHTML = `
      <span class="cart-svg"> <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28"><g fill="#1a171b"><path d="M47.273 0h-6.544a.728.728 0 0 0-.712.58L38.63 7.219H.727a.727.727 0 0 0-.7.912l4.6 17.5c.006.021.019.037.026.059a.792.792 0 0 0 .042.094.747.747 0 0 0 .092.135.831.831 0 0 0 .065.068.626.626 0 0 0 .167.107.285.285 0 0 0 .045.029l13.106 5.145-5.754 2.184a4.382 4.382 0 1 0 .535 1.353l7.234-2.746 6.866 2.7A4.684 4.684 0 1 0 27.6 33.4l-5.39-2.113 13.613-5.164c.013-.006.021-.016.033-.021a.712.712 0 0 0 .188-.119.625.625 0 0 0 .063-.072.654.654 0 0 0 .095-.135.58.58 0 0 0 .04-.1.73.73 0 0 0 .033-.084l5.042-24.137h5.953a.728.728 0 0 0 0-1.455zM8.443 38.885a3.151 3.151 0 1 1 3.152-3.15 3.155 3.155 0 0 1-3.152 3.15zm23.1-6.3a3.151 3.151 0 1 1-3.143 3.149 3.155 3.155 0 0 1 3.148-3.152zM25.98 8.672l-.538 7.3H14.661l-.677-7.295zm-.645 8.75-.535 7.293h-9.328l-.672-7.293zM1.671 8.672h10.853l.677 7.3h-9.61zm2.3 8.75h9.362l.677 7.293H5.892zM20.2 30.5 9.175 26.17H31.6zm14.778-5.781h-8.722l.537-7.293h9.7zm1.822-8.752h-9.9l.537-7.295h10.889z"/><circle cx="8.443" cy="35.734" r=".728"/><circle cx="31.548" cy="35.734" r=".728"/></g></svg></span>
      <span class="cart-count">0</span>
    `;
    gridAndCart.appendChild(cartIcon);
    cartIcon.style.display = 'none';
    cartIcon.style.alignItems = 'center';
    cartIcon.style.cursor = 'pointer';
    cartIcon.style.position = 'absolute';
    cartIcon.style.right = '0';
    cartIcon.style.bottom = '0';
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

    // Inject CSS (if not already present)
    if (!document.getElementById('mini-cart-styles')) {
      const style = document.createElement('style');
      style.id = 'mini-cart-styles';
      style.textContent = `
        .mini-cart {
          position: absolute;
          right: 0;
          bottom: 0;
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
        .cart-icon { transition: box-shadow 0.2s; }
        .cart-icon:hover { box-shadow: 0 4px 16px rgba(68,127,118,0.15); }
      `;
      document.head.appendChild(style);
    }

    // Parse payload
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

    // Populate the grid with tiles and panels
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
          const prevFullPanel = root.querySelector('.full-width-panel');
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
          root.appendChild(panel);
        }
      });
      grid.appendChild(tile);
    });

    // 5) If we already have items in orderProductList, fill the mini-cart immediately.
    updateCartContents(miniCart, true);
    updateCartIcon(cartIcon);
    if (orderProductList.length > 0) {
      showMiniCartWithTimeout(miniCart, cartIcon);
    } else {
      miniCart.style.display = 'none';
      cartIcon.style.display = 'none';
    }
  },

  unmount: () => {
    // Remove the entire root container, taking the mini-cart with it.
    const root = document.querySelector('.ai-stylist-extension-root');
    if (root) root.remove();
    // Clear in-memory state if you want a fresh cart next time
    orderProductList.length = 0;
    if (miniCartTimeout) clearTimeout(miniCartTimeout);
  }
};