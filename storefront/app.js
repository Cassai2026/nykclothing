document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    // The address of your local backend API
    const API_URL = '/api/products';

    async function loadProducts() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            
            // Clear the "Connecting..." message
            productGrid.innerHTML = '';

            // Check if the vault sent back our items
            if (data && data.data && data.data.length > 0) {
                data.data.forEach(product => {
                    // Create a slick card for every product
                    const card = document.createElement('div');
                    card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100';
                    card.innerHTML = \
                        <div class="h-64 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-400">
                            [ Image Placeholder ]
                        </div>
                        <h3 class="text-xl font-bold mb-2">\</h3>
                        <p class="text-gray-600 text-sm mb-4">\</p>
                        <button class="w-full bg-black text-white py-3 rounded-md font-bold hover:bg-gray-800 transition-colors">
                            View Details
                        </button>
                    \;
                    productGrid.appendChild(card);
                });
            } else {
                productGrid.innerHTML = '<p class="text-center col-span-3 text-gray-500">The vault is currently empty.</p>';
            }
        } catch (error) {
            console.error('Failed to connect to the backend:', error);
            productGrid.innerHTML = '<p class="text-center col-span-3 text-red-500 font-bold">Error: Cannot reach the database vault.</p>';
        }
    }

    loadProducts();
});
