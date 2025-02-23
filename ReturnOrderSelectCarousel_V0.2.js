export const OrdersCarouselExtension = {
    name: "OrdersCarousel",
    type: "response",
    match: ({ trace }) =>
      trace.type === "Custom_OrdersCarousel" ||
      (trace.payload && trace.payload.name === "Custom_OrdersCarousel"),
    render: ({ trace, element }) => {
      // Example data...
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
        // Add more orders as needed...
      ];
  
      const styles = `
        /* A parent wrapper to hold the container and the arrows */
        .carousel-wrapper {
          position: relative;
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
        }
  
        /* The container that actually holds the track and cards */
        .carousel-container {
          overflow: hidden;
          font-family: Arial, sans-serif;
          /* We want the container to fill the wrapper's width */
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
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .carousel-arrow:hover {
          background: #eee;
        }
        /* Place them to the far left/right of the .carousel-wrapper */
        .arrow-left {
          left: -20px; 
        }
        .arrow-right {
          right: -20px;
        }
  
        /* Each "card" is half the container width, so 2 cards show at once */
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
      `;
  
      element.innerHTML = `
        <style>${styles}</style>
        <!-- PARENT WRAPPER -->
        <div class="carousel-wrapper">
          
          <!-- Arrows are placed here, outside .carousel-container -->
          <div class="carousel-arrow arrow-left" id="arrowLeft">&#10094;</div>
          
          <!-- The actual carousel container -->
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
          </div>
  
          <!-- Right arrow also outside .carousel-container -->
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
      // Item Selection
      // -----------------------------
      const itemRows = element.querySelectorAll(".item-row");
      let selectedItem = null;
  
      itemRows.forEach((row) => {
        row.addEventListener("click", () => {
          if (selectedItem) {
            selectedItem.classList.remove("selected");
          }
          row.classList.add("selected");
          selectedItem = row;
  
          const itemName = row.getAttribute("data-name");
          const orderNumber = row.getAttribute("data-order");
          console.log(`Selected item: ${itemName} from order ${orderNumber}`);
        });
      });
    },
  };