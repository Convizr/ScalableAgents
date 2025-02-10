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
  
      if (!Array.isArray(payloadObj.ShopifyProductData) || payloadObj.ShopifyProductData.length === 0) {
        element.innerHTML = "<p>Error: No valid product data found.</p>";
        return;
      }
  
      const productData = payloadObj.ShopifyProductData[0];
      if (!productData) {
        element.innerHTML = "<p>Product data not found.</p>";
        return;
      }
  
      const videoNode = productData.media.nodes.find(node => node.filename?.endsWith(".mp4"));
      const videoUrl = videoNode?.sources.find(src => src.url.includes("1080p"))?.url || "";
  
      const images = productData.media.nodes
        .filter(node => node.image?.url)
        .map(node => node.image.url)
        .slice(0, 2);
  
      const { title, description, variants } = productData;
      const variant = variants.edges[0]?.node || {};
      const price = variant.price || "N/A";
      const variantTitle = variant.title || title;
      const weight = variantTitle.match(/\d+g/) ? variantTitle : "400g"; // Defaulting to 400g if weight is unclear
      const servings = 16; // Placeholder: Adjust based on actual product data if available
      const pricePerServing = (parseFloat(price) / servings).toFixed(2);
  
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
            max-width: 100%;
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
          .product-price {
            font-size: 18px;
            font-weight: bold;
            color: #2e6ee1;
            margin-bottom: 15px;
          }
          /* Variant selection box */
          .variant-box {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            transition: border-color 0.3s ease;
          }
          .variant-box:hover {
            border-color: #2e6ee1;
          }
          .variant-radio {
            margin-right: 10px;
            transform: scale(1.2);
          }
          .variant-info {
            display: flex;
            flex-direction: column;
          }
          .variant-title {
            font-size: 16px;
            font-weight: bold;
            color: black;
          }
          .variant-subtitle {
            font-size: 14px;
            color: gray;
          }
          .add-button {
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: #2e6ee1;
            color: white;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
          }
          .add-button:hover {
            background: #1a4bbd;
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
            <div class="product-description">${description}</div>
            <div class="product-price">€${price}</div>
  
            <!-- Variant Selection Box -->
            <div class="variant-box">
              <input type="radio" name="variant" class="variant-radio" checked>
              <div class="variant-info">
                <div class="variant-title">${weight} - €${price}</div>
                <div class="variant-subtitle">${servings} porties (€${pricePerServing}/per portie)</div>
              </div>
            </div>
  
            <!-- Add to Cart Button -->
            <div class="add-button">Voeg toe</div>
          </div>
        </div>
      `;
    },
  };