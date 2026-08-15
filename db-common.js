// ============================================================
//  db-common.js
//  Bridge API for MySQL Express backend (Auth, Cart, Wishlist, Paintings).
//  Stateless, serverless-ready, and client-synced.
// ============================================================

export const dbReady = Promise.resolve({});

const listeners = [];
let cachedUser = null;

// Initialize cached user from localStorage immediately
try {
    const stored = localStorage.getItem('justart_user');
    if (stored) {
        cachedUser = JSON.parse(stored);
    }
} catch (e) {}

// Triggers callbacks registered by watchAuth
function notifyListeners(user) {
    cachedUser = user;
    if (user) {
        try { localStorage.setItem('justart_user', JSON.stringify(user)); } catch (e) {}
    } else {
        try { localStorage.removeItem('justart_user'); } catch (e) {}
    }
    for (const cb of listeners) {
        try {
            cb(cachedUser);
        } catch (e) {
            console.error("Error in auth observer callback:", e);
        }
    }
}

// Get user auth headers
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (cachedUser && cachedUser.uid) {
        headers['x-user-id'] = String(cachedUser.uid);
    }
    return headers;
}

/**
 * Subscribe to login state. callback(user) fires immediately with
 * the current user (or null) and again on every sign-in/sign-out.
 */
export function watchAuth(callback) {
    listeners.push(callback);
    callback(cachedUser);
}

export const defaultPaintings = [
    { id: 1, title: 'Whispers of Dawn', price: 549, image: 'whispers_of_dawn.jpg', featured: true },
    { id: 2, title: 'Eternal Silence', price: 799, image: 'eternal_silence.jpg', featured: true },
    { id: 3, title: 'Crimson Horizon', price: 649, image: 'crimson_horizon.jpg', featured: true },
    { id: 4, title: 'Dancing Shadows', price: 729, image: 'dancing_shadows.jpg', featured: true },
    { id: 5, title: 'Golden Afternoon', price: 499, image: 'golden_afternoon.jpg', featured: true },
    { id: 6, title: 'Midnight Reverie', price: 879, image: 'midnight_reverie.jpg', featured: true }
];

// ============================================================
// Paintings Management (Dynamic API with MySQL)
// ============================================================

/**
 * Fetch all paintings from the backend MySQL database.
 */
export async function fetchPaintings(options = {}) {
    try {
        const queryParams = new URLSearchParams();
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
        console.warn('Error fetching paintings, using local default:', err.message);
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
 */
export async function loadUserData(uid, email) {
    if (!uid) return { cart: [], wishlist: [] };
    try {
        const res = await fetch(`/api/user/data?userId=${uid}`, {
            headers: getAuthHeaders()
        });
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
 * Save this user's cart + wishlist into MySQL.
 */
export async function saveUserData(uid, data) {
    if (!uid) return;
    const res = await fetch('/api/user/data', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            userId: uid,
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
 * Sign out the current user.
 */
export async function logOut() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    notifyListeners(null);
}

// ============================================================
// Granular Cart & Wishlist API Methods
// ============================================================

export async function apiAddToCart(paintingId, qty) {
    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ qty })
    });
    if (!res.ok) {
        throw new Error('Failed to update cart quantity on server');
    }
    return await res.json();
}

export async function apiRemoveFromCart(paintingId) {
    const res = await fetch(`/api/cart/${paintingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from cart on server');
    }
    return await res.json();
}

export async function apiClearCart() {
    const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        throw new Error('Failed to clear cart on server');
    }
    return await res.json();
}

export async function apiAddToWishlist(paintingId) {
    const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paintingId })
    });
    if (!res.ok) {
        throw new Error('Failed to add item to wishlist on server');
    }
    return await res.json();
}

export async function apiRemoveFromWishlist(paintingId) {
    const res = await fetch(`/api/wishlist/${paintingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from wishlist on server');
    }
    return await res.json();
}
