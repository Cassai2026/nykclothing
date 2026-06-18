document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
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

    // State Engine
    let globalProducts = [];
    let cart = [];

    // --- SIDEBAR TOGGLE MECHANICS ---
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

    // --- CATALOG INITIALIZATION ---
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            productGrid.innerHTML = '';

            if (data && data.data && data.data.length > 0) {
                globalProducts = data.data;
                globalProducts.forEach(product => {
                    // Fallback configuration if inventory variables aren't seeded yet
                    const basePriceCents = product.product_variants?.[0]?.price_cents || 4500; 
                    const formattedPrice = (basePriceCents / 100).toFixed(2);

                    const productCard = document.createElement('div');
                    productCard.className = 'group flex flex-col relative';
                    productCard.innerHTML = \
                        <div class="w-full aspect-[3/4] bg-neutral-100 overflow-hidden relative border border-neutral-200/60">
                            <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:scale-105 transition-transform duration-500">
                                Premium Nyk Fit
                            </div>
                        </div>
                        <div class="mt-4 flex justify-between items-start">
                            <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-black">\</h4>
                                <p class="text-[11px] text-neutral-400 mt-1 uppercase tracking-widest">Standard Fit</p>
                            </div>
                            <span class="text-xs font-bold">£\</span>
                        </div>
                        <button data-id="\" class="add-to-cart-trigger mt-3 w-full bg-black text-white text-[10px] font-bold tracking-widest uppercase py-3 hover:bg-neutral-800 transition-colors">
                            Add To Bag
                        </button>
                    \;
                    productGrid.appendChild(productCard);
                });

                // Attach click capture arrays
                document.querySelectorAll('.add-to-cart-trigger').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const pid = e.target.getAttribute('data-id');
                        addToCart(pid);
                    });
                });
            } else {
                productGrid.innerHTML = '<p class="text-xs tracking-widest uppercase text-neutral-400 col-span-full text-center">No inventory found in database.</p>';
            }
        } catch (error) {
            console.error('API Error:', error);
            productGrid.innerHTML = '<p class="text-xs font-bold uppercase text-red-500 col-span-full text-center">System Error: Cannot map database stream.</p>';
        }
    }

    // --- CART STATE ACTIONS ---
    function addToCart(productId) {
        const item = globalProducts.find(p => p.product_id == productId);
        if (!item) return;

        const basePriceCents = item.product_variants?.[0]?.price_cents || 4500;
        const existing = cart.find(c => c.product_id === productId);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                product_id: item.product_id,
                name: item.product_name,
                price_cents: basePriceCents,
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
            li.className = 'py-6 flex justify-between items-center';
            li.innerHTML = \
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0 w-12 h-16 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[8px] font-bold text-neutral-400">NYK</div>
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-black">\</h4>
                        <p class="text-[10px] text-neutral-400 mt-0.5">Qty: \</p>
                    </div>
                </div>
                <span class="text-xs font-bold">£\</span>
            \;
            cartItemsList.appendChild(li);
        });

        cartCount.innerText = totalCount;
        cartTotalPrice.innerText = '£' + (totalCents / 100).toFixed(2);
    }

    // --- CHECKOUT ROUTING TRIGGER ---
    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) return alert('Your choice matrix is currently empty.');

        try {
            checkoutBtn.innerText = 'REDIRECTING TO GATEWAY...';
            checkoutBtn.disabled = true;

            const response = await fetch('/api/payments/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cart })
            });

            const result = await response.json();
            if (result.url) {
                window.location.href = result.url; // Fire transaction redirect
            } else {
                throw new Error(result.error || 'Gateway tracking broken');
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
