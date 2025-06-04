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
      .ai-stylist-root { display: block !important; width: 100% !important; max-width: none !important; min-width: 0 !important; align-items: stretch !important; justify-content: stretch !important; font-family: Arial, sans-serif; box-sizing: border-box; padding: 0; }
      .stylist-grid { display: grid; grid-template-columns: repeat(2, 1fr); max-width: none !important; min-width: 0 !important; align-items: stretch !important; justify-content: stretch !important; gap: 10px; padding: 0; margin: 0; }
      .stylist-tile { background: none; border-radius: 0; overflow: hidden; cursor: pointer; transition: box-shadow .2s; display: flex; flex-direction: column; align-items: center; padding: 6px 2px 6px 2px; border: none; box-sizing: border-box; box-shadow: none; }
      .stylist-tile img { width: 90px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
      .stylist-tile .look-name { display: none; }
      .stylist-tile:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
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
    element.innerHTML = `<style>${styles}</style><div class="ai-stylist-root"></div>`;
    const root = element.querySelector('.ai-stylist-root');

    // --- State ---
    let currentLook = null;

    function renderGrid() {
      root.innerHTML = `<div class="stylist-grid"></div>`;
      const grid = root.querySelector('.stylist-grid');
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
      root.innerHTML = `<div class="look-panel"></div>`;
      const panel = root.querySelector('.look-panel');
      panel.innerHTML = `
        <button class="back-btn">← Back</button>
        <img src="${imageUrl}" alt="${currentLook['Look Name']}" class="look-image" />
        <div class="look-title">${currentLook['Look Name']}</div>
        <div class="keywords">${keywords.map(k => `<span>${k}</span>`).join('')}</div>
        <div class="product-list-col"></div>
      `;
      const productList = panel.querySelector('.product-list-col');
      connectedProducts.forEach(p => {
        const productImg = p.featuredMedia?.preview?.image?.url || 'https://via.placeholder.com/48';
        const price = p.variants?.edges?.[0]?.node?.price || 'N/A';
        productList.innerHTML += `
          <div class="product-card">
            <img src="${productImg}" class="product-thumb" />
            <div class="product-info">
              <div class="product-title">${p.title}</div>
              <div class="product-price">€${price}</div>
            </div>
          </div>
        `;
      });
      panel.querySelector('.back-btn').addEventListener('click', () => {
        currentLook = null;
        renderGrid();
      });
    }

    // Initial render
    renderGrid();
  }
};