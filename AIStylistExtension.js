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
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            margin: 20px 0;
          }
          .stylist-tile {
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: transform .2s;
          }
          .stylist-tile img {
            width: 100%;
            display: block;
            border-radius: 6px;
          }
          .stylist-tile.active {
            transform: scale(1.03);
            z-index: 2;
          }
          .product-panel {
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            max-height: 100%;
            background: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 16px;
            overflow-y: auto;
            border-radius: 0 6px 6px 0;
          }
          .product-card {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 6px;
            background: #f8f8f8;
          }
          .product-card .info {
            flex: 1;
            font-size: 14px;
          }
          .product-card .info .title {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .product-card .info .vendor {
            color: #666;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .product-card .info .variants {
            color: #888;
            font-size: 12px;
          }
          .product-card button {
            margin-left: 8px;
            padding: 6px 12px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            background: #447f76;
            color: #fff;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .product-card button:hover {
            background: #35635c;
          }
          .look-info {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee;
          }
          .look-info h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
          }
          .look-info .keywords {
            font-size: 12px;
            color: #666;
            margin-top: 8px;
          }
          .look-info .keywords span {
            display: inline-block;
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 12px;
            margin: 2px;
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
            // build side-panel
            const panel = document.createElement('div');
            panel.classList.add('product-panel');
            
            // Add look information
            panel.innerHTML = `
              <div class="look-info">
                <h3>${model['Look Name']}</h3>
                <div class="keywords">
                  ${model.Keywords.split(', ').map(keyword => 
                    `<span>${keyword}</span>`
                  ).join('')}
                </div>
              </div>
            `;
            
            // Get products from shopifyProductData
            const products = shopifyProductData.allProducts || [];
            const connectedProductTitles = model['Connected Products'].split(', ');
            
            // Filter products that are connected to this look
            const connectedProducts = products.filter(p => 
              connectedProductTitles.includes(p.title)
            );
            
            // Add product cards
            panel.innerHTML += connectedProducts
              .map(p => `
                <div class="product-card" data-product-title="${p.title}">
                  <div class="info">
                    <div class="title">${p.title}</div>
                    <div class="vendor">${p.vendor}</div>
                    <div class="variants">${p.variants.join(', ')}</div>
                  </div>
                  <button data-action="add">Add</button>
                  <button data-action="view">View</button>
                </div>
              `)
              .join('');
  
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