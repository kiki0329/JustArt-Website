# Just Art Gallery

Welcome to **Just Art Gallery**, a premium, responsive e-commerce web platform designed for browsing, wishlisting, and shopping fine art paintings. This platform features a vanilla HTML/CSS/JS frontend powered by a robust Node.js/Express backend and persistent MySQL database storage.

---

## 🌟 Key Features

- **🎨 Curated Art Gallery:** Browse beautiful collections categorized by style (Landscape, Portrait, Abstract, Impressionism, Surrealism, Seascape, Contemporary, Floral).
- **🛒 Dynamic Shopping Cart:** Add paintings to your shopping cart, update item quantities, and calculate real-time totals—persisted directly in MySQL.
- **❤️ Personal Wishlist:** Bookmark your favorite paintings for later viewing.
- **🔒 Secure Authentication:** Sign-up and Sign-in functionality backed by session persistence (`express-session`) and bcrypt-hashed password storage.
- **⚙️ Auto-Seeding Database:** On server startup, the backend automatically initializes the MySQL database tables and seeds them with a pre-configured set of 26 exquisite paintings if empty.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend:** Node.js, Express.js
- **Database:** MySQL (relational database storage)
- **Authentication & Security:** `bcryptjs` (password hashing), `express-session` (server-side session management)
- **Configuration:** `dotenv` (environment variables)

---

## 📁 File Structure

```text
├── server.js            # Main Express backend server with APIs, session handling, and database seeding
├── db-common.js        # Frontend bridge module replacing client SDKs with fetch API requests
├── homepage.html        # Landing page highlighting featured paintings and site intro
├── gallerypage.html     # Interactive gallery with categories, search, and detail views
├── wishlistpage.html    # Wishlisted items display with add-to-cart actions
├── cartpage.html        # Shopping cart page for quantity adjustments and checkout simulation
├── signin.html          # Authentication page for registering/logging in users
├── schema.sql           # Database schema containing table definitions
├── seed.sql             # SQL script for manually seeding painting data
├── .env.example         # Template for environment variables configuration
├── package.json         # Node.js dependencies and run scripts
└── logo.png             # Site logo
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Before running the application, make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v14 or higher recommended)
* [MySQL Server](https://www.mysql.com/) running locally or hosted

### 🔧 Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/kiki0329/JustArt-Website.git
   cd JustArt-Website
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory by copying the example template:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure your database settings and session secret:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=justart
   SESSION_SECRET=your_custom_session_secret
   PORT=5001
   ```

4. **Initialize Database (Optional):**
   The application automatically attempts to verify, create, and seed the database on startup. However, if you prefer manual setup, you can import the SQL files into MySQL:
   ```bash
   mysql -u your_mysql_username -p < schema.sql
   mysql -u your_mysql_username -p < seed.sql
   ```

5. **Start the Server:**
   ```bash
   npm start
   ```
   The backend server will launch on the port defined in your `.env` (default is `5001`).

6. **Open the Webpage:**
   Navigate to `http://localhost:5001/homepage.html` in your web browser.

---

## 🔒 Security Best Practices

> [!IMPORTANT]
> Never commit your `.env` file containing database passwords and secret keys to GitHub.
> The `.gitignore` file is configured to exclude `.env`. Make sure you only share `.env.example` with placeholders.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit pull requests to help improve the project.
