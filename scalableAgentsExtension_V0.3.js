export const VariantSelectionForm = {
    name: 'VariantSelectionForm',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_variant_selection' || (trace.payload && trace.payload.name === 'ext_variant_selection'),
    render: ({ trace, element }) => {
        console.log('Rendering VariantSelectionForm');

        // Parse payload dynamically
        let payloadObj;
        if (typeof trace.payload === 'string') {
            try {
                payloadObj = JSON.parse(trace.payload);
            } catch (e) {
                console.error('Error parsing payload:', e);
                payloadObj = {};
            }
        } else {
            payloadObj = trace.payload || {};
        }

        console.log('Parsed Payload:', payloadObj);

        // Extract variant data dynamically from payload
        const variantIDs = payloadObj.selectedVariantID || '';
        const variantTitles = payloadObj.selectedVariantTitle || '';
        const variantPrices = payloadObj.selectedVariantPrices || '';
        const lb_quantity = payloadObj.lb_quantity || 'Quantity';
        const bt_submit = payloadObj.bt_submit || 'Submit';

        // Split data into arrays
        const idsArray = variantIDs.split(',').map(id => id.trim());
        const titlesArray = variantTitles.split(',').map(title => title.trim());
        const pricesArray = variantPrices.split(',').map(price => parseFloat(price.trim()));

        // Create form container
        const formContainer = document.createElement('form');
        formContainer.innerHTML = `
            <style>
                .simple-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding: 20px;
                    border-radius: 8px;
                    background: #f9f9f9;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    max-width: 300px;
                    margin: auto;
                }
                select, input, button {
                    padding: 12px;
                    font-size: 16px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    width: 100%;
                    outline: none;
                    transition: all 0.3s ease;
                }
                select:focus, input:focus {
                    border-color: #447f76;
                    box-shadow: 0 0 8px rgba(68, 127, 118, 0.3);
                }
                input[type="number"] {
                    text-align: center;
                }
                button {
                    cursor: pointer;
                    background-color: #447f76;
                    color: white;
                    border: none;
                    font-weight: bold;
                    transition: background-color 0.2s ease;
                }
                button:hover {
                    background-color: #376b62;
                }
                .price {
                    font-weight: bold;
                    font-size: 18px;
                    color: #333;
                    text-align: center;
                }
            </style>

            <div class="simple-form">
                <select id="variant">
                    ${titlesArray.map((title, index) =>
                        `<option value="${index}">${title}</option>`
                    ).join('')}
                </select>

                <input type="number" id="quantity" name="quantity" value="1" min="1" required placeholder="${lb_quantity}">

                <div class="price">€${pricesArray[0].toFixed(2)}</div>

                <button type="submit">${bt_submit}</button>
            </div>
        `;

        // Get form elements
        const variantSelect = formContainer.querySelector('#variant');
        const quantityInput = formContainer.querySelector('#quantity');
        const priceDisplay = formContainer.querySelector('.price');

        // Update price display when variant selection changes
        variantSelect.addEventListener('change', () => {
            const selectedIndex = variantSelect.value;
            priceDisplay.textContent = `€${pricesArray[selectedIndex].toFixed(2)}`;
        });

        // Handle form submission
        formContainer.addEventListener('submit', (event) => {
            event.preventDefault();

            const selectedIndex = variantSelect.value;
            const payload = {
                selectedVariantID: idsArray[selectedIndex],
                selectedVariantTitle: titlesArray[selectedIndex],
                selectedVariantPrice: pricesArray[selectedIndex],
                quantity: parseInt(quantityInput.value, 10),
            };

            console.log('Submitting payload:', payload);

            window.voiceflow.chat.interact({
                type: 'complete',
                payload: payload,
            });
        });

        // Append form to chat window
        element.appendChild(formContainer);
    },
};

export const DisableInputExtension = {
    name: 'DisableInput',
    type: 'effect',
    match: ({ trace }) =>
      trace.type === 'ext_disableInput' ||
      trace.payload.name === 'ext_disableInput',
    effect: ({ trace }) => {
      const { isDisabled } = trace.payload
  
      function disableInput() {
        const chatDiv = document.getElementById('voiceflow-chat')
  
        if (chatDiv) {
          const shadowRoot = chatDiv.shadowRoot
          if (shadowRoot) {
            const chatInput = shadowRoot.querySelector('.vfrc-chat-input')
            const textarea = shadowRoot.querySelector(
              'textarea[id^="vf-chat-input--"]'
            )
            const button = shadowRoot.querySelector('.vfrc-chat-input--button')
  
            if (chatInput && textarea && button) {
              // Add a style tag if it doesn't exist
              let styleTag = shadowRoot.querySelector('#vf-disable-input-style')
              if (!styleTag) {
                styleTag = document.createElement('style')
                styleTag.id = 'vf-disable-input-style'
                styleTag.textContent = `
                  .vf-no-border, .vf-no-border * {
                    border: none !important;
                  }
                  .vf-hide-button {
                    display: none !important;
                  }
                `
                shadowRoot.appendChild(styleTag)
              }
  
              function updateInputState() {
                textarea.disabled = isDisabled
                if (!isDisabled) {
                  textarea.placeholder = 'Message...'
                  chatInput.classList.remove('vf-no-border')
                  button.classList.remove('vf-hide-button')
                  // Restore original value getter/setter
                  Object.defineProperty(
                    textarea,
                    'value',
                    originalValueDescriptor
                  )
                } else {
                  textarea.placeholder = ''
                  chatInput.classList.add('vf-no-border')
                  button.classList.add('vf-hide-button')
                  Object.defineProperty(textarea, 'value', {
                    get: function () {
                      return ''
                    },
                    configurable: true,
                  })
                }
  
                // Trigger events to update component state
                textarea.dispatchEvent(
                  new Event('input', { bubbles: true, cancelable: true })
                )
                textarea.dispatchEvent(
                  new Event('change', { bubbles: true, cancelable: true })
                )
              }
  
              // Store original value descriptor
              const originalValueDescriptor = Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value'
              )
  
              // Initial update
              updateInputState()
            } else {
              console.error('Chat input, textarea, or button not found')
            }
          } else {
            console.error('Shadow root not found')
          }
        } else {
          console.error('Chat div not found')
        }
      }
  
      disableInput()
    },
  }