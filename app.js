const root = document.documentElement;
const language = root.lang === 'en' ? 'en' : 'es';
const messages = {
  es: {
    noProducts: 'No hay productos que coincidan. Probá otra búsqueda o cambiá de categoría.',
    productCount: count => `${count} ${count === 1 ? 'producto' : 'productos'}`,
    listen: 'Escuchar',
    stop: 'Parar',
    speechUnavailable: 'Su navegador no soporta la función de lectura de voz.',
    added: title => `«${title}» añadido a la cesta.`,
    orderComplete: 'Pedido procesado satisfactoriamente.',
    quoteReceived: '¡Gracias por su consulta técnica! Un especialista del Grupo E se comunicará para revisar las especificaciones ergonómicas.'
  },
  en: {
    noProducts: 'No matching products. Try another search or change the category.',
    productCount: count => `${count} ${count === 1 ? 'product' : 'products'}`,
    listen: 'Listen',
    stop: 'Stop',
    speechUnavailable: 'Your browser does not support text-to-speech.',
    added: title => `“${title}” added to your cart.`,
    orderComplete: 'Order processed successfully.',
    quoteReceived: 'Thank you for your technical inquiry! A Group E specialist will contact you to review your ergonomic requirements.'
  }
}[language];

// Keep the current section and query when moving between language URLs.
for (const link of document.querySelectorAll('[data-language]')) {
  link.addEventListener('click', () => {
    const destination = new URL(link.href);
    destination.search = window.location.search;
    destination.hash = window.location.hash;
    link.href = destination.href;
  });
}
const productsGrid = document.getElementById('productsGrid');
const productCards = [...productsGrid.querySelectorAll('.product-card')];
const filterChips = document.querySelectorAll('.filter-chip');
const categoryLinks = document.querySelectorAll('.header-nav [data-filter]');
const searchInput = document.getElementById('searchInput');
const catalogStatus = document.getElementById('catalogStatus');
let selectedCategory = 'all';

function updateCatalog() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  for (const card of productCards) {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === card.dataset.category;
    const matchesQuery = ['.product-title', '.product-desc'].some(selector =>
      card.querySelector(selector).textContent.toLowerCase().includes(query)
    );
    card.hidden = !(matchesCategory && matchesQuery);
    if (!card.hidden) visibleCount += 1;
  }

  for (const chip of filterChips) {
    const selected = chip.dataset.category === selectedCategory;
    chip.classList.toggle('active', selected);
    chip.setAttribute('aria-pressed', selected);
  }

  for (const link of categoryLinks) {
    const selected = link.dataset.filter === selectedCategory;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }

  const result = visibleCount === 0
    ? messages.noProducts
    : messages.productCount(visibleCount);
  if (catalogStatus.textContent !== result) catalogStatus.textContent = result;
}

for (const chip of filterChips) {
  chip.addEventListener('click', () => {
    selectedCategory = chip.dataset.category;
    updateCatalog();
  });
}

for (const link of categoryLinks) {
  link.addEventListener('click', () => {
    selectedCategory = link.dataset.filter;
    updateCatalog();
  });
}

searchInput.addEventListener('input', updateCatalog);
window.addEventListener('pageshow', updateCatalog);

document.getElementById('catalogSearch').addEventListener('submit', event => {
  event.preventDefault();
  updateCatalog();
  const catalog = document.getElementById('main-catalog');
  catalog.focus({ preventScroll: true });
  catalog.scrollIntoView();
});

const header = document.querySelector('.site-header');
new ResizeObserver(() => {
  root.style.setProperty('--header-height', `${header.offsetHeight}px`);
}).observe(header);

// Ajustes de lectura
const fontSizes = [87.5, 100, 112.5, 125, 137.5];
const decreaseButton = document.getElementById('a11y-decrease');
const increaseButton = document.getElementById('a11y-increase');
let fontSizeIndex = 1;

function changeFontSize(step) {
  fontSizeIndex = Math.max(0, Math.min(fontSizeIndex + step, fontSizes.length - 1));
  root.style.setProperty('--font-scale', `${fontSizes[fontSizeIndex]}%`);
  decreaseButton.disabled = fontSizeIndex === 0;
  increaseButton.disabled = fontSizeIndex === fontSizes.length - 1;
}

decreaseButton.addEventListener('click', () => changeFontSize(-1));
increaseButton.addEventListener('click', () => changeFontSize(1));

const contrastButton = document.getElementById('a11y-contrast');
contrastButton.addEventListener('click', () => {
  contrastButton.setAttribute('aria-pressed', root.classList.toggle('high-contrast'));
});

const dyslexiaButton = document.getElementById('a11y-dyslexia');
dyslexiaButton.addEventListener('click', () => {
  dyslexiaButton.setAttribute('aria-pressed', document.body.classList.toggle('dyslexia-mode'));
});

const speechButton = document.getElementById('a11y-speech');
let speech;

function stopSpeech() {
  speech = undefined;
  speechButton.textContent = messages.listen;
  speechButton.setAttribute('aria-pressed', 'false');
}

speechButton.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    alert(messages.speechUnavailable);
    return;
  }

  if (speech) {
    stopSpeech();
    window.speechSynthesis.cancel();
    return;
  }

  const message = new SpeechSynthesisUtterance(document.getElementById('main-content').innerText);
  message.lang = language === 'en' ? 'en-US' : 'es-ES';
  message.onend = message.onerror = () => {
    if (speech === message) stopSpeech();
  };
  speech = message;
  speechButton.textContent = messages.stop;
  speechButton.setAttribute('aria-pressed', 'true');
  window.speechSynthesis.speak(message);
});

// Carrito y compra simulada
const cart = new Map();
const openCartButton = document.getElementById('openCartBtn');
const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('cartOverlay');
const closeCartButton = drawer.querySelector('.cart-close-btn');
const cartItems = document.getElementById('cartItemsList');
const emptyCart = cartItems.querySelector('.cart-empty');
const cartItemTemplate = document.getElementById('cartItemTemplate');
const cartFooter = document.getElementById('cartFooter');
const checkoutButton = cartFooter.querySelector('.btn-checkout');
const checkout = document.getElementById('checkoutModal');
const finishCheckoutButton = checkout.querySelector('button');
const toast = document.getElementById('toastNotice');
let dialogOpener;
let toastTimer;

function openCart(opener) {
  dialogOpener = opener;
  drawer.inert = false;
  drawer.classList.add('open');
  overlay.classList.add('open');
  closeCartButton.focus();
}

function closeCart(restoreFocus = true) {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  drawer.inert = true;
  if (restoreFocus) dialogOpener?.focus();
}

function closeCheckout() {
  checkout.hidden = true;
  dialogOpener?.focus();
}

function formatPrice(amount) {
  return `€${language === 'es' ? amount.toFixed(2).replace('.', ',') : amount.toFixed(2)}`;
}

function renderCart() {
  let totalItems = 0;
  let subtotal = 0;
  const rows = [];

  for (const item of cart.values()) {
    totalItems += item.quantity;
    subtotal += item.price * item.quantity;
    const row = cartItemTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.sku = item.sku;
    row.querySelector('img').src = item.image;
    row.querySelector('.cart-item-title').textContent = item.title;
    row.querySelector('.cart-item-price').textContent = formatPrice(item.price);
    row.querySelector('.cart-qty-val').textContent = item.quantity;
    row.querySelector('.cart-item-total').textContent = formatPrice(item.price * item.quantity);
    rows.push(row);
  }

  emptyCart.hidden = cart.size > 0;
  cartItems.replaceChildren(emptyCart, ...rows);
  cartFooter.hidden = cart.size === 0;
  document.getElementById('cartCountBadge').textContent = totalItems;
  document.getElementById('cartItemCountText').textContent =
    `(${messages.productCount(totalItems)})`;
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartTotal').textContent = formatPrice(subtotal);
  try {
    sessionStorage.setItem('hobbignity-cart', JSON.stringify(
      [...cart.values()].map(({ sku, quantity }) => ({ sku, quantity }))
    ));
  } catch {
    // The cart still works when browser storage is unavailable.
  }
}

function restoreCart() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('hobbignity-cart') ?? '[]');
    if (!Array.isArray(saved)) return;
    for (const item of saved) {
      if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
      const card = productCards.find(card => card.querySelector('.btn-add-cart').dataset.sku === item.sku);
      if (!card) continue;
      cart.set(item.sku, {
        sku: item.sku,
        quantity: item.quantity,
        title: card.querySelector('.product-title').textContent.trim(),
        price: Number(card.querySelector('.btn-add-cart').dataset.price),
        image: card.querySelector('img').src
      });
    }
  } catch {
    // Ignore unavailable storage or invalid saved data.
  }
}

restoreCart();
renderCart();

function showToast(message) {
  toast.classList.add('show');
  document.getElementById('toastMessage').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

openCartButton.addEventListener('click', () => openCart(openCartButton));
closeCartButton.addEventListener('click', () => closeCart());
overlay.addEventListener('click', () => closeCart());

productsGrid.addEventListener('click', event => {
  const button = event.target.closest('.btn-add-cart');
  if (!button) return;

  const card = button.closest('.product-card');
  const { sku, price } = button.dataset;
  const title = card.querySelector('.product-title').textContent.trim();
  if (cart.has(sku)) {
    cart.get(sku).quantity += 1;
  } else {
    cart.set(sku, { sku, title, price: Number(price), image: card.querySelector('img').src, quantity: 1 });
  }
  renderCart();
  openCart(button);
  showToast(messages.added(title));
});

cartItems.addEventListener('click', event => {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;

  const action = button.dataset.cartAction;
  const { sku } = button.closest('.cart-item').dataset;
  const item = cart.get(sku);
  item.quantity += action === 'increase' ? 1 : -1;
  if (item.quantity === 0 || action === 'remove') cart.delete(sku);

  renderCart();
  const row = [...cartItems.querySelectorAll('.cart-item')].find(element => element.dataset.sku === sku);
  (row?.querySelector(`[data-cart-action="${action}"]`) ?? closeCartButton).focus();
});

checkoutButton.addEventListener('click', () => {
  document.getElementById('checkoutTotalAmount').textContent = document.getElementById('cartTotal').textContent;
  document.getElementById('checkoutOrderRef').textContent = `#HBN-${Math.floor(10000 + Math.random() * 90000)}`;
  closeCart(false);
  checkout.hidden = false;
  finishCheckoutButton.focus();
});

finishCheckoutButton.addEventListener('click', () => {
  cart.clear();
  renderCart();
  closeCheckout();
  showToast(messages.orderComplete);
});

document.addEventListener('keydown', event => {
  const activeDialog = !checkout.hidden ? checkout : !drawer.inert ? drawer : null;
  if (!activeDialog) return;

  if (event.key === 'Escape') {
    if (activeDialog === checkout) closeCheckout();
    else closeCart();
  }

  if (event.key === 'Tab') {
    const buttons = [...activeDialog.querySelectorAll('button')].filter(button => button.getClientRects().length);
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.getElementById('quoteForm').addEventListener('submit', event => {
  event.preventDefault();
  alert(messages.quoteReceived);
  event.currentTarget.reset();
});
