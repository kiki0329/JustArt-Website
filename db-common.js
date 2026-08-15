// ============================================================
//  db-common.js
//  Bridge API replacing Firebase SDK with fetch calls to the
//  MySQL Express backend (Auth, Cart, Wishlist, Paintings).
// ============================================================

// Compatibility helper representing the former setup promise
export const dbReady = Promise.resolve({});

const listeners = [];
let cachedUser = null;
let checkedMe = false;

// Fallback paintings array in case server is loading or offline
export const defaultPaintings = [
    { id: 1, title: 'Whispers of Dawn', artist: 'Elena Voss', category: 'Landscape', price: 549, image: 'https://picsum.photos/seed/dawn_blue/400/500', featured: true },
    { id: 2, title: 'Eternal Silence', artist: 'Marcus Reed', category: 'Portrait', price: 799, image: 'https://picsum.photos/seed/silence_blue/400/500', featured: true },
    { id: 3, title: 'Crimson Horizon', artist: 'Sophia Chen', category: 'Abstract', price: 649, image: 'https://picsum.photos/seed/crimson_blue/400/500', featured: true },
    { id: 4, title: 'Dancing Shadows', artist: 'Oliver Stone', category: 'Expressionism', price: 729, image: 'https://picsum.photos/seed/shadow_blue/400/500', featured: true },
    { id: 5, title: 'Golden Afternoon', artist: 'Clara Belle', category: 'Impressionism', price: 499, image: 'https://picsum.photos/seed/golden_blue/400/500', featured: false },
    { id: 6, title: 'Midnight Reverie', artist: 'Julian Cross', category: 'Surrealism', price: 879, image: 'https://picsum.photos/seed/midnight_blue/400/500', featured: false },
    { id: 7, title: 'Ocean\'s Whisper', artist: 'Nina Torres', category: 'Seascape', price: 599, image: 'https://picsum.photos/seed/ocean_blue/400/500', featured: false },
    { id: 8, title: 'Autumn Melody', artist: 'Henry Wright', category: 'Landscape', price: 399, image: 'https://picsum.photos/seed/autumn_blue/400/500', featured: false },
    { id: 9, title: 'Celestial Dreams', artist: 'Iris Moon', category: 'Abstract', price: 699, image: 'https://picsum.photos/seed/celestial_blue/400/500', featured: false },
    { id: 10, title: 'Whispering Pines', artist: 'David Grey', category: 'Landscape', price: 479, image: 'https://picsum.photos/seed/pines_blue/400/500', featured: false },
    { id: 11, title: 'Silent Revolution', artist: 'Zara Khan', category: 'Contemporary', price: 949, image: 'https://picsum.photos/seed/revolution_blue/400/500', featured: false },
    { id: 12, title: 'Ethereal Bloom', artist: 'Lily Rose', category: 'Floral', price: 529, image: 'https://picsum.photos/seed/bloom_blue/400/500', featured: false },
    { id: 13, title: 'Urban Solitude', artist: 'Arjun Mehta', category: 'Contemporary', price: 659, image: 'https://picsum.photos/seed/urban_blue/400/500', featured: false },
    { id: 14, title: 'Mystic Gaze', artist: 'Priya Sharma', category: 'Portrait', price: 899, image: 'https://picsum.photos/seed/mystic_blue/400/500', featured: false },
    { id: 15, title: 'Rustic Charms', artist: 'Ananya Reddy', category: 'Impressionism', price: 569, image: 'https://picsum.photos/seed/rustic_blue/400/500', featured: false },
    { id: 16, title: 'Neon Dreams', artist: 'Vikram Seth', category: 'Abstract', price: 999, image: 'https://picsum.photos/seed/neon_blue/400/500', featured: false },
    { id: 17, title: 'Serene Shores', artist: 'Meera Nair', category: 'Seascape', price: 449, image: 'https://picsum.photos/seed/serene_blue/400/500', featured: false },
    { id: 18, title: 'Blossom Trail', artist: 'Ravi Verma', category: 'Floral', price: 749, image: 'https://picsum.photos/seed/blossom_blue/400/500', featured: false },
    { id: 19, title: 'Fading Echoes', artist: 'Sana Khan', category: 'Expressionism', price: 629, image: 'https://picsum.photos/seed/echoes_blue/400/500', featured: false },
    { id: 20, title: 'Tranquil Peaks', artist: 'Aisha Kapoor', category: 'Landscape', price: 539, image: 'https://picsum.photos/seed/peaks_blue/400/500', featured: false },
    { id: 21, title: 'Whimsical Forest', artist: 'Kabir Singh', category: 'Surrealism', price: 829, image: 'https://picsum.photos/seed/forest_blue/400/500', featured: false },
    { id: 22, title: 'Timeless Grace', artist: 'Lakshmi Menon', category: 'Portrait', price: 929, image: 'https://picsum.photos/seed/grace_blue/400/500', featured: false },
    { id: 23, title: 'Modern Muse', artist: 'Rahul Khanna', category: 'Contemporary', price: 719, image: 'https://picsum.photos/seed/muse_blue/400/500', featured: false },
    { id: 24, title: 'Golden Horizon', artist: 'Maya Patel', category: 'Impressionism', price: 589, image: 'https://picsum.photos/seed/horizon_blue/400/500', featured: false },
    { id: 25, title: 'Abstract Reality', artist: 'Arnav Bose', category: 'Abstract', price: 979, image: 'https://picsum.photos/seed/reality_blue/400/500', featured: false },
    { id: 26, title: 'Mountain Echo', artist: 'Neha Gupta', category: 'Landscape', price: 349, image: 'https://picsum.photos/seed/mountain_blue/400/500', featured: false }
];

// Triggers callbacks registered by watchAuth
function notifyListeners(user) {
    cachedUser = user;
    for (const cb of listeners) {
        try {
            cb(cachedUser);
        } catch (e) {
            console.error("Error in auth observer callback:", e);
        }
    }
}

/**
 * Subscribe to login state. callback(user) fires immediately with
 * the current user (or null) and again on every sign-in/sign-out.
 */
export async function watchAuth(callback) {
    listeners.push(callback);
    
    if (checkedMe) {
        callback(cachedUser);
        return;
    }
    
    checkedMe = true;
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            cachedUser = data.user || null;
        } else {
            cachedUser = null;
        }
    } catch (err) {
        console.error("Error during initial auth state check:", err);
        cachedUser = null;
    }
    
    // Invoke all listeners with determined user state
    for (const cb of listeners) {
        cb(cachedUser);
    }
}

// ============================================================
// Paintings Management (Dynamic API with MySQL)
// ============================================================

/**
 * Fetch all paintings from the backend MySQL database.
 * Falls back to defaultPaintings if network fails.
 */
export async function fetchPaintings(options = {}) {
    try {
        const queryParams = new URLSearchParams();
        if (options.category && options.category !== 'All') {
            queryParams.append('category', options.category);
        }
        if (options.featured) {
            queryParams.append('featured', 'true');
        }
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await fetch(`/api/paintings${qs}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch paintings: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return data;
        }
        return defaultPaintings;
    } catch (err) {
        console.warn('Using default paintings fallback:', err.message);
        return defaultPaintings;
    }
}

/**
 * Add a new painting to MySQL.
 */
export async function apiAddPainting(paintingData) {
    const res = await fetch('/api/paintings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paintingData)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to add painting');
    }
    return data;
}

/**
 * Update an existing painting in MySQL.
 */
export async function apiUpdatePainting(id, paintingData) {
    const res = await fetch(`/api/paintings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paintingData)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to update painting');
    }
    return data;
}

/**
 * Delete a painting from MySQL.
 */
export async function apiDeletePainting(id) {
    const res = await fetch(`/api/paintings/${id}`, {
        method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to delete painting');
    }
    return data;
}

// ============================================================
// User Data (Cart & Wishlist)
// ============================================================

/**
 * Fetch this user's saved data (cart + wishlist) from MySQL.
 * Returns { cart: [], wishlist: [] }.
 */
export async function loadUserData(uid, email) {
    try {
        const res = await fetch('/api/user/data');
        if (!res.ok) {
            throw new Error('Failed to load user data from backend');
        }
        const data = await res.json();
        return {
            cart: data.cart || [],
            wishlist: data.wishlist || []
        };
    } catch (err) {
        console.error('Error in loadUserData:', err);
        return { cart: [], wishlist: [] };
    }
}

/**
 * Save/merge this user's cart + wishlist into MySQL.
 * Only touches the fields passed in — existing fields are kept.
 */
export async function saveUserData(uid, data) {
    const res = await fetch('/api/user/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cart: data.cart || [],
            wishlist: data.wishlist || []
        })
    });
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save user data');
    }
}

// ============================================================
// Auth Methods
// ============================================================

/**
 * Create a brand-new account in MySQL.
 */
export async function signUp(email, password) {
    const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || 'Sign up failed');
        err.code = data.code || 'auth/unknown';
        throw err;
    }
    notifyListeners(data.user);
    return data.user;
}

/**
 * Sign in an existing account in MySQL.
 */
export async function signIn(email, password) {
    const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || 'Sign in failed');
        err.code = data.code || 'auth/unknown';
        throw err;
    }
    notifyListeners(data.user);
    return data.user;
}

/**
 * Sign out the current user and destroy their session.
 */
export async function logOut() {
    try {
        const res = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        if (res.ok) {
            notifyListeners(null);
        } else {
            console.error('Logout request was not successful');
        }
    } catch (e) {
        console.error('Error during logOut request:', e);
    }
}

// ============================================================
// Granular Cart & Wishlist API Methods
// ============================================================

export async function apiAddToCart(paintingId, qty) {
    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paintingId, qty })
    });
    if (!res.ok) {
        throw new Error('Failed to add item to cart on server');
    }
    return await res.json();
}

export async function apiUpdateCartQty(paintingId, qty) {
    const res = await fetch(`/api/cart/${paintingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty })
    });
    if (!res.ok) {
        throw new Error('Failed to update cart quantity on server');
    }
    return await res.json();
}

export async function apiRemoveFromCart(paintingId) {
    const res = await fetch(`/api/cart/${paintingId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from cart on server');
    }
    return await res.json();
}

export async function apiClearCart() {
    const res = await fetch('/api/cart', {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to clear cart on server');
    }
    return await res.json();
}

export async function apiAddToWishlist(paintingId) {
    const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paintingId })
    });
    if (!res.ok) {
        throw new Error('Failed to add item to wishlist on server');
    }
    return await res.json();
}

export async function apiRemoveFromWishlist(paintingId) {
    const res = await fetch(`/api/wishlist/${paintingId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from wishlist on server');
    }
    return await res.json();
}
