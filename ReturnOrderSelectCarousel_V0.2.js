export const OrdersCarouselExtension = {
    name: "OrdersCarousel",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_OrdersCarousel" ||
      (trace.payload && trace.payload.name === "Custom_OrdersCarousel"),
  
    render: ({ trace, element }) => {
      // ------------------------------------------
      // 1) EXAMPLE DATA
      // ------------------------------------------
      const orders = [
        {
          orderNumber: "#1003",
          orderedDate: "10-01-2025",
          maxReturnDate: "10-02-2025",
          returnDate: "10-03-2025",
          items: [
            {
              name: "Pre PRO 2.0",
              quantity: 2,
              price: 60,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
          ],
        },
        {
          orderNumber: "#1004",
          orderedDate: "10-02-2025",
          maxReturnDate: "10-03-2025",
          returnDate: "11-03-2025",
          items: [
            {
              name: "Granola",
              quantity: 1,
              price: 20,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
            {
              name: "Pre PRO 2.0",
              quantity: 2,
              price: 60,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
          ],
        },
        {
          orderNumber: "#1005",
          orderedDate: "10-02-2025",
          maxReturnDate: "10-03-2025",
          returnDate: "11-03-2025",
          items: [
            {
              name: "Pre PRO 2.0",
              quantity: 2,
              price: 60,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
          ],
        },
      ];
  
      // ------------------------------------------
      // 2) STYLES
      // ------------------------------------------
      const styles = `
        /* Carousel wrapper + container */
        .carousel-wrapper {
          position: relative;
          width: 90%;
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
        }
  
        /* Order info */
        .order-header {
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ccc;
          text-align: center; /* (5) Center the order number */
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
        }
        .item-price {
          font-size: 14px;
          font-weight: bold;
        }
        .item-row.selected {
          box-shadow: 0 0 0 2px orange;
        }
  
        /* --- RETURN FORM STYLES --- */
        .return-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
  
        /* (6) Layout: image on the left, product info on the right */
        .top-section {
          display: flex;
          gap: 10px;
          align-items: flex-start; /* or center, if you prefer */
        }
        .product-info-right {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .product-title {
          font-weight: bold;
          font-size: 16px;
        }
        .product-info {
          font-size: 14px;
          color: #555;
        }
  
        /* (7) Divider line between product info & quantity label */
        .divider {
          border: none;
          border-top: 1px solid #ccc;
          margin: 10px 0;
        }
  
        /* Quantity control: big number w/ up/down on sides */
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
          line-height: 28px;
          text-align: center;
        }
        .qty-display {
          font-size: 20px;
          font-weight: bold;
          width: 30px;
          text-align: center;
        }
  
        /* (2) White background + inner shadow for dropdown */
        .reason-select {
          background: #fff;
          box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
          border: none;
          border-radius: 4px;
          padding: 6px;
        }
  
        /* (3) Text area w/ inner shadow */
        .notes-area {
          box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
          border: none;
          border-radius: 4px;
          padding: 6px;
          font-size: 14px;
        }
  
        /* (4) Outline button with black text */
        .outline-btn {
          background: none;
          border: 1px solid #ccc;
          color: #000;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
        }
        .outline-btn:hover {
          background: #f0f0f0;
        }
      `;
  
      // ------------------------------------------
      // 3) BASE HTML
      // ------------------------------------------
      element.innerHTML = `
        <style>${styles}</style>
        <div class="carousel-wrapper">
          <div class="carousel-arrow arrow-left" id="arrowLeft">&#10094;</div>
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
                        <div class="order-line">Return date: ${order.returnDate}</div>
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
                                >
                                  <div class="item-left">
                                    <img class="item-image" src="${item.imageUrl}" alt="Product Image" />
                                    <div class="item-name">
                                      ${item.name} (x${item.quantity})
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
          <div class="carousel-arrow arrow-right" id="arrowRight">&#10095;</div>
        </div>
      `;
  
      // ------------------------------------------
      // 4) CAROUSEL FUNCTIONALITY
      // ------------------------------------------
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
  
      // ------------------------------------------
      // 5) ITEM SELECTION => SHOW RETURN FORM
      // ------------------------------------------
      const itemRows = element.querySelectorAll(".item-row");
      let selectedItem = null;
  
      itemRows.forEach((row) => {
        row.addEventListener("click", () => {
          // Highlight the newly selected item
          if (selectedItem) {
            selectedItem.classList.remove("selected");
          }
          row.classList.add("selected");
          selectedItem = row;
  
          // Extract item data
          const itemName = row.getAttribute("data-name");
          const itemQuantity = parseInt(row.getAttribute("data-quantity"), 10) || 1;
          const itemPrice = row.getAttribute("data-price");
          const itemImage = row.getAttribute("data-image");
          const orderNumber = row.getAttribute("data-order");
  
          console.log(`Selected item: ${itemName} from order ${orderNumber}`);
  
          // Find the parent card to replace with the return form
          const parentCard = row.closest(".carousel-card");
          if (!parentCard) return;
  
          // Build the Return Form layout
          const returnFormHTML = `
            <div class="order-card">
              <div class="order-header">${orderNumber}</div>
  
              <div class="return-form">
                <!-- (6) Put image on left, info on right -->
                <div class="top-section">
                  <img src="${itemImage}" alt="Product Image" />
                  <div class="product-info-right">
                    <div class="product-title">${itemName}</div>
                    <div class="product-info">
                      Quantity: ${itemQuantity} | Price: €${itemPrice}
                    </div>
                  </div>
                </div>
  
                <!-- (7) Divider line -->
                <hr class="divider" />
  
                <label>Quantity</label>
                <!-- A big number with up/down on each side -->
                <div class="quantity-control">
                  <button class="qty-btn" id="qtyUp">&#94;</button>
                  <div class="qty-display" id="qtyDisplay">${itemQuantity}</div>
                  <button class="qty-btn" id="qtyDown">&#8744;</button>
                </div>
  
                <hr class="divider" />
  
                <label for="returnReason">Return Reason</label>
                <select id="returnReason" name="returnReason" class="reason-select">
                  <option value="" disabled selected>Select a reason</option>
                  <option value="damaged">Damaged</option>
                  <option value="incorrect">Incorrect Item</option>
                  <option value="other">Other</option>
                </select>
  
                <label for="additionalNotes">Additional Notes</label>
                <textarea id="additionalNotes" name="additionalNotes" rows="3" class="notes-area"></textarea>
  
                <!-- Outline button with black text -->
                <button id="createReturnBtn" class="outline-btn">Create Return Request</button>
              </div>
            </div>
          `;
  
          // Replace the card’s content
          parentCard.innerHTML = returnFormHTML;
  
          // Now attach event listeners inside the new form
          const qtyDisplay = parentCard.querySelector("#qtyDisplay");
          const qtyUp = parentCard.querySelector("#qtyUp");
          const qtyDown = parentCard.querySelector("#qtyDown");
          let currentQty = itemQuantity;
  
          // Increment/Decrement logic
          qtyUp.addEventListener("click", () => {
            currentQty++;
            qtyDisplay.textContent = currentQty;
          });
          qtyDown.addEventListener("click", () => {
            if (currentQty > 1) {
              currentQty--;
              qtyDisplay.textContent = currentQty;
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
              itemName,
              itemPrice,
              requestedQuantity: currentQty,
              reason,
              notes,
            });
  
            /*
            // If using Voiceflow or your own backend:
            window.voiceflow.chat.interact({
              type: 'complete',
              payload: {
                orderNumber,
                itemName,
                requestedQuantity: currentQty,
                reason,
                notes
              }
            });
            */
          });
        });
      });
    },
  };