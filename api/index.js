// api/index.js
// Vercel Serverless Function entry point
// Handles all API endpoints (Auth, Cart, Wishlist, Paintings CRUD) without artist/category requirements.

require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();

// Enable CORS & Preflight handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Parse JSON and form payloads with 15MB limit for direct photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to extract user ID from request (supports headers, query, body, or session)
function getReqUserId(req) {
    const headerUid = req.headers['x-user-id'];
    if (headerUid) return parseInt(headerUid, 10);
    if (req.query && req.query.userId) return parseInt(req.query.userId, 10);
    if (req.body && req.body.userId) return parseInt(req.body.userId, 10);
    return null;
}

// MySQL Database connection pool (supports cloud MySQL with SSL automatically)
const isCloudDb = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'justart',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined
});

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mkiruthika659@gmail.com').trim().toLowerCase();

// Helper to check if request user is admin
async function isReqAdmin(req) {
    const userId = getReqUserId(req);
    if (!userId) return false;
    try {
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].email.trim().toLowerCase() === ADMIN_EMAIL) {
            return true;
        }
    } catch (e) {
        console.error('Error checking admin user:', e);
    }
    return false;
}

// Automatically create database and tables if they don't exist
async function initializeDatabase() {
    try {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;
        const createPaintingsTable = `
            CREATE TABLE IF NOT EXISTS paintings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) DEFAULT '',
                category VARCHAR(255) DEFAULT 'Original',
                price DECIMAL(10, 2) NOT NULL,
                image_url MEDIUMTEXT NOT NULL,
                featured TINYINT DEFAULT 0
            ) ENGINE=InnoDB;
        `;
        const createCartItemsTable = `
            CREATE TABLE IF NOT EXISTS cart_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                painting_id INT NOT NULL,
                qty INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (painting_id) REFERENCES paintings(id) ON DELETE CASCADE,
                UNIQUE KEY user_painting_idx (user_id, painting_id)
            ) ENGINE=InnoDB;
        `;
        const createWishlistItemsTable = `
            CREATE TABLE IF NOT EXISTS wishlist_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                painting_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (painting_id) REFERENCES paintings(id) ON DELETE CASCADE,
                UNIQUE KEY user_painting_idx (user_id, painting_id)
            ) ENGINE=InnoDB;
        `;

        await pool.query(createUsersTable);
        await pool.query(createPaintingsTable);
        await pool.query(createCartItemsTable);
        await pool.query(createWishlistItemsTable);

        // Ensure image_url column is MEDIUMTEXT to hold base64 image data
        try {
            await pool.query('ALTER TABLE paintings MODIFY image_url MEDIUMTEXT NOT NULL;');
        } catch (e) {}

        // Remove old dummy internet paintings and old starter .jpg records
        try {
            await pool.query("DELETE FROM paintings WHERE image_url LIKE '%picsum.photos%' OR image_url LIKE '%.jpg'");
        } catch (e) {}

        console.log('Database tables verified/created successfully.');
    } catch (err) {
        console.error('Error verifying/creating database tables:', err.message);
    }
}

let dbInitialized = false;

async function ensureDbReady() {
    if (!dbInitialized) {
        await initializeDatabase();
        dbInitialized = true;
    }
}

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
    try {
        await ensureDbReady();
    } catch (err) {
        console.error('Database connection warning:', err.message);
    }
    next();
});

// ------------------------------------------------------------
// API Router (handles both /api/... and /... prefixes)
// ------------------------------------------------------------
const apiRouter = express.Router();

// ============================================================
// Paintings CRUD Endpoints (Simplified: Title, Price, Image, Featured)
// ============================================================

// GET /api/paintings - Fetch all paintings from MySQL
apiRouter.get('/paintings', async (req, res) => {
    try {
        const { featured } = req.query;
        let query = 'SELECT * FROM paintings';
        const params = [];
        const conditions = [];

        if (featured === 'true' || featured === '1') {
            conditions.push('featured = 1');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY id DESC';

        const [rows] = await pool.query(query, params);
        const formatted = rows.map(p => ({
            id: Number(p.id),
            title: p.title,
            price: Number(p.price),
            image: p.image_url,
            featured: Boolean(p.featured)
        }));
        return res.json(formatted);
    } catch (err) {
        console.error('Error fetching paintings:', err);
        return res.status(500).json({ error: 'Server error fetching paintings' });
    }
});

// GET /api/paintings/:id - Fetch single painting
apiRouter.get('/paintings/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await pool.query('SELECT * FROM paintings WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Painting not found' });
        }
        const p = rows[0];
        return res.json({
            id: Number(p.id),
            title: p.title,
            price: Number(p.price),
            image: p.image_url,
            featured: Boolean(p.featured)
        });
    } catch (err) {
        console.error('Error fetching single painting:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/paintings - Add a new painting (Admin only)
apiRouter.post('/paintings', async (req, res) => {
    const isAdmin = await isReqAdmin(req);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied: Only the administrator can add paintings.' });
    }

    const { title, price, image, featured } = req.body;
    if (!title || price === undefined || !image) {
        return res.status(400).json({ error: 'Title, price, and image are required' });
    }
    try {
        const [maxRows] = await pool.query('SELECT MAX(id) as maxId FROM paintings');
        const nextId = (maxRows[0].maxId || 0) + 1;

        await pool.query(
            'INSERT INTO paintings (id, title, artist, category, price, image_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nextId, title.trim(), '', 'Original', Number(price), image, featured ? 1 : 0]
        );

        console.log(`Created new painting: ID ${nextId} - "${title}" ($${price})`);
        return res.status(201).json({
            id: nextId,
            title: title.trim(),
            price: Number(price),
            image: image,
            featured: Boolean(featured)
        });
    } catch (err) {
        console.error('Error creating painting:', err);
        return res.status(500).json({ error: 'Server error creating painting' });
    }
});

// PUT /api/paintings/:id - Update an existing painting (Admin only)
apiRouter.put('/paintings/:id', async (req, res) => {
    const isAdmin = await isReqAdmin(req);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied: Only the administrator can update paintings.' });
    }

    const id = req.params.id;
    const { title, price, image, featured } = req.body;
    if (!title || price === undefined || !image) {
        return res.status(400).json({ error: 'Title, price, and image are required' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE paintings SET title = ?, price = ?, image_url = ?, featured = ? WHERE id = ?',
            [title.trim(), Number(price), image, featured ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Painting not found' });
        }

        console.log(`Updated painting ID ${id}: "${title}" ($${price})`);
        return res.json({
            id: Number(id),
            title: title.trim(),
            price: Number(price),
            image: image,
            featured: Boolean(featured)
        });
    } catch (err) {
        console.error('Error updating painting:', err);
        return res.status(500).json({ error: 'Server error updating painting' });
    }
});

// DELETE /api/paintings/:id - Delete a painting (Admin only)
apiRouter.delete('/paintings/:id', async (req, res) => {
    const isAdmin = await isReqAdmin(req);
    if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied: Only the administrator can delete paintings.' });
    }

    const id = req.params.id;
    try {
        const [result] = await pool.query('DELETE FROM paintings WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Painting not found' });
        }
        console.log(`Deleted painting ID ${id}`);
        return res.json({ success: true, message: `Painting ID ${id} deleted` });
    } catch (err) {
        console.error('Error deleting painting:', err);
        return res.status(500).json({ error: 'Server error deleting painting' });
    }
});

// ============================================================
// Auth & User Endpoints (Stateless for Serverless Compatibility)
// ============================================================

// Sign Up
apiRouter.post('/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required', code: 'auth/invalid-email' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'auth/weak-password' });
    }
    try {
        const userEmail = email.trim().toLowerCase();
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already in use', code: 'auth/email-already-in-use' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [userEmail, hash]);
        const userId = result.insertId;

        const isAdmin = userEmail === ADMIN_EMAIL;
        const user = { uid: userId, email: userEmail, isAdmin };
        console.log(`Successful SignUp: user ID ${userId}, email: ${user.email}, isAdmin: ${isAdmin}`);
        return res.json({ user });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Server error', code: 'auth/internal-error' });
    }
});

// Sign In
apiRouter.post('/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required', code: 'auth/invalid-credential' });
    }
    try {
        const userEmail = email.trim().toLowerCase();
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'No user found with this email', code: 'auth/user-not-found' });
        }
        const userRecord = users[0];

        const isMatch = await bcrypt.compare(password, userRecord.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password', code: 'auth/wrong-password' });
        }

        const isAdmin = userEmail === ADMIN_EMAIL;
        const user = { uid: userRecord.id, email: userRecord.email, isAdmin };
        console.log(`Successful SignIn: user ID ${userRecord.id}, email: ${userRecord.email}, isAdmin: ${isAdmin}`);
        return res.json({ user });
    } catch (err) {
        console.error('Signin error:', err);
        return res.status(500).json({ error: 'Server error', code: 'auth/internal-error' });
    }
});

// Sign Out
apiRouter.post('/auth/logout', (req, res) => {
    return res.json({ success: true });
});

// Check Session / Current User
apiRouter.get('/auth/me', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) {
        return res.json({ user: null });
    }
    try {
        const [users] = await pool.query('SELECT id, email FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
            const userEmail = users[0].email.trim().toLowerCase();
            const isAdmin = userEmail === ADMIN_EMAIL;
            return res.json({ user: { uid: users[0].id, email: users[0].email, isAdmin } });
        }
        return res.json({ user: null });
    } catch (e) {
        return res.json({ user: null });
    }
});

// Load User Data (Cart & Wishlist)
apiRouter.get('/user/data', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) {
        return res.json({ cart: [], wishlist: [] });
    }
    try {
        const [cartRows] = await pool.query(
            'SELECT c.painting_id as id, c.qty, p.price FROM cart_items c JOIN paintings p ON c.painting_id = p.id WHERE c.user_id = ?',
            [userId]
        );
        const [wishlistRows] = await pool.query(
            'SELECT painting_id as id FROM wishlist_items WHERE user_id = ?',
            [userId]
        );

        const cart = cartRows.map(item => ({
            id: Number(item.id),
            qty: Number(item.qty),
            price: Number(item.price)
        }));

        const wishlist = wishlistRows.map(item => ({
            id: Number(item.id)
        }));

        return res.json({ cart, wishlist });
    } catch (err) {
        console.error('Error fetching user data from MySQL:', err);
        return res.status(500).json({ error: 'Server error fetching user data' });
    }
});

// Save User Data (Cart & Wishlist)
apiRouter.post('/user/data', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized user action' });
    }
    const { cart, wishlist } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        if (Array.isArray(cart) && cart.length > 0) {
            for (const item of cart) {
                if (item && item.id) {
                    await connection.query(
                        'INSERT INTO cart_items (user_id, painting_id, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = ?',
                        [userId, item.id, item.qty || 1, item.qty || 1]
                    );
                }
            }
        }

        await connection.query('DELETE FROM wishlist_items WHERE user_id = ?', [userId]);
        if (Array.isArray(wishlist) && wishlist.length > 0) {
            for (const item of wishlist) {
                if (item && item.id) {
                    await connection.query(
                        'INSERT IGNORE INTO wishlist_items (user_id, painting_id) VALUES (?, ?)',
                        [userId, item.id]
                    );
                }
            }
        }

        await connection.commit();
        return res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error('Error syncing user data to MySQL:', err);
        return res.status(500).json({ error: 'Server error saving user data' });
    } finally {
        connection.release();
    }
});

// ============================================================
// Cart Endpoints
// ============================================================

// GET /cart - Fetch user cart
apiRouter.get('/cart', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.json([]);
    try {
        const [cartRows] = await pool.query(
            'SELECT c.painting_id as id, c.qty, p.price FROM cart_items c JOIN paintings p ON c.painting_id = p.id WHERE c.user_id = ?',
            [userId]
        );
        const cart = cartRows.map(item => ({
            id: Number(item.id),
            qty: Number(item.qty),
            price: Number(item.price)
        }));
        return res.json(cart);
    } catch (err) {
        console.error('Error fetching cart:', err);
        return res.status(500).json({ error: 'Server error fetching cart' });
    }
});

// POST /cart - Add painting to cart
apiRouter.post('/cart', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { paintingId, qty } = req.body;
    if (!paintingId) return res.status(400).json({ error: 'paintingId is required' });
    try {
        const [paintings] = await pool.query('SELECT * FROM paintings WHERE id = ?', [paintingId]);
        if (paintings.length === 0) return res.status(400).json({ error: 'Invalid painting ID' });
        await pool.query(
            'INSERT INTO cart_items (user_id, painting_id, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = ?',
            [userId, paintingId, qty || 1, qty || 1]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Error adding to cart:', err);
        return res.status(500).json({ error: 'Server error adding to cart' });
    }
});

// PUT /cart/:itemId - Update item quantity
apiRouter.put('/cart/:itemId', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const paintingId = req.params.itemId;
    const { qty } = req.body;
    if (qty === undefined || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });
    try {
        await pool.query(
            'UPDATE cart_items SET qty = ? WHERE user_id = ? AND painting_id = ?',
            [qty, userId, paintingId]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        return res.status(500).json({ error: 'Server error updating cart quantity' });
    }
});

// DELETE /cart/:itemId - Remove item from cart
apiRouter.delete('/cart/:itemId', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const paintingId = req.params.itemId;
    try {
        await pool.query(
            'DELETE FROM cart_items WHERE user_id = ? AND painting_id = ?',
            [userId, paintingId]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Error deleting from cart:', err);
        return res.status(500).json({ error: 'Server error deleting from cart' });
    }
});

// DELETE /cart - Clear user cart
apiRouter.delete('/cart', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        return res.json({ success: true });
    } catch (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ error: 'Server error clearing cart' });
    }
});

// ============================================================
// Wishlist Endpoints
// ============================================================

// GET /wishlist - Fetch user wishlist
apiRouter.get('/wishlist', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.json([]);
    try {
        const [wishlistRows] = await pool.query(
            'SELECT painting_id as id FROM wishlist_items WHERE user_id = ?',
            [userId]
        );
        const wishlist = wishlistRows.map(item => ({
            id: Number(item.id)
        }));
        return res.json(wishlist);
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        return res.status(500).json({ error: 'Server error fetching wishlist' });
    }
});

// POST /wishlist - Add painting to wishlist
apiRouter.post('/wishlist', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { paintingId } = req.body;
    if (!paintingId) return res.status(400).json({ error: 'paintingId is required' });
    try {
        const [paintings] = await pool.query('SELECT * FROM paintings WHERE id = ?', [paintingId]);
        if (paintings.length === 0) return res.status(400).json({ error: 'Invalid painting ID' });
        await pool.query(
            'INSERT IGNORE INTO wishlist_items (user_id, painting_id) VALUES (?, ?)',
            [userId, paintingId]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Error adding to wishlist:', err);
        return res.status(500).json({ error: 'Server error adding to wishlist' });
    }
});

// DELETE /wishlist/:productId - Remove painting from wishlist
apiRouter.delete('/wishlist/:productId', async (req, res) => {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const paintingId = req.params.productId;
    try {
        await pool.query(
            'DELETE FROM wishlist_items WHERE user_id = ? AND painting_id = ?',
            [userId, paintingId]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Error removing from wishlist:', err);
        return res.status(500).json({ error: 'Server error removing from wishlist' });
    }
});

// Mount the API Router under /api
app.use('/api', apiRouter);

// Static assets and files serving
app.use(express.static(path.join(__dirname, '..')));

// Explicit page routes so any request renders the appropriate HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});
app.get('/homepage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});
app.get('/gallerypage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'gallerypage.html'));
});
app.get('/cartpage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'cartpage.html'));
});
app.get('/wishlistpage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'wishlistpage.html'));
});
app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'signin.html'));
});
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});
app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'logo.png'));
});
app.get('/db-common.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'db-common.js'));
});

// Also mount API router on root as fallback
app.use('/', apiRouter);

// Catch-all route to serve homepage instead of Cannot GET
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});

// Export the Express app for Vercel serverless
module.exports = app;

