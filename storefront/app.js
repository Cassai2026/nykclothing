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
    }

    function closeCart() {
        cartOverlay.classList.add('opacity-0');
        cartPanel.classList.add('translate-x-full');
        setTimeout(() => { cartSidebar.classList.add('hidden'); }, 300);
    }

    openCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            productGrid.innerHTML = '';

            if (data && data.data && data.data.length > 0) {
                globalProducts = data.data;
                globalProducts.forEach(product => {
                    const activeVariant = product.product_variants?.[0];
                    if (!activeVariant) return;

                    const formattedPrice = (activeVariant.price_cents / 100).toFixed(2);
                    const card = document.createElement('div');
                    card.className = 'group flex flex-col relative';
                    
                    card.innerHTML = \
                        <div class="w-full aspect-[3/4] bg-neutral-100 overflow-hidden relative border border-neutral-200/60">
                            <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:scale-105 transition-transform duration-500">
                                NYK Core Silhouette
                            </div>
                        </div>
                        <div class="mt-4 flex justify-between items-start">
                            <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-black">\</h4>
                                <p class="text-[11px] text-neutral-400 mt-1 uppercase tracking-widest">\ / \</p>
                            </div>
                            <span class="text-xs font-bold">£\</span>
                        </div>
                        <button data-variant-id="\" class="add-to-cart-trigger mt-3 w-full bg-black text-white text-[10px] font-bold tracking-widest uppercase py-3 hover:bg-neutral-800 transition-colors">
                            Add To Bag
                        </button>
                    \;
                    productGrid.appendChild(card);
                });

                document.querySelectorAll('.add-to-cart-trigger').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        addToCart(e.target.getAttribute('data-variant-id'));
                    });
                });
            } else {
                productGrid.innerHTML = '<p class="text-xs tracking-widest uppercase text-neutral-400 col-span-full text-center">No active inventory online.</p>';
            }
        } catch (error) {
            productGrid.innerHTML = '<p class="text-xs font-bold uppercase text-red-500 col-span-full text-center">System connection interruption.</p>';
        }
    }

    function addToCart(variantId) {
        let matchedProduct = null;
        let matchedVariant = null;

        for (let p of globalProducts) {
            let v = p.product_variants.find(v => v.variant_id === variantId);
            if (v) {
                matchedProduct = p;
                matchedVariant = v;
                break;
            }
        }

        if (!matchedProduct || !matchedVariant) return;

        const existing = cart.find(item => item.variant_id === variantId);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                variant_id: matchedVariant.variant_id,
                name: matchedProduct.product_name,
                size: matchedVariant.size,
                price_cents: matchedVariant.price_cents,
                quantity: 1
            });
        }
        updateCartUI();
        openCart();
    }

    function updateCartUI() {
        cartItemsList.innerHTML = '';
        let totalCount = 0;
        let totalCents = 0;

        cart.forEach(item => {
            totalCount += item.quantity;
            totalCents += item.price_cents * item.quantity;

            const li = document.createElement('li');
            li.className = 'py-4 flex justify-between items-center';
            li.innerHTML = \
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[8px] font-bold text-neutral-400">NYK</div>
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-black">\</h4>
                        <p class="text-[10px] text-neutral-400 mt-0.5">\var{item.size} x \</p>
                    </div>
                </div>
                <span class="text-xs font-bold">£\</span>
            \;
            cartItemsList.appendChild(li);
        });

        cartCount.innerText = totalCount;
        cartTotalPrice.innerText = '£' + (totalCents / 100).toFixed(2);
    }

    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) return;

        try {
            checkoutBtn.innerText = 'REDIRECTING TO GATEWAY...';
            checkoutBtn.disabled = true;

            const cleanPayload = cart.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity
            }));

            const response = await fetch('/api/payments/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cleanPayload })
            });

            const result = await response.json();
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error();
            }
        } catch (err) {
            alert('Gateway authentication failure.');
            checkoutBtn.innerText = 'SECURE CHECKOUT VIA STRIPE';
            checkoutBtn.disabled = false;
        }
    });

    loadProducts();
});
