// ============================================================
//  db-common.js
//  Bridge API replacing Firebase SDK with fetch calls to the
//  local MySQL Express backend. Keep signatures exact.
// ============================================================

// Compatibility helper representing the former setup promise
export const dbReady = Promise.resolve({});

const listeners = [];
let cachedUser = null;
let checkedMe = false;

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

/**
 * Add a painting to the cart on MySQL backend.
 */
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

/**
 * Update the quantity of a cart item on MySQL backend.
 */
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

/**
 * Remove an item from the cart on MySQL backend.
 */
export async function apiRemoveFromCart(paintingId) {
    const res = await fetch(`/api/cart/${paintingId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from cart on server');
    }
    return await res.json();
}

/**
 * Clear the user's cart on MySQL backend.
 */
export async function apiClearCart() {
    const res = await fetch('/api/cart', {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to clear cart on server');
    }
    return await res.json();
}

/**
 * Add an item to the wishlist on MySQL backend.
 */
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

/**
 * Remove an item from the wishlist on MySQL backend.
 */
export async function apiRemoveFromWishlist(paintingId) {
    const res = await fetch(`/api/wishlist/${paintingId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to remove item from wishlist on server');
    }
    return await res.json();
}
