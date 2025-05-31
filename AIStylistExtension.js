export const AIStylistExtension = {
    name: 'AIStylistExtension',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_ai_stylist' ||
      (trace.payload && trace.payload.name === 'ext_ai_stylist'),
    render: ({ trace, element }) => {
      console.log('Rendering AIStylistExtension');
  
      // 1. Parse incoming payload
      let payloadObj = {};
      if (trace.payload) {
        if (typeof trace.payload === 'string') {
          try {
            payloadObj = JSON.parse(trace.payload);
          } catch (e) {
            console.error('Error parsing AI stylist payload:', e);
          }
        } else {
          payloadObj = trace.payload;
        }
      }
  
      const recommendedStylingModels = Array.isArray(payloadObj.recommendedStylingModels) ? payloadObj.recommendedStylingModels : [];
      const shopifyProductData = payloadObj.shopifyProductData || {};
  
      // 2. Basic styles + container
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          .stylist-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(2, 1fr); /* 2 columns for most widget widths */
            margin: 20px 0;
          }
          .stylist-tile {
            border-radius: 5px;
            overflow: hidden;
            cursor: pointer;
            transition: box-shadow .2s;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
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
            background: #e9e9e9;
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
        </style>
        <div class="stylist-grid"></div>
      `;
      element.appendChild(container);
  
      const grid = container.querySelector('.stylist-grid');
      let activeTile = null;
  
      // 3. Render each model tile
      recommendedStylingModels.forEach((model) => {
        const tile = document.createElement('div');
        tile.classList.add('stylist-tile');
        tile.dataset.modelId = model['Model ID'];
  
        // Get the first attachment URL for the model image
        const imageUrl = model.Attachments && model.Attachments[0]?.url;
        tile.innerHTML = `<img src="${imageUrl}" alt="${model['Look Name']}" />`;
  
        // click to expand / show products
        tile.addEventListener('click', () => {
          // collapse previous
          if (activeTile && activeTile !== tile) {
            activeTile.classList.remove('active');
            const prevPanel = activeTile.querySelector('.product-panel');
            if (prevPanel) prevPanel.remove();
          }
  
          const isReopening = tile.classList.toggle('active');
          activeTile = isReopening ? tile : null;
  
          if (isReopening) {
            // build vertical panel: look image above, products below
            const panel = document.createElement('div');
            panel.classList.add('product-panel', 'vertical-panel');
  
            // Get connected products
            const products = shopifyProductData.allProducts || [];
            const connectedProductTitles = (model['Connected Products'] || '').split(', ').filter(Boolean);
            const connectedProducts = products.filter(p => connectedProductTitles.includes(p.title));
  
            // Build the HTML
            panel.innerHTML = `
              <img src="${imageUrl}" alt="${model['Look Name']}" class="look-image-large" />
              <div class="product-list-col">
                <h3>${model['Look Name']}</h3>
                <div class="keywords">
                  ${(model.Keywords || '').split(', ').map(keyword => 
                    `<span>${keyword}</span>`
                  ).join('')}
                </div>
                ${connectedProducts.map(p => `
                  <div class="product-card" data-product-title="${p.title}">
                    <img src="${p.thumb || 'https://via.placeholder.com/48'}" class="product-thumb" />
                    <div class="product-info">
                      <div class="product-title">${p.title}</div>
                      <div class="product-price">€${p.price || 'N/A'}</div>
                    </div>
                    <div class="product-actions">
                      <button data-action="add">Add</button>
                      <button data-action="view">View</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
  
            // wire buttons
            panel.querySelectorAll('.product-card').forEach(card => {
              const productTitle = card.dataset.productTitle;
              card.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', e => {
                  e.stopPropagation();
                  const action = btn.dataset.action;
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
  
            tile.appendChild(panel);
          }
        });
  
        grid.appendChild(tile);
      });
    }
  };