export const OrdersCarouselExtension = {
    name: "OrdersCarousel",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_OrdersCarousel" ||
      (trace.payload && trace.payload.name === "Custom_OrdersCarousel"),
    render: ({ trace, element }) => {
      // Example data (add data-quantity, data-price in the HTML so we can read them on click)
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
  
      const styles = `
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
        .order-header {
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ccc;
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
  
        /* NEW: Form styling for the "return request" layout */
        .return-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .return-form img {
          max-width: 80px;
          margin-bottom: 10px;
        }
        .return-form .product-title {
          font-weight: bold;
          font-size: 16px;
        }
        .return-form .product-info {
          font-size: 14px;
          color: #555;
        }
        .return-form label {
          font-size: 14px;
          margin-top: 10px;
        }
        .return-form input[type="number"] {
          width: 60px;
          padding: 4px;
        }
        .return-form select,
        .return-form textarea {
          width: 100%;
          padding: 6px;
          font-size: 14px;
        }
        .return-form button {
          margin-top: 10px;
          padding: 8px 12px;
          border: none;
          background: #007BFF;
          color: #fff;
          font-size: 14px;
          border-radius: 4px;
          cursor: pointer;
        }
        .return-form button:hover {
          background: #0056b3;
        }
      `;
  
      // Build the base HTML
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
                        <div class="order-header">Order: ${order.orderNumber}</div>
                        <div class="order-line">Ordered date: ${order.orderedDate}</div>
                        <div class="order-line">Max return date: ${order.maxReturnDate}</div>
                        <div class="order-line">Return date: ${order.returnDate}</div>
                        <div class="items-container">
                          ${order.items
                            .map((item) => {
                              const imgSrc = item.imageUrl;
                              return `
                                <div 
                                  class="item-row" 
                                  data-name="${item.name}" 
                                  data-quantity="${item.quantity}" 
                                  data-price="${item.price}" 
                                  data-image="${imgSrc}" 
                                  data-order="${order.orderNumber}"
                                >
                                  <div class="item-left">
                                    <img class="item-image" src="${imgSrc}" alt="Product Image" />
                                    <div class="item-name">${item.name} (x${item.quantity})</div>
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
  
      // -----------------------------
      // Carousel Functionality
      // -----------------------------
      const track = element.querySelector("#carouselTrack");
      const arrowLeft = element.querySelector("#arrowLeft");
      const arrowRight = element.querySelector("#arrowRight");
      const cardCount = orders.length;
      const cardsToShow = 2; // 2 cards at a time
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
  
      // -----------------------------
      // Item Selection => Show Return Form
      // -----------------------------
      const itemRows = element.querySelectorAll(".item-row");
      let selectedItem = null;
  
      itemRows.forEach((row) => {
        row.addEventListener("click", () => {
          // Visual highlight
          if (selectedItem) selectedItem.classList.remove("selected");
          row.classList.add("selected");
          selectedItem = row;
  
          // Gather item data
          const itemName = row.getAttribute("data-name");
          const itemQuantity = row.getAttribute("data-quantity");
          const itemPrice = row.getAttribute("data-price");
          const itemImage = row.getAttribute("data-image");
          const orderNumber = row.getAttribute("data-order");
  
          console.log(`Selected item: ${itemName} from order ${orderNumber}`);
  
          // Find the parent .carousel-card so we can replace its content
          const parentCard = row.closest(".carousel-card");
          if (!parentCard) return;
  
          // Build the new Return Form layout
          const returnFormHTML = `
            <div class="order-card">
              <div class="order-header">Order: ${orderNumber}</div>
              <!-- Return Form Layout -->
              <div class="return-form">
                <img src="${itemImage}" alt="Product Image" />
                <div class="product-title">${itemName}</div>
                <div class="product-info">Quantity: ${itemQuantity} | Price: €${itemPrice}</div>
  
                <label for="returnQuantity">Quantity</label>
                <input 
                  type="number" 
                  id="returnQuantity" 
                  name="returnQuantity" 
                  min="1" 
                  max="${itemQuantity}" 
                  value="${itemQuantity}"
                />
  
                <label for="returnReason">Return Reason</label>
                <select id="returnReason" name="returnReason">
                  <option value="" disabled selected>Select a reason</option>
                  <option value="damaged">Damaged</option>
                  <option value="incorrect">Incorrect Item</option>
                  <option value="other">Other</option>
                </select>
  
                <label for="additionalNotes">Additional Notes</label>
                <textarea id="additionalNotes" name="additionalNotes" rows="3"></textarea>
  
                <button id="createReturnBtn">Create Return Request</button>
              </div>
            </div>
          `;
  
          // Replace the card’s content with the new form
          parentCard.innerHTML = returnFormHTML;
  
          // Attach event listener to the "Create Return Request" button
          const createReturnBtn = parentCard.querySelector("#createReturnBtn");
          createReturnBtn.addEventListener("click", () => {
            const returnQty = parentCard.querySelector("#returnQuantity").value;
            const reason = parentCard.querySelector("#returnReason").value;
            const notes = parentCard.querySelector("#additionalNotes").value;
  
            // Example: Log or send a payload
            console.log("Return Request Data:", {
              orderNumber,
              itemName,
              itemPrice,
              requestedQuantity: returnQty,
              reason,
              notes,
            });
  
            // In a real app, you might do:
            // window.voiceflow.chat.interact({
            //   type: 'complete',
            //   payload: {
            //     orderNumber,
            //     itemName,
            //     requestedQuantity: returnQty,
            //     reason,
            //     notes
            //   }
            // });
          });
        });
      });
    },
  };