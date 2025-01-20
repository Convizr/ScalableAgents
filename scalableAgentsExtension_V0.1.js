export const VariantSelectionForm = {
    name: 'VariantSelectionForm',
    type: 'response',
    match: ({ trace }) =>
        trace.type === 'ext_variant_selection' || (trace.payload && trace.payload.name === 'ext_variant_selection'),
    render: ({ trace, element }) => {
        console.log('Rendering VariantSelectionForm');

        // Parse payload
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

        const {
            selectedVariantID = '',
            selectedVariantTitle = '',
            selectedVariantPrices = '',
            lb_quantity = 'Quantity',
            bt_submit = 'Submit'
        } = payloadObj;

        const idsArray = selectedVariantID.split(',').map(id => id.trim());
        const titlesArray = selectedVariantTitle.split(',').map(title => title.trim());
        const pricesArray = selectedVariantPrices.split(',').map(price => parseFloat(price.trim()));

        // Create form container
        const formContainer = document.createElement('form');
        formContainer.innerHTML = `
            <style>
                .simple-form {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                select, input, button {
                    padding: 10px;
                    font-size: 16px;
                    border: none;
                    background: none;
                    outline: none;
                }
                input {
                    width: 60px;
                    text-align: center;
                }
                button {
                    cursor: pointer;
                    background-color: #447f76;
                    color: white;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                }
                button:hover {
                    background-color: #376b62;
                }
                .price {
                    font-weight: bold;
                    font-size: 16px;
                }
            </style>

            <div class="simple-form">
                <select id="variant">
                    ${titlesArray.map((title, index) =>
                        `<option value="${index}">${title}</option>`
                    ).join('')}
                </select>

                <input type="number" id="quantity" name="quantity" value="1" min="1" required placeholder="${lb_quantity}">

                <span class="price">€${pricesArray[0].toFixed(2)}</span>

                <button type="submit">${bt_submit}</button>
            </div>
        `;

        // Get form elements
        const variantSelect = formContainer.querySelector('#variant');
        const quantityInput = formContainer.querySelector('#quantity');
        const priceDisplay = formContainer.querySelector('.price');

        // Update price display on variant change
        variantSelect.addEventListener('change', () => {
            const selectedIndex = variantSelect.value;
            priceDisplay.textContent = `€${pricesArray[selectedIndex].toFixed(2)}`;
        });

        // Handle form submission
        formContainer.addEventListener('submit', (event) => {
            event.preventDefault();

            const selectedIndex = variantSelect.value;
            const payload = {
                variantID: idsArray[selectedIndex],
                variantTitle: titlesArray[selectedIndex],
                variantPrice: pricesArray[selectedIndex],
                quantity: parseInt(quantityInput.value, 10),
            };

            console.log('Submitting payload:', payload);

            window.voiceflow.chat.interact({
                type: 'complete',
                payload: payload,
            });
        });

        // Append form to element
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