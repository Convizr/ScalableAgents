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
      console.error(
        "rawProductData variable was not expanded into actual JSON data. Please check your Voiceflow configuration."
      );
      element.innerHTML = "<p>Error: rawProductData not provided.</p>";
      return;
    }

    // Ensure ShopifyProductData is an array with at least one product
    if (!Array.isArray(payloadObj.ShopifyProductData) || payloadObj.ShopifyProductData.length === 0) {
      element.innerHTML = "<p>Error: No valid product data found.</p>";
      return;
    }

    // NEW: Read the SelectedProduct variable and choose the matching product (if available)
    const selectedProductTitle = payloadObj.SelectedProduct || "";
    let productData;
    if (selectedProductTitle) {
      productData = payloadObj.ShopifyProductData.find(
        (product) => product.title === selectedProductTitle
      );
    }
    if (!productData) {
      productData = payloadObj.ShopifyProductData[0];
    }

    if (!productData) {
      element.innerHTML = "<p>Product data not found.</p>";
      return;
    }

    /**
     * 1) Extract the video URL using preferredUrl if it exists, 
     *    otherwise fall back to the original 1080p search.
     */
    const videoNode = productData.media.nodes.find((node) => node.filename?.endsWith(".mp4"));
    let videoUrl = "";
    if (videoNode) {
      videoUrl =
        videoNode.preferredUrl ||
        videoNode.sources?.find((src) => src.url.includes("1080p"))?.url ||
        "";
    }

    /**
     * 2) Extract up to two *image* nodes. We specifically check for node.image?.url 
     *    to avoid including the video node. If preferredUrl is present, use that; 
     *    otherwise, use node.image.url.
     */
    const images = productData.media.nodes
      .filter((node) => node.image?.url)  // <-- Only real images
      .map((node) => node.preferredUrl || node.image.url)
      .slice(0, 2);

    // 3) Extract product details
    const { title, description, variants } = productData;

    // Build variantArray: if variants exist, map them; otherwise use a fallback array.
    let variantArray = [];
    if (variants && variants.edges && variants.edges.length > 0) {
      variantArray = variants.edges.map((edge) => edge.node);
    } else {
      variantArray = [
        {
          title: title,
          price: "N/A",
          id: "",
        },
      ];
    }

    // Use the first variant for fallback values
    const variantFallback = variantArray[0];
    const fallbackPrice = variantFallback.price || "N/A";
    const fallbackVariantTitle = variantFallback.title || title;
    const weight = fallbackVariantTitle.match(/\d+g/) ? fallbackVariantTitle : "400g";
    const servings = 16; // Placeholder value
    const pricePerServing = (parseFloat(fallbackPrice) / servings).toFixed(2);

    // Helper function to render each variant block (price box and variant add container)
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
              <input type="radio" name="priceSelection" class="price-radio" value="${index}" ${
                index === 0 ? "checked" : ""
              }>
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

    // 4) Render the product page layout.
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
            ${images.map((img) => `<img src="${img}" alt="Product Image">`).join("")}
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

    // --- Attach Modal Pop-up Functionality ---
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

    // Attach pop-up events for images and video
    const imageEls = element.querySelectorAll('.image-column img');
    imageEls.forEach((img) => {
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

    // Attach event listeners to each add-button so that clicking sends a complete payload.
    const addButtons = element.querySelectorAll('.add-button');
    addButtons.forEach((button) => {
      button.addEventListener('click', () => {
        // Find the closest variant-add-container and get its data-index.
        const containerEl = button.closest('.variant-add-container');
        const index = containerEl.getAttribute('data-index');
        const variantObj = variantArray[index];

        const completePayload = {
          productTitle: title,
          productPrice: variantObj.price || "N/A",
          variantID: variantObj.id || "",
          variantTitle: variantObj.title || title,
          quantity: 1
        };

        console.log("Submitting complete payload:", completePayload);
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: completePayload
        });
      });
    });
  },
};