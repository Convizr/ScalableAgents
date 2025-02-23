export const OrdersCarouselExtension = {
    name: "OrdersCarousel",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_OrdersCarousel" ||
      (trace.payload && trace.payload.name === "Custom_OrdersCarousel"),
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
  
      // Example data structure for your orders
      const orders = payloadObj.orders || [
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
            {
              name: "Pre PRO 2.0",
              quantity: 1,
              price: 60,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
          ],
        },
        {
          orderNumber: "#1006",
          orderedDate: "11-02-2025",
          maxReturnDate: "11-03-2025",
          returnDate: "12-03-2025",
          items: [
            {
              name: "Pre PRO 2.0",
              quantity: 3,
              price: 90,
              imageUrl:
                "https://cdn.shopify.com/s/files/1/0254/4667/8590/files/preview_images/b19dcfcc73194fc8b5ef20d34e2a58c1.thumbnail.0000000000.jpg?v=1737192051&width=1000",
            },
          ],
        },
      ];
  
      // -----------------------------
      // STYLES
      // -----------------------------
      const styles = `
        .carousel-container {
          position: relative;
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }
        /* 
          Force all cards to align at the bottom by stretching them 
          to match the tallest card. 
        */
        .carousel-track {
          display: flex;
          align-items: stretch; /* ensures same height columns */
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
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .carousel-arrow:hover {
          background: #eee;
        }
        .arrow-left {
          left: 10px; /* place arrow just inside container */
        }
        .arrow-right {
          right: 10px; /* place arrow just inside container */
        }
  
        /* Each "card" is half the container width, so 2 cards show at once */
        .carousel-card {
          flex: 0 0 50%;
          box-sizing: border-box;
          padding: 10px;
          display: flex;
          flex-direction: column; /* so the child .order-card can stretch */
        }
        .order-card {
          background: #fafafa;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          transition: background 0.3s;
          flex: 1; /* stretch to fill available vertical space */
          display: flex;
          flex-direction: column;
        }
        .order-header {
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 8px; /* spacing for bottom line */
          border-bottom: 1px solid #ccc; /* line under order number */
        }
        .order-line {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .items-container {
          margin-top: 10px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          /* Push the items to the bottom if needed, or remove if undesired:
          flex: 1; 
          display: flex;
          flex-direction: column;
          justify-content: flex-start; 
          */
        }
  
        /* Item row with image */
        .item-row {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          padding: 10px;
          border-radius: 4px;
          transition: background 0.3s;
          cursor: pointer;
          justify-content: space-between;
          min-height: 60px; /* ensure a taller row */
        }
        .item-row:hover {
          background: #f0f0f0; /* Gray hover effect */
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
  
        /* Selection glow effect */
        .item-row.selected {
          box-shadow: 0 0 0 2px orange;
        }
      `;
  
      // -----------------------------
      // HTML STRUCTURE
      // -----------------------------
      element.innerHTML = `
        <style>${styles}</style>
        <div class="carousel-container">
          <div class="carousel-arrow arrow-left" id="arrowLeft">&#10094;</div>
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
                            const imgSrc = item.imageUrl || "https://via.placeholder.com/40?text=NoImg";
                            return `
                              <div class="item-row" data-name="${item.name}" data-order="${order.orderNumber}">
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
          <div class="carousel-arrow arrow-right" id="arrowRight">&#10095;</div>
        </div>
      `;
  
      // -----------------------------
      // CAROUSEL FUNCTIONALITY
      // -----------------------------
      const track = element.querySelector("#carouselTrack");
      const arrowLeft = element.querySelector("#arrowLeft");
      const arrowRight = element.querySelector("#arrowRight");
      const cardCount = orders.length;
      const cardsToShow = 2; // showing 2 cards at a time
      let currentIndex = 0; // 0-based index for the "page" of the carousel
  
      function updateCarousel() {
        // Each card is 1/2 of container's width => 2 cards visible at once
        // Move the track by the # of cards * the width (in %).
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
        // The max index is (cardCount - cardsToShow),
        // so the last group of 2 is fully visible
        if (currentIndex < cardCount - cardsToShow) {
          currentIndex++;
          updateCarousel();
        }
      });
  
      // -----------------------------
      // ITEM SELECTION FUNCTIONALITY
      // -----------------------------
      const itemRows = element.querySelectorAll(".item-row");
      let selectedItem = null;
  
      itemRows.forEach((row) => {
        row.addEventListener("click", () => {
          // Remove 'selected' from any previously selected item
          if (selectedItem) {
            selectedItem.classList.remove("selected");
          }
          // Add 'selected' to the newly clicked item
          row.classList.add("selected");
          selectedItem = row;
  
          // Example logging or sending a payload
          const itemName = row.getAttribute("data-name");
          const orderNumber = row.getAttribute("data-order");
          console.log(`Selected item: ${itemName} from order ${orderNumber}`);
  
          /*
          // If you want to send a complete payload via Voiceflow or similar:
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: {
              orderNumber,
              itemName
            }
          });
          */
        });
      });
    },
  };