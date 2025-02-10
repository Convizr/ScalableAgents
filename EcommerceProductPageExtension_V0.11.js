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
      const price = variants.edges[0]?.node.price || "N/A";
  
      // Render the product page layout:
      // - Outer container: fixed max-width (600px) so that the overall widget doesn't get too wide.
      // - Media section: a video (autoplay, loop, muted) on the left and a column of images on the right.
      // - Details section: fixed width (here set to 200px) for the text.
      // - The description text: semicolons are replaced by a newline and a bullet.
      // - Variant/Add button: shows the variant title (if available) or the product title,
      //   with a clickable "Add Me +" area on the right.
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
            white-space: pre-wrap;
          }
          .product-price {
            font-size: 18px;
            font-weight: bold;
            color: #2e6ee1;
            margin-bottom: 15px;
          }
          /* Variant/Add button styles */
          .variant-add-container {
            margin-top: 10px;
            display: flex;
            align-items: center;
            border: 1px solid #ccc;
            border-radius: 8px;
            overflow: hidden;
          }
          .variant-title {
            flex: 1;
            padding: 10px;
            background: #f5f5f5;
            font-size: 16px;
          }
          .add-button {
            padding: 10px 15px;
            background: transparent;
            border-left: 1px solid #ccc;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          .add-button:hover {
            background: orange;
            color: white;
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
            <div class="product-price">€${price}</div>
            <div class="variant-add-container">
              <div class="variant-title">
                ${variants && variants.edges && variants.edges[0] && variants.edges[0].node.title
                  ? variants.edges[0].node.title
                  : title}
              </div>
              <div class="add-button">
                Add Me &#43;
              </div>
            </div>
          </div>
        </div>
      `;
    },
  };