// --- Helper variables and functions ---
const orderProductList = [];
let miniCartTimeout = null;
// isChatOpen will now be a global window.isChatOpen, set by the main website script
// Initialize it here as a fallback, but the main page should control it.
if (typeof window.isChatOpen === 'undefined') {
  window.isChatOpen = true;
}

function updateMiniCartPosition() {
  const miniCart = document.querySelector('.mini-cart');
  if (!miniCart) return;
  const isMobile = window.innerWidth <= 600;
  miniCart.style.top = ''; // Clear top, using bottom for positioning
  miniCart.style.right = ''; // Clear right, will be set based on state

  // Use window.isChatOpen now
  if (window.isChatOpen) {
    miniCart.style.right = isMobile ? '20px' : '425px';
    miniCart.style.bottom = '75px';
  } else {
    // This state is for when chat is minimized, cart should be hidden by main page listener,
    // but if shown, position it above the bubble.
    miniCart.style.right = '20px';
    miniCart.style.bottom = '100px';
  }
}

function updateCartContents(miniCart, show = false) {
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

  // Show mini-cart for 5 seconds if requested
  if (show) {
    miniCart.style.display = '';
    if (miniCartTimeout) clearTimeout(miniCartTimeout);
    miniCartTimeout = setTimeout(() => {
      miniCart.style.display = 'none';
    }, 5000);
  }
}

function updateCartIcon(cartIcon) {
  const totalItems = orderProductList.reduce((sum, i) => sum + i.quantity, 0);
  cartIcon.querySelector('.cart-count').textContent = totalItems;
  cartIcon.style.display = totalItems > 0 ? 'flex' : 'none';
}

function addItemToOrderList(variantGID, title, price, imageUrl, root) {
  const existing = orderProductList.find(i => i.variantGID === variantGID);
  if (existing) {
    existing.quantity += 1;
  } else {
    orderProductList.push({ variantGID, quantity: 1, title, price, imageUrl });
  }
  // Update mini-cart and icon in the extension DOM
  const miniCart = root.querySelector('.mini-cart');
  const cartIcon = root.querySelector('.cart-icon-btn');
  if (miniCart) updateCartContents(miniCart, true);
  if (cartIcon) updateCartIcon(cartIcon);
}

window.addItemToOrderList = addItemToOrderList;

// --- The extension object ---
export const AIStylistExtension = {
  name: 'AIStylistExtension',
  type: 'response',
  match: ({ trace }) => {
    return trace.type === 'ext_ai_stylist' ||
      (trace.payload && trace.payload.name === 'ext_ai_stylist');
  },
  render: ({ trace, element }) => {
    // Remove any previous root
    const oldRoot = element.querySelector('.ai-stylist-extension-root');
    if (oldRoot) oldRoot.remove();

    // 1) Create one root container inside the provided element
    const root = document.createElement('div');
    root.className = 'ai-stylist-extension-root';
    element.appendChild(root);

    // 2) Create a child that will hold both the grid and the mini-cart
    const gridAndCart = document.createElement('div');
    gridAndCart.className = 'grid-and-cart';
    root.appendChild(gridAndCart);

    // 3) Build your stylist grid under gridAndCart
    const grid = document.createElement('div');
    grid.className = 'stylist-grid';
    gridAndCart.appendChild(grid);

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

    // 4) Create the mini-cart container as a sibling of "grid" inside gridAndCart
    const miniCart = document.createElement('div');
    miniCart.className = 'mini-cart';
    miniCart.style.display = 'none';
    gridAndCart.appendChild(miniCart);

    // 5) Create the cart icon button (hidden if cart is empty)
    const cartIcon = document.createElement('button');
    cartIcon.className = 'cart-icon-btn';
    cartIcon.style.display = 'none';
    cartIcon.innerHTML = `
      <span class="cart-svg">${`
        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"28\"><g fill=\"#1a171b\"><path d=\"M31.5 0h-4.3a.48.48 0 0 0-.47.38l-.27 4.3H.48a.48.48 0 0 0-.46.6l3 11.1c.004.014.012.024.017.038a.52.52 0 0 0 .027.06.48.48 0 0 0 .06.086.54.54 0 0 0 .042.043.41.41 0 0 0 .11.067.19.19 0 0 0 .03.018l8.3 3.26-3.64 1.38a2.77 2.77 0 1 0 .34.86l4.58-1.74 4.35 1.71a2.96 2.96 0 1 0 .34-.86l-3.42-1.34 8.63-3.28a.04.04 0 0 0 .02-.013.47.47 0 0 0 .12-.075.41.41 0 0 0 .04-.045.43.43 0 0 0 .06-.086.38.38 0 0 0 .025-.062.48.48 0 0 0 .02-.053l3.2-15.4h3.78a.48.48 0 0 0 0-.96zM5.63 26.1a1.99 1.99 0 1 1 1.99-1.99 1.99 1.99 0 0 1-1.99 1.99zm14.6-3.98a1.99 1.99 0 1 1-1.99 1.99 1.99 1.99 0 0 1 1.99-1.99zM17.1 5.6l-.34 4.6H9.36l-.43-4.6zm-.41 5.52-.34 4.6H9.98l-.43-4.6zM1.06 5.6h6.97l.43 4.6H2.1zm1.48 5.52h6.99l.43 4.6H3.47zM13.1 19.4l-7.01-2.75h14.01zm9.36-3.58h-5.6l.34-4.6h6.23zm1.17-5.52h-6.32l.34-4.6h6.96z\"/><circle cx=\"5.63\" cy=\"24.11\" r=\".48\"/><circle cx=\"20.23\" cy=\"24.11\" r=\".48\"/></g></svg>
      `}</span>
      <span class="cart-count">0</span>
    `;
    cartIcon.style.position = 'absolute';
    cartIcon.style.right = '0';
    cartIcon.style.top = '0';
    cartIcon.style.background = 'none';
    cartIcon.style.border = 'none';
    cartIcon.style.cursor = 'pointer';
    cartIcon.style.alignItems = 'center';
    cartIcon.style.justifyContent = 'center';
    cartIcon.style.display = 'none';
    cartIcon.style.zIndex = '1001';
    cartIcon.style.padding = '0 8px';
    cartIcon.style.height = '40px';
    cartIcon.style.fontSize = '18px';
    cartIcon.style.lineHeight = '40px';
    cartIcon.style.minWidth = '40px';
    cartIcon.querySelector('.cart-count').style.marginLeft = '4px';
    gridAndCart.appendChild(cartIcon);

    // Cart icon click: show mini-cart for 5 seconds
    cartIcon.addEventListener('click', () => {
      miniCart.style.display = '';
      if (miniCartTimeout) clearTimeout(miniCartTimeout);
      miniCartTimeout = setTimeout(() => {
        miniCart.style.display = 'none';
      }, 5000);
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
        .cart-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          position: absolute;
          right: 0;
          top: 0;
          z-index: 1001;
        }
        .cart-svg {
          display: flex;
          align-items: center;
        }
        .cart-count {
          background: #447f76;
          color: #fff;
          border-radius: 50%;
          padding: 2px 7px;
          font-size: 13px;
          margin-left: 4px;
          min-width: 22px;
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }

    // 6) Build the grid and wire up add buttons
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
            <button class="cart-icon-btn" style="margin-left: 8px; position: relative;">
              <span class="cart-svg">${`
                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"28\"><g fill=\"#1a171b\"><path d=\"M31.5 0h-4.3a.48.48 0 0 0-.47.38l-.27 4.3H.48a.48.48 0 0 0-.46.6l3 11.1c.004.014.012.024.017.038a.52.52 0 0 0 .027.06.48.48 0 0 0 .06.086.54.54 0 0 0 .042.043.41.41 0 0 0 .11.067.19.19 0 0 0 .03.018l8.3 3.26-3.64 1.38a2.77 2.77 0 1 0 .34.86l4.58-1.74 4.35 1.71a2.96 2.96 0 1 0 .34-.86l-3.42-1.34 8.63-3.28a.04.04 0 0 0 .02-.013.47.47 0 0 0 .12-.075.41.41 0 0 0 .04-.045.43.43 0 0 0 .06-.086.38.38 0 0 0 .025-.062.48.48 0 0 0 .02-.053l3.2-15.4h3.78a.48.48 0 0 0 0-.96zM5.63 26.1a1.99 1.99 0 1 1 1.99-1.99 1.99 1.99 0 0 1-1.99 1.99zm14.6-3.98a1.99 1.99 0 1 1-1.99 1.99 1.99 1.99 0 0 1 1.99-1.99zM17.1 5.6l-.34 4.6H9.36l-.43-4.6zm-.41 5.52-.34 4.6H9.98l-.43-4.6zM1.06 5.6h6.97l.43 4.6H2.1zm1.48 5.52h6.99l.43 4.6H3.47zM13.1 19.4l-7.01-2.75h14.01zm9.36-3.58h-5.6l.34-4.6h6.23zm1.17-5.52h-6.32l.34-4.6h6.96z\"/><circle cx=\"5.63\" cy=\"24.11\" r=\".48\"/><circle cx=\"20.23\" cy=\"24.11\" r=\".48\"/></g></svg>
              `}</span>
              <span class="cart-count">${orderProductList.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </button>
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
          // Back button logic
          const backBtn = panel.querySelector('.back-btn');
          backBtn.addEventListener('click', () => {
            panel.remove();
            grid.style.display = '';
            if (activeTile) activeTile.classList.remove('active');
            activeTile = null;
          });
          // Cart icon in panel
          const panelCartIcon = panel.querySelector('.cart-icon-btn');
          if (panelCartIcon) {
            panelCartIcon.addEventListener('click', () => {
              miniCart.style.display = '';
              if (miniCartTimeout) clearTimeout(miniCartTimeout);
              miniCartTimeout = setTimeout(() => {
                miniCart.style.display = 'none';
              }, 5000);
            });
            updateCartIcon(cartIcon);
          }
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
                    root
                  );
                  // Show mini-cart for 5 seconds
                  miniCart.style.display = '';
                  if (miniCartTimeout) clearTimeout(miniCartTimeout);
                  miniCartTimeout = setTimeout(() => {
                    miniCart.style.display = 'none';
                  }, 5000);
                  updateCartIcon(cartIcon);
                  if (panelCartIcon) updateCartIcon(panelCartIcon);
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

    // 7) Fill the mini-cart and cart icon immediately
    updateCartContents(miniCart);
    updateCartIcon(cartIcon);
  },

  unmount: () => {
    // Remove the entire root container, taking the mini-cart with it.
    const root = document.querySelector('.ai-stylist-extension-root');
    if (root) root.remove();
    orderProductList.length = 0;
    if (miniCartTimeout) clearTimeout(miniCartTimeout);
  }
};