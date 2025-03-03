export const OrdersCarouselExtension = {
    name: "OrdersCarousel", 
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_OrdersCarousel" ||
      (trace.payload && trace.payload.name === "Custom_OrdersCarousel"),
  
    render: ({ trace, element }) => {
      // ------------------------------------------
      // 1) PARSE PAYLOAD DATA
      // ------------------------------------------
      const payload = trace.payload || {};
      
      // Parse the input data from payload
      const orderNumbers = payload.orderNumber ? payload.orderNumber.split(', ') : [];
      const orderIDs = payload.orderID ? payload.orderID.split(', ') : [];
      const extractReturnDays = payload.maxReturnDays ? parseInt(payload.maxReturnDays, 10) : 14; // Default to 14 days if not provided
      const returnDates = payload.returnDate ? payload.returnDate.split(', ') : [];
      
      // Parse products and quantities (separated by | between orders and , within orders)
      const orderProductsArray = payload.orderedProductTitles ? payload.orderedProductTitles.split(' | ') : [];
      const orderQuantitiesArray = payload.orderedQuantity ? payload.orderedQuantity.split(' | ') : [];
      
      // Parse raw product data
      const rawProductData = payload.rawProductData ? JSON.parse(payload.rawProductData) : [];
      
      // Build orders array from payload data
      const orders = [];
      
      for (let i = 0; i < orderNumbers.length; i++) {
        const orderProducts = orderProductsArray[i] ? orderProductsArray[i].split(', ') : [];
        const orderQuantities = orderQuantitiesArray[i] ? orderQuantitiesArray[i].split(', ').map(q => parseInt(q, 10)) : [];
        
        // Calculate max return date based on order date and extractReturnDays
        const orderDate = returnDates[i] || "10-01-2025"; // Default date if not provided
        const maxReturnDate = calculateMaxReturnDate(orderDate, extractReturnDays);
        
        const items = [];
        for (let j = 0; j < orderProducts.length; j++) {
          // Find matching product in rawProductData
          const productName = orderProducts[j];
          const matchingProduct = rawProductData.find(product => product.title === productName);
          
          // Get price and image from matching product or use defaults
          const price = matchingProduct ? 
            parseFloat(matchingProduct.variants.edges[0].node.price) : 60;
          
          const imageUrl = matchingProduct && matchingProduct.media && matchingProduct.media.nodes.length > 0 ? 
            matchingProduct.media.nodes[0].preferredUrl : 
            "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000";
          
          items.push({
            name: productName,
            quantity: orderQuantities[j] || 1,
            price: price,
            imageUrl: imageUrl
          });
        }
        
        orders.push({
          orderNumber: orderNumbers[i],
          orderID: orderIDs[i] || "",
          orderedDate: returnDates[i] || "10-01-2025", // Use returnDate as the order creation date
          maxReturnDate: maxReturnDate,
          items: items
        });
      }
      
      // Function to calculate max return date
      function calculateMaxReturnDate(orderDate, days) {
        try {
          // Parse the date (DD-MM-YYYY)
          const parts = orderDate.split('-');
          if (parts.length !== 3) return "Invalid date";
          
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          
          // Create date object with correct format: Year, Month (0-based), Day
          const date = new Date(year, month - 1, day);
          
          // Add the specified number of days
          date.setDate(date.getDate() + days);
          
          // Format the result as DD-MM-YYYY
          const day_result = String(date.getDate()).padStart(2, '0');
          const month_result = String(date.getMonth() + 1).padStart(2, '0');
          const year_result = date.getFullYear();
          
          return `${day_result}-${month_result}-${year_result}`;
        } catch (e) {
          console.error("Error calculating max return date:", e);
          return "Error calculating date";
        }
      }
  
      // ------------------------------------------
      // 2) STYLES
      // ------------------------------------------
      const styles = `
        /* Carousel wrapper + container */
        .carousel-wrapper {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .carousel-container {
          overflow: hidden;
          font-family: Arial, sans-serif;
          width: 100%;
        }
        .carousel-track {
          display: flex;
          align-items: stretch;
          transition: transform 0.3s ease-in-out;
        }
  
        /* Arrows */
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 20px;
          line-height: 38px;
          text-align: center;
          user-select: none;
          z-index: 9999;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .carousel-arrow:hover {
          background: #eee;
        }
        .arrow-left {
          left: -35px;
        }
        .arrow-right {
          right: -35px;
        }
  
        /* Cards */
        .carousel-card {
          flex: 0 0 50%;
          box-sizing: border-box;
          padding: 10px;
          display: flex;
          flex-direction: column;
        }
        .order-card {
          background: #fafafa;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          transition: background 0.3s;
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
        }
  
        /* Order info */
        .order-header {
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ccc;
          text-align: center;
        }
        .order-line {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .items-container {
          margin-top: 10px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
  
        /* Item row */
        .item-row {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          padding: 10px;
          border-radius: 4px;
          transition: background 0.3s;
          cursor: pointer;
          justify-content: space-between;
          min-height: 60px;
        }
        .item-row:hover {
          background: #f0f0f0;
        }
        .item-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .item-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
        }
        .item-name {
          font-size: 12px;
          width: 150px;
        }
        .item-price {
          font-size: 14px;
          font-weight: bold;
          width: 50px;
        }
        .item-row.selected {
          box-shadow: 0 0 0 2px orange;
        }
  
        /* --- RETURN FORM STYLES --- */
        .return-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
  
        .top-section {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .top-section img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
        }
        .product-info-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 80px;
          flex: 1;
        }
        .product-title {
          font-weight: bold;
          font-size: 14px;
        }
        .product-info {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          color: #555;
          gap: 8px;
        }
  
        .divider {
          border: none;
          border-top: 1px solid #ccc;
          margin: 10px 0;
          width: 100%;
        }
  
        .quantity-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .qty-btn {
          width: 30px;
          height: 30px;
          font-size: 18px;
          background: none;
          border: 1px solid #ccc;
          border-radius: 4px;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .qty-display {
          font-size: 20px;
          font-weight: bold;
          width: 30px;
          text-align: center;
        }
  
        .reason-select {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 10px;
          width: 100%;
          font-size: 14px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 12px top 50%;
          background-size: 10px auto;
          cursor: pointer;
        }
        
        .reason-select:focus {
          outline: none;
          border-color: #a0a0a0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.08), 0 0 5px rgba(0,0,0,0.05);
        }
  
        .notes-area {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 10px;
          font-size: 14px;
          width: 100%;
          resize: vertical;
          min-height: 80px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
        }
        
        .notes-area:focus {
          outline: none;
          border-color: #a0a0a0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.08), 0 0 5px rgba(0,0,0,0.05);
        }
  
        .outline-btn {
          background: none;
          border: 1px solid #ccc;
          color: #000;
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .outline-btn:hover {
          background: #f0f0f0;
          border-color: #b0b0b0;
        }
        
        /* Back button */
        .back-button {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .back-arrow {
          margin-right: 5px;
          font-size: 18px;
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .button-container {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .back-btn {
          background: none;
          border: 1px solid #ccc;
          color: #000;
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
          flex: 1;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .back-btn:hover {
          background: #f0f0f0;
          border-color: #b0b0b0;
        }
      `;
  
      // ------------------------------------------
      // 3) BASE HTML
      // ------------------------------------------
      const showArrows = orders.length > 2;
      
      element.innerHTML = `
        <style>${styles}</style>
        <div class="carousel-wrapper">
          ${showArrows ? '<div class="carousel-arrow arrow-left" id="arrowLeft">&#10094;</div>' : ''}
          <div class="carousel-container">
            <div class="carousel-track" id="carouselTrack">
              ${orders
                .map((order) => {
                  return `
                    <div class="carousel-card">
                      <div class="order-card">
                        <div class="order-header">${order.orderNumber}</div>
                        <div class="order-line">Ordered date: ${order.orderedDate}</div>
                        <div class="order-line">Max return date: ${order.maxReturnDate}</div>
                        <div class="items-container">
                          ${order.items
                            .map((item) => {
                              return `
                                <div
                                  class="item-row"
                                  data-name="${item.name}"
                                  data-quantity="${item.quantity}"
                                  data-price="${item.price}"
                                  data-image="${item.imageUrl}"
                                  data-order="${order.orderNumber}"
                                  data-orderid="${order.orderID || ''}"
                                >
                                  <div class="item-left">
                                    <img class="item-image" src="${item.imageUrl}" alt="Product Image" />
                                    <div class="item-name">
                                      ${item.name}
                                    </div>
                                  </div>
                                  <div class="item-price">€${item.price}</div>
                                </div>
                              `;
                            })
                            .join("")}
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
          ${showArrows ? '<div class="carousel-arrow arrow-right" id="arrowRight">&#10095;</div>' : ''}
        </div>
      `;
  
      // ------------------------------------------
      // 4) CAROUSEL FUNCTIONALITY
      // ------------------------------------------
      if (showArrows) {
        const track = element.querySelector("#carouselTrack");
        const arrowLeft = element.querySelector("#arrowLeft");
        const arrowRight = element.querySelector("#arrowRight");
        const cardCount = orders.length;
        const cardsToShow = 2;
        let currentIndex = 0;
    
        function updateCarousel() {
          const translatePercentage = -(100 / cardsToShow) * currentIndex;
          track.style.transform = `translateX(${translatePercentage}%)`;
        }
    
        arrowLeft.addEventListener("click", () => {
          if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
          }
        });
    
        arrowRight.addEventListener("click", () => {
          if (currentIndex < cardCount - cardsToShow) {
            currentIndex++;
            updateCarousel();
          }
        });
      }
  
      // ------------------------------------------
      // 5) ITEM SELECTION => SHOW RETURN FORM
      // ------------------------------------------
      const itemRows = element.querySelectorAll(".item-row");
      let selectedItem = null;
  
      function attachItemRowEventListeners() {
        const itemRows = element.querySelectorAll(".item-row");
        itemRows.forEach((row) => {
          row.addEventListener("click", handleItemRowClick);
        });
      }
  
      function handleItemRowClick() {
        // Highlight the newly selected item
        if (selectedItem) {
          selectedItem.classList.remove("selected");
        }
        this.classList.add("selected");
        selectedItem = this;
  
        // Extract item data
        const itemName = this.getAttribute("data-name");
        const itemQuantity = parseInt(this.getAttribute("data-quantity"), 10) || 1;
        const itemPrice = this.getAttribute("data-price");
        const itemImage = this.getAttribute("data-image");
        const orderNumber = this.getAttribute("data-order");
        const orderID = this.getAttribute("data-orderid");
  
        console.log(`Selected item: ${itemName} from order ${orderNumber}`);
  
        // Find the parent card to replace with the return form
        const parentCard = this.closest(".carousel-card");
        if (!parentCard) return;
  
        // Build the Return Form layout
        const returnFormHTML = `
          <div class="order-card">
            <div class="order-header">${orderNumber}</div>
  
            <div class="return-form">
              <div class="top-section">
                <img src="${itemImage}" alt="Product Image" />
                <div class="product-info-right">
                  <div class="product-title">${itemName}</div>
                  <div class="product-info">
                    <div>Quantity: ${itemQuantity}</div>
                    <div>Price: €${itemPrice}</div>
                  </div>
                </div>
              </div>
  
              <hr class="divider" />
  
              <label>Quantity</label>
              <div class="quantity-control">
                <button class="qty-btn" id="qtyDown" disabled>-</button>
                <div class="qty-display" id="qtyDisplay">1</div>
                <button class="qty-btn" id="qtyUp">+</button>
              </div>
  
              <hr class="divider" />
  
              <label for="returnReason">Return Reason</label>
              <select id="returnReason" name="returnReason" class="reason-select">
                <option value="" disabled selected>Select a reason</option>
                <option value="Color">Color</option>
                <option value="Defective">Defective</option>
                <option value="Not as Described">Not as Described</option>
                <option value="Other">Other</option>
                <option value="Size Too Large">Size Too Large</option>
                <option value="Size Too Small">Size Too Small</option>
                <option value="Style">Style</option>
                <option value="Unwanted">Unwanted</option>
                <option value="Wrong Item">Wrong Item</option>
              </select>
  
              <label for="additionalNotes">Additional Notes</label>
              <textarea id="additionalNotes" name="additionalNotes" rows="3" class="notes-area"></textarea>
  
              <div class="button-container">
                <button id="backToItems" class="back-btn">Back</button>
                <button id="createReturnBtn" class="outline-btn">Create Return Request</button>
              </div>
            </div>
          </div>
        `;
  
        // Replace the card's content
        parentCard.innerHTML = returnFormHTML;
  
        // Now attach event listeners inside the new form
        const qtyDisplay = parentCard.querySelector("#qtyDisplay");
        const qtyUp = parentCard.querySelector("#qtyUp");
        const qtyDown = parentCard.querySelector("#qtyDown");
        let currentQty = 1;
  
        // Increment/Decrement logic
        qtyUp.addEventListener("click", () => {
          if (currentQty < itemQuantity) {
            currentQty++;
            qtyDisplay.textContent = currentQty;
            qtyDown.disabled = false;
          }
          if (currentQty === itemQuantity) {
            qtyUp.disabled = true;
          }
        });
        
        qtyDown.addEventListener("click", () => {
          if (currentQty > 1) {
            currentQty--;
            qtyDisplay.textContent = currentQty;
            qtyUp.disabled = false;
          }
          if (currentQty === 1) {
            qtyDown.disabled = true;
          }
        });
  
        // Back button functionality
        const backButton = parentCard.querySelector("#backToItems");
        backButton.addEventListener("click", () => {
          // Find the original order card and restore it
          const orderIndex = orders.findIndex(order => order.orderNumber === orderNumber);
          if (orderIndex !== -1) {
            const orderCard = `
              <div class="order-card">
                <div class="order-header">${orderNumber}</div>
                <div class="order-line">Ordered date: ${orders[orderIndex].orderedDate}</div>
                <div class="order-line">Max return date: ${orders[orderIndex].maxReturnDate}</div>
                <div class="items-container">
                  ${orders[orderIndex].items
                    .map((item) => {
                      return `
                        <div
                          class="item-row"
                          data-name="${item.name}"
                          data-quantity="${item.quantity}"
                          data-price="${item.price}"
                          data-image="${item.imageUrl}"
                          data-order="${orderNumber}"
                          data-orderid="${orders[orderIndex].orderID || ''}"
                        >
                          <div class="item-left">
                            <img class="item-image" src="${item.imageUrl}" alt="Product Image" />
                            <div class="item-name">
                              ${item.name}
                            </div>
                          </div>
                          <div class="item-price">€${item.price}</div>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `;
            
            parentCard.innerHTML = orderCard;
            
            // Reattach event listeners to the new item rows
            attachItemRowEventListeners();
          }
        });
  
        // "Create Return Request" button
        const createReturnBtn = parentCard.querySelector("#createReturnBtn");
        createReturnBtn.addEventListener("click", () => {
          const reason = parentCard.querySelector("#returnReason").value;
          const notes = parentCard.querySelector("#additionalNotes").value;
  
          // Example: Log or send a payload
          console.log("Return Request Data:", {
            orderNumber,
            orderID,
            itemName,
            itemPrice,
            requestedQuantity: currentQty,
            reason,
            notes,
          });
  
          // If using Voiceflow or your own backend:
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              orderNumber,
              orderID,
              itemName,
              requestedQuantity: currentQty,
              reason,
              notes
            }
          });
          
        });
      }
  
      // Initial attachment of event listeners
      attachItemRowEventListeners();
    },
  };