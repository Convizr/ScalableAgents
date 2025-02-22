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
    // You can replace this with payloadObj.orders if you want dynamic data from the payload
    const orders = payloadObj.orders || [
      {
        orderNumber: "#1003",
        orderedDate: "10-01-2025",
        maxReturnDate: "10-02-2025",
        returnDate: "10-03-2025",
        items: [
          { name: "Pre PRO 2.0", quantity: 2, price: 60 },
        ],
      },
      {
        orderNumber: "#1004",
        orderedDate: "10-02-2025",
        maxReturnDate: "10-03-2025",
        returnDate: "11-03-2025",
        items: [
          { name: "Granola", quantity: 1, price: 20 },
          { name: "Pre PRO 2.0", quantity: 2, price: 60 },
        ],
      },
      {
        orderNumber: "#1005",
        orderedDate: "10-02-2025",
        maxReturnDate: "10-03-2025",
        returnDate: "11-03-2025",
        items: [
          { name: "Pre PRO 2.0", quantity: 2, price: 60 },
          { name: "Pre PRO 2.0", quantity: 1, price: 60 },
        ],
      },
      {
        orderNumber: "#1006",
        orderedDate: "11-02-2025",
        maxReturnDate: "11-03-2025",
        returnDate: "12-03-2025",
        items: [
          { name: "Pre PRO 2.0", quantity: 3, price: 90 },
        ],
      },
      // Add as many orders as you want...
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
      .carousel-track {
        display: flex;
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
      }
      .carousel-arrow:hover {
        background: #eee;
      }
      .arrow-left {
        left: 0;
      }
      .arrow-right {
        right: 0;
      }

      /* Card styling */
      .carousel-card {
        flex: 0 0 33.333%; /* 3 cards per full carousel width */
        box-sizing: border-box;
        padding: 10px;
      }
      .order-card {
        background: #fafafa;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        transition: background 0.3s;
      }
      .order-header {
        font-weight: bold;
        margin-bottom: 10px;
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
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.3s;
        cursor: pointer;
      }
      .item-row:hover {
        background: #f0f0f0; /* Gray hover effect */
      }
      .item-name {
        font-size: 14px;
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
          ${orders.map((order) => {
            return `
              <div class="carousel-card">
                <div class="order-card">
                  <div class="order-header">Order: ${order.orderNumber}</div>
                  <div class="order-line">Ordered date: ${order.orderedDate}</div>
                  <div class="order-line">Max return date: ${order.maxReturnDate}</div>
                  <div class="order-line">Return date: ${order.returnDate}</div>
                  <div class="items-container">
                    ${order.items
                      .map(
                        (item, idx) => `
                          <div class="item-row" data-name="${item.name}" data-order="${order.orderNumber}">
                            <div class="item-name">${item.name} (x${item.quantity})</div>
                            <div class="item-price">€${item.price}</div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
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
    const cardsToShow = 3;
    let currentIndex = 0; // Which "page" of the carousel we are on (0-based)

    // Calculate how many "slides" we have. If we have 4 items, we have 2 possible slides: 
    //  - index 0 shows cards [0,1,2]
    //  - index 1 shows cards [1,2,3] 
    // But to keep it simple, we'll just ensure we don't go out of bounds 
    // and shift one card at a time.

    function updateCarousel() {
      // Each card is 1/3 of container's width in the flex setup.
      // We move the track by the number of cards * the width (in %).
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
      // The maximum index we can go to is (cardCount - cardsToShow),
      // so that the last group of 3 is fully visible
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
        // Remove 'selected' class from previously selected item
        if (selectedItem) {
          selectedItem.classList.remove("selected");
        }
        // Add 'selected' class to the newly clicked item
        row.classList.add("selected");
        selectedItem = row;

        // Example: sending a payload or logging the selected item
        const itemName = row.getAttribute("data-name");
        const orderNumber = row.getAttribute("data-order");
        console.log(`Selected item: ${itemName} from order ${orderNumber}`);

        // If you want to send a complete payload via Voiceflow or similar:
        /*
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