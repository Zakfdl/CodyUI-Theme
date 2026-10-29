const ON_CHANGE_DEBOUNCE_TIMER = 300;

const PUB_SUB_EVENTS = {
  cartUpdate: 'cody:cart-update',
  quantityUpdate: 'cody:quantity-update',
  variantChange: 'cody:variant-change',
  cartError: 'cody:cart-error',
  wishlistUpdate: 'cody:wishlist-update',
  compareUpdate: 'cody:compare-update',
  quickViewOpen: 'cody:quickview-open',
  toastShow: 'cody:toast-show'
};

window.ON_CHANGE_DEBOUNCE_TIMER = ON_CHANGE_DEBOUNCE_TIMER;
window.PUB_SUB_EVENTS = PUB_SUB_EVENTS;
