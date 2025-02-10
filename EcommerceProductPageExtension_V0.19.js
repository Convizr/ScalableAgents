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
      // If variants exist, use them; otherwise, use a fallback single variant
      let variantArray = [];
      if (variants && variants.edges && variants.edges.length > 0) {
        variantArray = variants.edges.map(edge => edge.node);
      } else {
        variantArray = [{
          title: title,
          price: "N/A"
        }];
      }
  
      // For each variant, calculate weight (from variant title if it includes a pattern like "123g" or default to "400g"),
      // servings (default to 16), and price per serving.
      const servings = 16;
      const variantBlocks = variantArray.map((v, index) => {
        const variantTitle = v.title || title;
        const price = v.price || "N/A";
        const weight = variantTitle.match(/\d+g/) ? variantTitle : "400g";
        const pricePerServing = (parseFloat(price) / servings).toFixed(2);
        
        return `
          <!-- Price Box Row for Variant ${index + 1} -->
          <div class="price-box" data-index="${index}">
            <input type="radio" name="priceSelection" class="price-radio" value="${index}" ${index === 0 ? "checked" : ""}>
            <div class="price-info">
              <div class="price-title">${weight} - €${price}</div>
              <div class="price-subtitle">${servings} servings (€${pricePerServing} per serving)</div>
            </div>
          </div>
          <!-- Variant Add Container Row for Variant ${index + 1} -->
          <div class="variant-add-container" data-index="${index}">
            <div class="variant-title">${variantTitle}</div>
            <div class="add-button">Add Me &#43;</div>
          </div>
        `;
      }).join("");
  
      // Render the overall layout
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
            ${variantBlocks}
          </div>
        </div>
      `;
    },
  };