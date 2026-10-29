/**
 * CodyUI Fashion — AJAX Cart Drawer, Quick Add, Free Shipping & Quick View Engine (cart.js)
 */
class CodyCartEngine {
  constructor() {
    this.init();
  }

  getSectionsToRender() {
    return [
      {
        id: 'CodyCartDrawerContent',
        section: 'cart-drawer',
        selector: '#CodyCartDrawerContent'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ];
  }

  async addItemByVariantId(variantId, quantity = 1, triggerButton = null) {
    if (!variantId) return;
    if (triggerButton) triggerButton.classList.add('is-disabled');

    const body = JSON.stringify({
      items: [{ id: Number(variantId), quantity: Number(quantity) }],
      sections: this.getSectionsToRender().map((s) => s.section),
      sections_url: window.location.pathname
    });

    try {
      const response = await fetch(`${window.routes.cart_add_url}.js`, {
        ...window.fetchConfig('json'),
        body
      });
      const parsedState = await response.json();

      if (parsedState.status) {
        if (window.CodyToast) {
          window.CodyToast.show(parsedState.description || window.cartStrings.error);
        }
        return;
      }

      this.renderContents(parsedState);

      const quickViewModal = document.getElementById('CodyQuickViewModal');
      if (quickViewModal && quickViewModal.getAttribute('aria-hidden') === 'false') {
        quickViewModal.close();
      }

      const cartDrawer = document.getElementById('CodyCartDrawer');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        cartDrawer.open(triggerButton);
      } else if (window.CodyToast) {
        window.CodyToast.show('Added to your shopping bag');
      }
    } catch (error) {
      if (window.CodyToast) {
        window.CodyToast.show(window.cartStrings.error);
      }
    } finally {
      if (triggerButton) triggerButton.classList.remove('is-disabled');
    }
  }

  async updateLineQuantity(line, quantity) {
    const body = JSON.stringify({
      line: Number(line),
      quantity: Number(quantity),
      sections: this.getSectionsToRender().map((s) => s.section),
      sections_url: window.location.pathname
    });

    try {
      const response = await fetch(`${window.routes.cart_change_url}.js`, {
        ...window.fetchConfig('json'),
        body
      });
      const parsedState = await response.json();
      this.renderContents(parsedState);
      if (window.location.pathname === window.routes.cart_url) {
        window.location.reload();
      }
    } catch (e) {
      if (window.CodyToast) {
        window.CodyToast.show(window.cartStrings.error);
      }
    }
  }

  renderContents(parsedState) {
    if (!parsedState || !parsedState.sections) return;
    this.getSectionsToRender().forEach((sectionToRender) => {
      const htmlString = parsedState.sections[sectionToRender.section];
      if (!htmlString) return;
      const targetElement = document.getElementById(sectionToRender.id);
      if (!targetElement) return;

      const parsedDOM = new DOMParser().parseFromString(htmlString, 'text/html');
      const sourceElement = parsedDOM.querySelector(sectionToRender.selector) || parsedDOM.body;
      targetElement.innerHTML = sourceElement.innerHTML;
    });
  }

  async openQuickView(handle, openerBtn = null) {
    if (!handle) return;
    const modal = document.getElementById('CodyQuickViewModal');
    const container = modal ? modal.querySelector('[data-quickview-container]') : null;
    if (!modal || !container) return;

    container.innerHTML = `<div style="padding: 6rem; text-align: center;">Loading piece details...</div>`;
    modal.open(openerBtn);

    try {
      const res = await fetch(`${window.routes.root_url}products/${handle}?section_id=quick-view`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const quickviewEl = doc.querySelector('[data-quickview-product]');
      container.innerHTML = quickviewEl ? quickviewEl.outerHTML : text;
      this.bindQuickViewEvents(container);
    } catch (e) {
      container.innerHTML = `<div style="padding: 4rem; text-align: center;">Unable to load quick view.</div>`;
    }
  }

  bindQuickViewEvents(container) {
    const form = container.querySelector('[data-ajax-cart-form]');
    const variantsJsonEl = container.querySelector('[data-quickview-variants-json]');
    const variantIdInput = container.querySelector('[data-quickview-variant-id]');
    const submitBtn = form ? form.querySelector('[type="submit"]') : null;
    const selects = Array.from(container.querySelectorAll('[data-quickview-option-select]'));

    if (variantsJsonEl && selects.length) {
      const variants = JSON.parse(variantsJsonEl.textContent);
      selects.forEach((sel) => {
        sel.addEventListener('change', () => {
          const selectedOptions = selects.map((s) => s.value);
          const matched = variants.find((v) =>
            v.options.every((opt, idx) => opt === selectedOptions[idx])
          );
          if (matched && variantIdInput) {
            variantIdInput.value = matched.id;
            if (submitBtn) {
              submitBtn.disabled = !matched.available;
              submitBtn.textContent = matched.available
                ? window.variantStrings.addToCart
                : window.variantStrings.soldOut;
            }
          }
        });
      });
    }
  }

  init() {
    document.addEventListener('click', (event) => {
      const quickAddBtn = event.target.closest('[data-quick-add-variant]');
      if (quickAddBtn) {
        event.preventDefault();
        this.addItemByVariantId(quickAddBtn.dataset.quickAddVariant, 1, quickAddBtn);
        return;
      }

      const quickViewBtn = event.target.closest('[data-quickview-handle]');
      if (quickViewBtn) {
        event.preventDefault();
        this.openQuickView(quickViewBtn.dataset.quickviewHandle, quickViewBtn);
        return;
      }

      const removeBtn = event.target.closest('[data-cart-remove-line]');
      if (removeBtn) {
        event.preventDefault();
        this.updateLineQuantity(removeBtn.dataset.cartRemoveLine, 0);
        return;
      }

      const discountApplyBtn = event.target.closest('[data-cart-discount-apply]');
      if (discountApplyBtn) {
        event.preventDefault();
        const codeInput = document.getElementById('CodyCartDiscountInput');
        if (codeInput && codeInput.value.trim()) {
          const code = encodeURIComponent(codeInput.value.trim());
          document.cookie = `discount_code=${code}; path=/`;
          if (window.CodyToast) {
            window.CodyToast.show(`Promo code "${codeInput.value.trim()}" applied for checkout`);
          }
        }
      }
    });

    document.addEventListener('change', (event) => {
      const lineQtyInput = event.target.closest('[data-cart-quantity-line]');
      if (lineQtyInput) {
        this.updateLineQuantity(lineQtyInput.dataset.cartQuantityLine, lineQtyInput.value);
        return;
      }

      if (event.target.matches('[data-cart-note-input]')) {
        fetch(`${window.routes.cart_update_url}.js`, {
          ...window.fetchConfig('json'),
          body: JSON.stringify({ note: event.target.value })
        });
        return;
      }

      if (event.target.matches('[data-cart-giftwrap-toggle]')) {
        fetch(`${window.routes.cart_update_url}.js`, {
          ...window.fetchConfig('json'),
          body: JSON.stringify({
            attributes: {
              'Luxury Gift Box': event.target.checked ? 'Yes' : 'No'
            }
          })
        });
      }
    });

    document.addEventListener('submit', (event) => {
      const ajaxForm = event.target.closest('[data-ajax-cart-form]');
      if (ajaxForm) {
        event.preventDefault();
        const formData = new FormData(ajaxForm);
        const variantId = formData.get('id');
        const qty = formData.get('quantity') || 1;
        const submitBtn = ajaxForm.querySelector('[type="submit"]');
        this.addItemByVariantId(variantId, qty, submitBtn);
      }
    });
  }
}

window.CodyCart = new CodyCartEngine();
