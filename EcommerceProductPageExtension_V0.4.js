export const ProductPageExtension = {
    name: "ProductPage",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_ProductPage" || trace.payload.name === "Custom_ProductPage",
    render: ({ trace, element }) => {
      console.log("Raw Payload:", trace.payload); // Debugging
  
      let payloadObj;
  
      // Ensure correct payload parsing
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
  
      // Ensure the payload is an array
      if (!Array.isArray(payloadObj.ShopifyProductData) || payloadObj.ShopifyProductData.length === 0) {
        element.innerHTML = "<p>Error: No valid product data found.</p>";
        return;
      }
  
      // Extract first product from the array
      const productData = payloadObj.ShopifyProductData[0];
  
      if (!productData) {
        element.innerHTML = "<p>Product data not found.</p>";
        return;
      }
  
      // Extract video (first 1080p MP4 found)
      const videoNode = productData.media.nodes.find(node => node.filename?.endsWith(".mp4"));
      const videoUrl = videoNode?.sources.find(src => src.url.includes("1080p"))?.url || "";
  
      // Extract first two images
      const images = productData.media.nodes
        .filter(node => node.image?.url)
        .map(node => node.image.url)
        .slice(0, 2);
  
      // Extract product details
      const { title, description, variants } = productData;
      const price = variants.edges[0]?.node.price || "N/A";
  
      // Render the product page
      element.innerHTML = `
        <style>
          .product-container {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            font-family: Arial, sans-serif;
          }
          .media-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          video {
            width: 400px;
            border-radius: 8px;
          }
          img {
            width: 190px;
            height: 190px;
            object-fit: cover;
            border-radius: 8px;
          }
          .details-section {
            max-width: 300px;
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
          }
        </style>
  
        <div class="product-container">
          <div class="media-section">
            <video controls>
              <source src="${videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            ${images.map(img => `<img src="${img}" alt="Product Image">`).join("")}
          </div>
          <div class="details-section">
            <div class="product-title">${title}</div>
            <div class="product-description">${description}</div>
            <div class="product-price">€${price}</div>
          </div>
        </div>
      `;
    },
  };