document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('product-grid');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartPanel = document.getElementById('cart-panel');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartCount = document.getElementById('cart-count');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const checkoutBtn = document.getElementById('checkout-btn');

  let globalProducts = [];
  let cart = [];

  function openCart() {
    cartSidebar.classList.remove('hidden');
    setTimeout(() => {
      cartOverlay.classList.remove('opacity-0');
      cartPanel.classList.remove('translate-x-full');
    }, 10);
    cartSidebar.classList.add('pointer-events-auto');
  }

  function closeCart() {
    cartOverlay.classList.add('opacity-0');
    cartPanel.classList.add('translate-x-full');
    setTimeout(() => {
      cartSidebar.classList.add('hidden');
    }, 300);
    cartSidebar.classList.remove('pointer-events-auto');
  }

  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  async function loadProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      productGrid.innerHTML = '';

      if (data?.data?.length > 0) {
        globalProducts = data.data;

        globalProducts.forEach((product) => {
          const activeVariant = product.product_variants?.[0];
          if (!activeVariant) {
            return;
          }

          const formattedPrice = (activeVariant.price_cents / 100).toFixed(2);

          const productCard = document.createElement('div');
          productCard.className = 'group flex flex-col relative';
          productCard.innerHTML = `
            <div class="w-full aspect-[3/4] bg-neutral-100 overflow-hidden relative border border-neutral-200/60">
              <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:scale-105 transition-transform duration-500">
                Premium Nyk Fit
              </div>
            </div>
            <div class="mt-4 flex justify-between items-start">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-black">${product.product_name}</h4>
                <p class="text-[11px] text-neutral-400 mt-1 uppercase tracking-widest">${activeVariant.color_name} / ${activeVariant.size_label}</p>
              </div>
              <span class="text-xs font-bold">$${formattedPrice}</span>
            </div>
            <button data-product-id="${product.product_id}" data-variant-id="${activeVariant.product_variant_id}" class="add-to-cart-trigger mt-3 w-full bg-black text-white text-[10px] font-bold tracking-widest uppercase py-3 hover:bg-neutral-800 transition-colors">
              Add To Bag
            </button>
          `;

          productGrid.appendChild(productCard);
        });

        document.querySelectorAll('.add-to-cart-trigger').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const productId = Number(e.currentTarget.getAttribute('data-product-id'));
            const variantId = Number(e.currentTarget.getAttribute('data-variant-id'));
            addToCart(productId, variantId);
          });
        });
      } else {
        productGrid.innerHTML =
          '<p class="text-xs tracking-widest uppercase text-neutral-400 col-span-full text-center">No inventory found in database.</p>';
      }
    } catch (error) {
      console.error('API Error:', error);
      productGrid.innerHTML =
        '<p class="text-xs font-bold uppercase text-red-500 col-span-full text-center">System Error: Cannot map database stream.</p>';
    }
  }

  function addToCart(productId, variantId) {
    const product = globalProducts.find((p) => p.product_id === productId);
    const variant = product?.product_variants?.find((v) => v.product_variant_id === variantId);

    if (!product || !variant) {
      return;
    }

    const existing = cart.find((c) => c.product_variant_id === variantId);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product_variant_id: variant.product_variant_id,
        product_name: product.product_name,
        variant_label: `${variant.color_name} / ${variant.size_label}`,
        price_cents: variant.price_cents,
        quantity: 1,
      });
    }

    updateCartUI();
    openCart();
  }

  function updateCartUI() {
    cartItemsList.innerHTML = '';
    let totalCount = 0;
    let totalCents = 0;

    cart.forEach((item) => {
      totalCount += item.quantity;
      totalCents += item.price_cents * item.quantity;

      const li = document.createElement('li');
      li.className = 'py-6 flex justify-between items-center';
      li.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0 w-12 h-16 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[8px] font-bold text-neutral-400">NYK</div>
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-black">${item.product_name}</h4>
            <p class="text-[10px] text-neutral-400 mt-0.5">${item.variant_label} • Qty: ${item.quantity}</p>
          </div>
        </div>
        <span class="text-xs font-bold">$${((item.price_cents * item.quantity) / 100).toFixed(2)}</span>
      `;
      cartItemsList.appendChild(li);
    });

    cartCount.innerText = String(totalCount);
    cartTotalPrice.innerText = `$${(totalCents / 100).toFixed(2)}`;
  }

  checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    try {
      checkoutBtn.innerText = 'REDIRECTING TO GATEWAY...';
      checkoutBtn.disabled = true;

      const payload = {
        items: cart.map((item) => ({
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gateway tracking broken');
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('Gateway tracking broken');
      }
    } catch (err) {
      console.error('Transaction fault:', err);
      alert('Payment gateway failed to initialize. Check system server variables.');
      checkoutBtn.innerText = 'SECURE CHECKOUT VIA STRIPE';
      checkoutBtn.disabled = false;
    }
  });

  loadProducts();
});
