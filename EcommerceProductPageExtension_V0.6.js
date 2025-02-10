export const ProductPageExtension = {
    name: "ProductPage",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_ProductPage" ||
      (trace.payload && trace.payload.name === "Custom_ProductPage"),
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
  
      // Ensure ShopifyProductData is an array with at least one product
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
  
      // Extract video URL: find the first node with a filename ending with ".mp4"
      // and then a source URL that includes "1080p"
      const videoNode = productData.media.nodes.find(node => node.filename?.endsWith(".mp4"));
      const videoUrl =
        videoNode?.sources.find(src => src.url.includes("1080p"))?.url || "";
  
      // Extract images from media nodes (filter nodes with image.url)  
      // For this layout we need two images.
      const images = productData.media.nodes
        .filter(node => node.image?.url)
        .map(node => node.image.url)
        .slice(0, 2);
  
      // Extract product details
      const { title, description, variants } = productData;
      const price = variants.edges[0]?.node.price || "N/A";
  
      // Build the product page layout with custom styling:
      // - Video is autoplay, looped and muted.
      // - The media section is a row: video on the left, images on the right.
      // - The image column is 300px tall (same as the video) with two images
      //   each 145px tall and a 10px gap between them.
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
            flex-direction: row;
            gap: 20px;
          }
          video {
            width: 400px;
            height: 300px;
            border-radius: 8px;
            object-fit: cover;
          }
          .image-column {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 300px; /* same as video height */
            gap: 10px;
          }
          .image-column img {
            width: 190px;
            height: 145px;
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
            <video autoplay loop muted>
              <source src="${videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <div class="image-column">
              ${images
                .map(
                  (img) =>
                    `<img src="${img}" alt="Product Image">`
                )
                .join("")}
            </div>
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