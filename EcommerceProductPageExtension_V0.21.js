export const ProductPageExtension = {
    name: "ProductPage",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_ProductPage" ||
      (trace.payload && trace.payload.name === "Custom_ProductPage"),
    render: ({ trace, element }) => {
      console.log("Raw Payload:", trace.payload);
  
      let payloadObj;
      if (typeof trace.payload === "string") {
        try {
          payloadObj = JSON.parse(trace.payload);
        } catch (e) {
          console.error("Error parsing trace.payload:", e, "Raw payload:", trace.payload);
          return;
        }
      } else {
        payloadObj = trace.payload || {};
      }
      console.log("Parsed Payload:", payloadObj);
  
      // Check if ShopifyProductData is still a placeholder
      if (
        typeof payloadObj.ShopifyProductData === "string" &&
        payloadObj.ShopifyProductData.trim() === "{rawProductData}"
      ) {
        console.error("rawProductData variable was not expanded into actual JSON data. Please check your Voiceflow configuration.");
        element.innerHTML = "<p>Error: rawProductData not provided.</p>";
        return;
      }
  
      // Ensure ShopifyProductData is an array with at least one product
      if (!Array.isArray(payloadObj.ShopifyProductData) || payloadObj.ShopifyProductData.length === 0) {
        element.innerHTML = "<p>Error: No valid product data found.</p>";
        return;
      }
  
      const productData = payloadObj.ShopifyProductData[0];
      if (!productData) {
        element.innerHTML = "<p>Product data not found.</p>";
        return;
      }
  
      // Extract video URL (first .mp4 with "1080p" in its URL)
      const videoNode = productData.media.nodes.find(node => node.filename?.endsWith(".mp4"));
      const videoUrl = videoNode?.sources.find(src => src.url.includes("1080p"))?.url || "";
  
      // Extract up to two images from the media nodes
      const images = productData.media.nodes
        .filter(node => node.image?.url)
        .map(node => node.image.url)
        .slice(0, 2);
  
      // Extract product details
      const { title, description, variants } = productData;
  
      // Build variantArray: if variants exist, map them into an array; else create a fallback array.
      let variantArray = [];
      if (variants && variants.edges && variants.edges.length > 0) {
        variantArray = variants.edges.map(edge => edge.node);
      } else {
        variantArray = [{
          title: title,
          price: "N/A"
        }];
      }
  
      // Use the first variant for some fallback values (if needed)
      const variantFallback = variantArray[0];
      const price = variantFallback.price || "N/A";
      // Use the variant title if available; otherwise, fall back to product title.
      const variantTitle = variantFallback.title || title;
      // Determine weight from variant title (if it contains a pattern like "123g") or default to "400g"
      const weight = variantTitle.match(/\d+g/) ? variantTitle : "400g";
      const servings = 16; // Placeholder value
      const pricePerServing = (parseFloat(price) / servings).toFixed(2);
  
      // Helper function to render each variant block (price box + variant add container)
      function variantArrayToHTML(variants) {
        return variants
          .map((v, index) => {
            const vTitle = v.title || title;
            const vPrice = v.price || "N/A";
            const vWeight = vTitle.match(/\d+g/) ? vTitle : "400g";
            const vPricePerServing = (parseFloat(vPrice) / servings).toFixed(2);
            return `
              <!-- Price Box for Variant ${index + 1} -->
              <div class="price-box" data-index="${index}">
                <input type="radio" name="priceSelection" class="price-radio" value="${index}" ${index === 0 ? "checked" : ""}>
                <div class="price-info">
                  <div class="price-title">${vWeight} - €${vPrice}</div>
                  <div class="price-subtitle">${servings} servings (€${vPricePerServing} per serving)</div>
                </div>
              </div>
              <!-- Variant Add Container for Variant ${index + 1} -->
              <div class="variant-add-container" data-index="${index}">
                <div class="variant-title">${vTitle}</div>
                <div class="add-button">Add Me &#43;</div>
              </div>
            `;
          })
          .join("");
      }
  
      // Render the product page layout.
      element.innerHTML = `
        <style>
          .product-container {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
          }
          .media-section {
            display: flex;
            flex-direction: row;
            gap: 10px;
            width: 400px;
          }
          .video-container {
            width: 400px;
            height: 300px;
          }
          video {
            width: 100%;
            height: 100%;
            border-radius: 8px;
            object-fit: cover;
          }
          .image-column {
            width: 190px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 300px;
            gap: 10px;
          }
          .image-column img {
            width: 100%;
            height: 145px;
            object-fit: cover;
            border-radius: 8px;
          }
          .details-section {
            width: 200px;
            padding: 10px;
          }
          .product-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .product-description {
            font-size: 14px;
            color: #555;
            margin-bottom: 15px;
          }
          /* Price Box styling */
          .price-box {
            display: flex;
            align-items: center;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 5px;
            margin-bottom: 5px;
            transition: background 0.3s;
          }
          .price-box:hover {
            background: #f0f0f0;
          }
          .price-radio {
            margin-right: 10px;
            transform: scale(1.2);
          }
          .price-info {
            display: flex;
            flex-direction: column;
          }
          .price-title {
            font-size: 13px;
            font-weight: bold;
            color: black;
          }
          .price-subtitle {
            font-size: 9px;
            color: gray;
          }
          /* Variant Add Container styling */
          .variant-add-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 5px;
            margin-bottom: 10px;
            transition: background 0.3s;
          }
          .variant-add-container:hover {
            background: #f9f9f9;
          }
          .variant-title {
            font-size: 12px;
            font-weight: bold;
            color: black;
          }
          .add-button {
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.3s;
            padding: 5px;
            color: black;
          }
          .add-button:hover {
            color: orange;
          }
          /* Modal styles for pop-ups */
          .modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
          }
          .modal-content img,
          .modal-content video {
            width: 100%;
            height: auto;
            border-radius: 8px;
          }
          .modal-close {
            position: absolute;
            top: 10px; right: 10px;
            background: #fff;
            border: none;
            font-size: 24px;
            cursor: pointer;
            border-radius: 50%;
            padding: 0 8px;
          }
        </style>
    
        <div class="product-container">
          <div class="media-section">
            <div class="video-container">
              <video autoplay loop muted>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
            <div class="image-column">
              ${images.map(img => `<img src="${img}" alt="Product Image">`).join("")}
            </div>
          </div>
          <div class="details-section">
            <div class="product-title">${title}</div>
            <div class="product-description">
              ${description.replace(/;/g, "\n• ")}
            </div>
            ${variantArrayToHTML(variantArray)}
          </div>
        </div>
      `;
  
      // Modal functionality for images and video pop-ups
      function openModal(contentHTML) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = contentHTML;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            document.body.removeChild(overlay);
          }
        });
        content.appendChild(closeBtn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
      }
    
      // Attach pop-up events to images and video
      const imageEls = element.querySelectorAll('.image-column img');
      imageEls.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          openModal(`<img src="${img.src}" alt="Product Image">`);
        });
      });
      const videoEl = element.querySelector('.video-container video');
      if (videoEl) {
        videoEl.style.cursor = 'pointer';
        videoEl.addEventListener('click', () => {
          openModal(`<video src="${videoUrl}" autoplay loop muted controls></video>`);
        });
      }
    },
  };