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
    const shopifyProductData = Array.isArray(payloadObj.shopifyProductData) ? payloadObj.shopifyProductData : [];

    // Styles
    const styles = `
      .ai-stylist-root { display: block !important; width: 288px !important; max-width: none !important; min-width: 0 !important; align-items: stretch !important; justify-content: stretch !important; font-family: Arial, sans-serif; box-sizing: border-box; padding: 0; }
      .stylist-grid { display: grid; grid-template-columns: repeat(2, 1fr); max-width: none !important; min-width: 0 !important; align-items: stretch !important; justify-content: stretch !important; gap: 10px; padding: 0; margin: 0; }
      .stylist-tile { background: none; border-radius: 0; overflow: hidden; cursor: pointer; transition: box-shadow .2s; display: flex; flex-direction: column; align-items: center; padding: 6px 2px 6px 2px; border: none; box-sizing: border-box; box-shadow: none; }
      .stylist-tile img { width: 90px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: transform 0.18s cubic-bezier(0.4,0,0.2,1); }
      .stylist-tile:hover img { transform: scale(1.07); }
      .stylist-tile .look-name { display: none; }
      .stylist-tile:hover { box-shadow: none; }
      .look-panel { background: #ededed; border-radius: 14px; padding: 18px 8px; width: 100%; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }
      .look-panel .back-btn { align-self: flex-start; background: #fff; color: #447f76; border: 1px solid #447f76; border-radius: 6px; padding: 6px 18px; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 16px; transition: background 0.2s, color 0.2s; }
      .look-panel .back-btn:hover { background: #447f76; color: #fff; }
      .look-panel .look-image { width: 80%; max-width: 180px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 14px; }
      .look-panel .look-title { font-size: 20px; font-weight: bold; margin-bottom: 12px; text-align: center; }
      .look-panel .keywords { font-size: 12px; color: #666; margin-bottom: 14px; text-align: center; }
      .look-panel .keywords span { display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 12px; margin: 2px 4px 2px 0; }
      .product-list-col { width: 100%; }
      .product-card { display: flex; align-items: center; background: #fff; border-radius: 8px; margin-bottom: 10px; padding: 8px 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); gap: 10px; }
      .product-thumb { width: 38px; height: 38px; object-fit: cover; border-radius: 6px; margin-right: 8px; }
      .product-info { flex: 1; }
      .product-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
      .product-price { color: #447f76; font-size: 13px; }
      @media (max-width: 400px) {
        .stylist-grid { grid-template-columns: 1fr; }
        .stylist-tile img { width: 100px; height: 130px; }
      }
    `;

    // Root
    element.innerHTML = `<style>${styles}</style><div class="ai-stylist-root"><div class="main-content"></div><div class="mini-cart-panel"></div></div>`;
    const root = element.querySelector('.ai-stylist-root');
    const mainContent = root.querySelector('.main-content');
    const miniCartPanel = root.querySelector('.mini-cart-panel');

    // --- State ---
    let currentLook = null;
    let orderProductList = [];

    function updateMiniCart() {
      if (orderProductList.length === 0) {
        miniCartPanel.innerHTML = '';
        miniCartPanel.style.display = 'none';
        return;
      }
      miniCartPanel.style.display = 'block';
      miniCartPanel.innerHTML = `
        <div style="background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 14px 12px; margin-top: 16px; width: 100%;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">Mini Cart</div>
          <div style="max-height: 120px; overflow-y: auto; margin-bottom: 10px;">
            ${orderProductList.map(item => `
              <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;'>
                <span style='font-size: 14px;'>${item.title}</span>
                <span style='font-size: 14px;'>Qty: ${item.quantity}</span>
              </div>
            `).join('')}
          </div>
          <button style="background: #447f76; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; font-size: 15px; font-weight: 500; cursor: pointer; width: 100%;">Checkout</button>
        </div>
      `;
    }

    function renderGrid() {
      mainContent.innerHTML = `<div class="stylist-grid"></div>`;
      const grid = mainContent.querySelector('.stylist-grid');
      recommendedStylingModels.forEach(model => {
        const tile = document.createElement('div');
        tile.className = 'stylist-tile';
        const imageUrl = model.Attachments && model.Attachments[0]?.url;
        tile.innerHTML = `
          <img src="${imageUrl}" alt="${model['Look Name']}" />
        `;
        tile.addEventListener('click', () => {
          currentLook = model;
          renderLookPanel();
        });
        grid.appendChild(tile);
      });
    }

    function renderLookPanel() {
      if (!currentLook) return;
      const imageUrl = currentLook.Attachments && currentLook.Attachments[0]?.url;
      const keywords = (currentLook.Keywords || '').split(',').map(k => k.trim()).filter(Boolean);
      // Find connected products
      const connectedTitles = (currentLook['Connected Products'] || '').split(',').map(t => t.trim()).filter(Boolean);
      const connectedProducts = shopifyProductData.filter(p => connectedTitles.includes(p.title));
      mainContent.innerHTML = `<div class="look-panel"></div>`;
      const panel = mainContent.querySelector('.look-panel');
      panel.innerHTML = `
        <button class="back-btn">← Back</button>
        <img src="${imageUrl}" alt="${currentLook['Look Name']}" class="look-image" />
        <div class="look-title">${currentLook['Look Name']}</div>
        <div class="product-list-col"></div>
      `;
      const productList = panel.querySelector('.product-list-col');
      connectedProducts.forEach(p => {
        const productImg = p.featuredMedia?.preview?.image?.url || 'https://via.placeholder.com/48';
        const price = p.variants?.edges?.[0]?.node?.price || 'N/A';
        const productUrl = p.onlineStorePreviewUrl || '#';
        productList.innerHTML += `
          <div class="product-card">
            <img src="${productImg}" class="product-thumb" />
            <div class="product-info">
              <div class="product-title">${p.title}</div>
              <div class="product-price">€${price}</div>
            </div>
            <div style="display: flex; gap: 8px; margin-left: auto;">
              <button class="add-to-cart-btn" data-variant-gid="${p.variants?.edges?.[0]?.node?.id || ''}" data-title="${p.title}">Add</button>
              <button class="view-product-btn" data-url="${productUrl}" style="background: #e0e0e0; color: #222; border: none; border-radius: 6px; padding: 6px 16px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; text-align: center; cursor: pointer;">View</button>
            </div>
          </div>
        `;
      });
      panel.querySelector('.back-btn').addEventListener('click', () => {
        currentLook = null;
        renderGrid();
      });
      // Add event listeners for Add buttons
      panel.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const variantGID = btn.getAttribute('data-variant-gid');
          const title = btn.getAttribute('data-title');
          if (!variantGID) return;
          const existing = orderProductList.find(item => item.variantGID === variantGID);
          if (existing) {
            existing.quantity += 1;
          } else {
            orderProductList.push({ variantGID, title, quantity: 1 });
          }
          // UI feedback: change button text to 'Added!' and disable briefly
          const originalText = btn.textContent;
          btn.textContent = 'Added!';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 1000);
          updateMiniCart();
        });
      });
      // Add event listeners for View buttons
      panel.querySelectorAll('.view-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const url = btn.getAttribute('data-url');
          if (url && url !== '#') {
            window.open(url, '_blank');
          }
        });
      });
      updateMiniCart();
    }

    // Initial render
    renderGrid();

    // Add styles for mini cart
    const miniCartStyles = `
      .mini-cart-panel { position: relative; z-index: 10; }
    `;
    if (!document.getElementById('mini-cart-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'mini-cart-styles';
      styleTag.innerHTML = miniCartStyles;
      document.head.appendChild(styleTag);
    }
  }
};