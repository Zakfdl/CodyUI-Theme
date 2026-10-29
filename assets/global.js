/**
 * CodyUI Fashion — Core Web Components & Storefront Engine (global.js)
 * Handles Drawers, Modals, Quantity Steppers, Accordions, Tabs, Localization,
 * Product Card Swatches, Quick Add, Wishlist, Compare, and Recently Viewed.
 */

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: `application/${type}`
    }
  };
}

window.debounce = debounce;
window.fetchConfig = fetchConfig;

/* ==========================================================================
   1. Toast Notification Manager (<cody-toast-manager>)
   ========================================================================== */
class CodyToastManager extends HTMLElement {
  connectedCallback() {
    window.CodyToast = this;
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      window.subscribe(window.PUB_SUB_EVENTS.toastShow, ({ message, duration }) => {
        this.show(message, duration);
      });
    }
  }

  show(message, duration = 3400) {
    if (!message) return;
    const toast = document.createElement('div');
    toast.className = 'cody-toast';
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="cody-toast__dismiss" aria-label="Close">&times;</button>
    `;
    toast.querySelector('.cody-toast__dismiss').addEventListener('click', () => toast.remove());
    this.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
        setTimeout(() => toast.remove(), 220);
      }
    }, duration);
  }
}
if (!customElements.get('cody-toast-manager')) {
  customElements.define('cody-toast-manager', CodyToastManager);
}

/* ==========================================================================
   2. Slide-Out Drawer Component (<cody-drawer>)
   ========================================================================== */
class CodyDrawer extends HTMLElement {
  constructor() {
    super();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
    this.querySelectorAll('[data-drawer-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open(openerElement = null) {
    this.activeOpener = openerElement || document.activeElement;
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cody-lock-scroll');
    document.addEventListener('keydown', this.handleKeyDown);
    const focusTarget = this.querySelector('input, button:not([data-drawer-close]), [tabindex="0"]') || this.querySelector('[data-drawer-close]');
    if (focusTarget) {
      setTimeout(() => focusTarget.focus(), 100);
    }
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cody-lock-scroll');
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.activeOpener && typeof this.activeOpener.focus === 'function') {
      this.activeOpener.focus();
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
if (!customElements.get('cody-drawer')) {
  customElements.define('cody-drawer', CodyDrawer);
}

/* ==========================================================================
   3. Modal Dialog Component (<cody-modal>)
   ========================================================================== */
class CodyModal extends HTMLElement {
  constructor() {
    super();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
    this.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open(openerElement = null) {
    this.activeOpener = openerElement || document.activeElement;
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cody-lock-scroll');
    document.addEventListener('keydown', this.handleKeyDown);
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cody-lock-scroll');
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.activeOpener && typeof this.activeOpener.focus === 'function') {
      this.activeOpener.focus();
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
if (!customElements.get('cody-modal')) {
  customElements.define('cody-modal', CodyModal);
}

/* ==========================================================================
   4. Quantity Input Stepper (<cody-quantity-input>)
   ========================================================================== */
class CodyQuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    if (event.currentTarget.name === 'plus') {
      this.input.stepUp();
    } else {
      this.input.stepDown();
    }
    if (previousValue !== this.input.value) {
      this.input.dispatchEvent(this.changeEvent);
    }
  }
}
if (!customElements.get('cody-quantity-input')) {
  customElements.define('cody-quantity-input', CodyQuantityInput);
}

/* ==========================================================================
   5. Collapsible Accordion (<cody-accordion>)
   ========================================================================== */
class CodyAccordion extends HTMLElement {
  connectedCallback() {
    this.singleOpen = this.dataset.singleOpen === 'true';
    this.querySelectorAll('[data-accordion-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.cody-accordion-item');
        if (!item) return;
        const isOpen = item.classList.contains('is-open');

        if (this.singleOpen && !isOpen) {
          this.querySelectorAll('.cody-accordion-item.is-open').forEach((openItem) => {
            openItem.classList.remove('is-open');
            const btn = openItem.querySelector('[data-accordion-trigger]');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });
        }

        item.classList.toggle('is-open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }
}
if (!customElements.get('cody-accordion')) {
  customElements.define('cody-accordion', CodyAccordion);
}

/* ==========================================================================
   6. Accessible Tab Switcher (<cody-tabs>)
   ========================================================================== */
class CodyTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = Array.from(this.querySelectorAll('[data-tab-trigger]'));
    this.panels = Array.from(this.querySelectorAll('[data-tab-panel]'));

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        this.activateTab(tab.dataset.tabTrigger);
      });
    });
  }

  activateTab(targetId) {
    this.tabs.forEach((tab) => {
      const isActive = tab.dataset.tabTrigger === targetId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    this.panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === targetId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }
}
if (!customElements.get('cody-tabs')) {
  customElements.define('cody-tabs', CodyTabs);
}

/* ==========================================================================
   7. Localization Country / Language Form (<cody-localization-form>)
   ========================================================================== */
class CodyLocalizationForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.querySelectorAll('select, [data-localization-value]').forEach((el) => {
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', () => this.form.submit());
      } else {
        el.addEventListener('click', (event) => {
          event.preventDefault();
          const input = this.form.querySelector(`input[name="${el.dataset.inputName}"]`);
          if (input) {
            input.value = el.dataset.localizationValue;
            this.form.submit();
          }
        });
      }
    });
  }
}
if (!customElements.get('cody-localization-form')) {
  customElements.define('cody-localization-form', CodyLocalizationForm);
}

/* ==========================================================================
   8. CodyStorageManager — Wishlist, Compare & Recently Viewed Engine
   ========================================================================== */
class CodyStorageManager {
  constructor() {
    this.wishlistKey = 'cody_fashion_wishlist';
    this.compareKey = 'cody_fashion_compare';
    this.recentlyViewedKey = 'cody_fashion_recently_viewed';
    this.init();
  }

  getList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  saveList(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      // Storage quota or private mode fallback
    }
  }

  toggleWishlist(handle) {
    if (!handle) return false;
    const list = this.getList(this.wishlistKey);
    const index = list.indexOf(handle);
    let added = false;

    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.unshift(handle);
      added = true;
    }

    this.saveList(this.wishlistKey, list);
    this.syncUI();

    if (window.CodyToast && window.wishlistStrings) {
      window.CodyToast.show(added ? window.wishlistStrings.added : window.wishlistStrings.removed);
    }
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.wishlistUpdate, { list, handle, added });
    }
    return added;
  }

  toggleCompare(handle) {
    if (!handle) return false;
    const maxItems = (window.codyConfig && window.codyConfig.compareMaxItems) || 4;
    const list = this.getList(this.compareKey);
    const index = list.indexOf(handle);
    let added = false;

    if (index > -1) {
      list.splice(index, 1);
    } else {
      if (list.length >= maxItems) {
        list.pop();
      }
      list.unshift(handle);
      added = true;
    }

    this.saveList(this.compareKey, list);
    this.syncUI();

    if (window.CodyToast && window.wishlistStrings) {
      window.CodyToast.show(added ? window.wishlistStrings.compareAdded : window.wishlistStrings.compareRemoved);
    }
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.compareUpdate, { list, handle, added });
    }
    return added;
  }

  recordRecentlyViewed(handle) {
    if (!handle) return;
    const maxItems = (window.codyConfig && window.codyConfig.recentlyViewedLimit) || 8;
    const list = this.getList(this.recentlyViewedKey).filter((item) => item !== handle);
    list.unshift(handle);
    this.saveList(this.recentlyViewedKey, list.slice(0, maxItems));
  }

  syncUI() {
    const wishlist = this.getList(this.wishlistKey);
    const compare = this.getList(this.compareKey);

    document.querySelectorAll('[data-wishlist-count]').forEach((el) => {
      el.textContent = wishlist.length;
      el.toggleAttribute('hidden', wishlist.length === 0);
    });

    document.querySelectorAll('[data-compare-count]').forEach((el) => {
      el.textContent = compare.length;
      el.toggleAttribute('hidden', compare.length === 0);
    });

    document.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
      const active = wishlist.includes(btn.dataset.wishlistToggle);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-compare-toggle]').forEach((btn) => {
      const active = compare.includes(btn.dataset.compareToggle);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.syncUI();
    });

    document.addEventListener('click', (event) => {
      const drawerTrigger = event.target.closest('[data-drawer-open]');
      if (drawerTrigger) {
        event.preventDefault();
        const targetDrawer = document.getElementById(drawerTrigger.dataset.drawerOpen);
        if (targetDrawer && typeof targetDrawer.open === 'function') {
          targetDrawer.open(drawerTrigger);
        }
        return;
      }

      const modalTrigger = event.target.closest('[data-modal-open]');
      if (modalTrigger) {
        event.preventDefault();
        const targetModal = document.getElementById(modalTrigger.dataset.modalOpen);
        if (targetModal && typeof targetModal.open === 'function') {
          targetModal.open(modalTrigger);
        }
        return;
      }

      const wishlistBtn = event.target.closest('[data-wishlist-toggle]');
      if (wishlistBtn) {
        event.preventDefault();
        this.toggleWishlist(wishlistBtn.dataset.wishlistToggle);
        return;
      }

      const compareBtn = event.target.closest('[data-compare-toggle]');
      if (compareBtn) {
        event.preventDefault();
        this.toggleCompare(compareBtn.dataset.compareToggle);
        return;
      }

      const swatchBtn = event.target.closest('[data-card-swatch]');
      if (swatchBtn) {
        event.preventDefault();
        const card = swatchBtn.closest('[data-product-card]');
        if (card) {
          card.querySelectorAll('[data-card-swatch]').forEach((s) => s.classList.remove('is-active'));
          swatchBtn.classList.add('is-active');
          const primaryImg = card.querySelector('[data-card-primary-image]');
          if (primaryImg && swatchBtn.dataset.swatchImage) {
            primaryImg.src = swatchBtn.dataset.swatchImage;
            primaryImg.removeAttribute('srcset');
          }
          const productLinks = card.querySelectorAll('[data-card-link]');
          if (swatchBtn.dataset.variantUrl) {
            productLinks.forEach((link) => {
              link.href = swatchBtn.dataset.variantUrl;
            });
          }
        }
      }
    });
  }
}

window.CodyStore = new CodyStorageManager();
