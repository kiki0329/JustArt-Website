// api/index.js
// Vercel Serverless Function entry point
// Handles all API endpoints & static page routes seamlessly with Cloud MySQL support.

require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

// Enable CORS & Preflight handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static HTML/CSS/JS files from the project root
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'ki_just_art_secret_session_key_2026_08_13',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

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

// Paintings list for seeding database
const initialPaintings = [
    { id: 1, title: 'Whispers of Dawn', artist: 'Elena Voss', category: 'Landscape', price: 85000, image: 'https://picsum.photos/seed/dawn_blue/400/500', featured: true },
    { id: 2, title: 'Eternal Silence', artist: 'Marcus Reed', category: 'Portrait', price: 120000, image: 'https://picsum.photos/seed/silence_blue/400/500', featured: true },
    { id: 3, title: 'Crimson Horizon', artist: 'Sophia Chen', category: 'Abstract', price: 95000, image: 'https://picsum.photos/seed/crimson_blue/400/500', featured: true },
    { id: 4, title: 'Dancing Shadows', artist: 'Oliver Stone', category: 'Expressionism', price: 110000, image: 'https://picsum.photos/seed/shadow_blue/400/500', featured: true },
    { id: 5, title: 'Golden Afternoon', artist: 'Clara Belle', category: 'Impressionism', price: 78000, image: 'https://picsum.photos/seed/golden_blue/400/500', featured: false },
    { id: 6, title: 'Midnight Reverie', artist: 'Julian Cross', category: 'Surrealism', price: 130000, image: 'https://picsum.photos/seed/midnight_blue/400/500', featured: false },
    { id: 7, title: 'Ocean\'s Whisper', artist: 'Nina Torres', category: 'Seascape', price: 92000, image: 'https://picsum.photos/seed/ocean_blue/400/500', featured: false },
    { id: 8, title: 'Autumn Melody', artist: 'Henry Wright', category: 'Landscape', price: 68000, image: 'https://picsum.photos/seed/autumn_blue/400/500', featured: false },
    { id: 9, title: 'Celestial Dreams', artist: 'Iris Moon', category: 'Abstract', price: 105000, image: 'https://picsum.photos/seed/celestial_blue/400/500', featured: false },
    { id: 10, title: 'Whispering Pines', artist: 'David Grey', category: 'Landscape', price: 75000, image: 'https://picsum.photos/seed/pines_blue/400/500', featured: false },
    { id: 11, title: 'Silent Revolution', artist: 'Zara Khan', category: 'Contemporary', price: 145000, image: 'https://picsum.photos/seed/revolution_blue/400/500', featured: false },
    { id: 12, title: 'Ethereal Bloom', artist: 'Lily Rose', category: 'Floral', price: 82000, image: 'https://picsum.photos/seed/bloom_blue/400/500', featured: false },
    { id: 13, title: 'Urban Solitude', artist: 'Arjun Mehta', category: 'Contemporary', price: 99000, image: 'https://picsum.photos/seed/urban_blue/400/500', featured: false },
    { id: 14, title: 'Mystic Gaze', artist: 'Priya Sharma', category: 'Portrait', price: 135000, image: 'https://picsum.photos/seed/mystic_blue/400/500', featured: false },
    { id: 15, title: 'Rustic Charms', artist: 'Ananya Reddy', category: 'Impressionism', price: 88000, image: 'https://picsum.photos/seed/rustic_blue/400/500', featured: false },
    { id: 16, title: 'Neon Dreams', artist: 'Vikram Seth', category: 'Abstract', price: 150000, image: 'https://picsum.photos/seed/neon_blue/400/500', featured: false },
    { id: 17, title: 'Serene Shores', artist: 'Meera Nair', category: 'Seascape', price: 72000, image: 'https://picsum.photos/seed/serene_blue/400/500', featured: false },
    { id: 18, title: 'Blossom Trail', artist: 'Ravi Verma', category: 'Floral', price: 112000, image: 'https://picsum.photos/seed/blossom_blue/400/500', featured: false },
    { id: 19, title: 'Fading Echoes', artist: 'Sana Khan', category: 'Expressionism', price: 97000, image: 'https://picsum.photos/seed/echoes_blue/400/500', featured: false },
    { id: 20, title: 'Tranquil Peaks', artist: 'Aisha Kapoor', category: 'Landscape', price: 83000, image: 'https://picsum.photos/seed/peaks_blue/400/500', featured: false },
    { id: 21, title: 'Whimsical Forest', artist: 'Kabir Singh', category: 'Surrealism', price: 125000, image: 'https://picsum.photos/seed/forest_blue/400/500', featured: false },
    { id: 22, title: 'Timeless Grace', artist: 'Lakshmi Menon', category: 'Portrait', price: 140000, image: 'https://picsum.photos/seed/grace_blue/400/500', featured: false },
    { id: 23, title: 'Modern Muse', artist: 'Rahul Khanna', category: 'Contemporary', price: 108000, image: 'https://picsum.photos/seed/muse_blue/400/500', featured: false },
    { id: 24, title: 'Golden Horizon', artist: 'Maya Patel', category: 'Impressionism', price: 91000, image: 'https://picsum.photos/seed/horizon_blue/400/500', featured: false },
    { id: 25, title: 'Abstract Reality', artist: 'Arnav Bose', category: 'Abstract', price: 160000, image: 'https://picsum.photos/seed/reality_blue/400/500', featured: false },
    { id: 26, title: 'Mountain Echo', artist: 'Neha Gupta', category: 'Landscape', price: 79000, image: 'https://picsum.photos/seed/mountain_blue/400/500', featured: false }
];

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
                id INT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(255) NOT NULL,
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
        console.log('Database tables verified/created successfully.');
    } catch (err) {
        console.error('Error verifying/creating database tables:', err.message);
    }
}

// Seed the paintings database on start if it's empty
async function seedDatabase() {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM paintings');
        if (rows[0].count === 0) {
            console.log('Database paintings table is empty. Seeding paintings...');
            for (const p of initialPaintings) {
                await pool.query(
                    'INSERT INTO paintings (id, title, artist, category, price, image_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [p.id, p.title, p.artist, p.category, p.price, p.image, p.featured ? 1 : 0]
                );
            }
            console.log('Seeding completed successfully!');
        } else {
            console.log(`Database already contains ${rows[0].count} paintings.`);
        }
    } catch (err) {
        console.error('Error seeding paintings table:', err.message);
    }
}

let dbInitialized = false;

async function ensureDbReady() {
    if (!dbInitialized) {
        await initializeDatabase();
        await seedDatabase();
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
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already in use', code: 'auth/email-already-in-use' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
        const userId = result.insertId;

        const user = { uid: userId, email: email };
        req.session.user = user;

        console.log(`Successful SignUp: user ID ${userId}, email: ${email}`);
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
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'No user found with this email', code: 'auth/user-not-found' });
        }
        const userRecord = users[0];

        const isMatch = await bcrypt.compare(password, userRecord.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password', code: 'auth/wrong-password' });
        }

        const user = { uid: userRecord.id, email: userRecord.email };
        req.session.user = user;

        console.log(`Successful SignIn: user ID ${userRecord.id}, email: ${userRecord.email}`);
        return res.json({ user });
    } catch (err) {
        console.error('Signin error:', err);
        return res.status(500).json({ error: 'Server error', code: 'auth/internal-error' });
    }
});

// Sign Out
apiRouter.post('/auth/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout session destroy error:', err);
                return res.status(500).json({ error: 'Failed to log out' });
            }
            res.clearCookie('connect.sid');
            console.log('Successful SignOut');
            return res.json({ success: true });
        });
    } else {
        return res.json({ success: true });
    }
});

// Check Session / Current User
apiRouter.get('/auth/me', (req, res) => {
    return res.json({ user: req.session.user || null });
});

// Load User Data (Cart & Wishlist)
apiRouter.get('/user/data', async (req, res) => {
    if (!req.session.user) {
        return res.json({ cart: [], wishlist: [] });
    }
    const userId = req.session.user.uid;
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized user action' });
    }
    const userId = req.session.user.uid;
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

// GET /cart - Fetch user cart
apiRouter.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.json([]);
    }
    const userId = req.session.user.uid;
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
    const { paintingId, qty } = req.body;
    if (!paintingId) {
        return res.status(400).json({ error: 'paintingId is required' });
    }
    try {
        const [paintings] = await pool.query('SELECT * FROM paintings WHERE id = ?', [paintingId]);
        if (paintings.length === 0) {
            return res.status(400).json({ error: 'Invalid painting ID' });
        }
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
    const paintingId = req.params.itemId;
    const { qty } = req.body;
    if (qty === undefined || qty <= 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
    try {
        await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        return res.json({ success: true });
    } catch (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ error: 'Server error clearing cart' });
    }
});

// GET /wishlist - Fetch user wishlist
apiRouter.get('/wishlist', async (req, res) => {
    if (!req.session.user) {
        return res.json([]);
    }
    const userId = req.session.user.uid;
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
    const { paintingId } = req.body;
    if (!paintingId) {
        return res.status(400).json({ error: 'paintingId is required' });
    }
    try {
        const [paintings] = await pool.query('SELECT * FROM paintings WHERE id = ?', [paintingId]);
        if (paintings.length === 0) {
            return res.status(400).json({ error: 'Invalid painting ID' });
        }
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
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.session.user.uid;
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

// Mount the API Router under BOTH /api and / to handle all Vercel route patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

// ------------------------------------------------------------
// HTML Page Routes
// ------------------------------------------------------------
app.get('/', (req, res) => {
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

// Export the Express app for Vercel serverless
module.exports = app;
