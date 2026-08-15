// server.js
// Local development entry point.
// Imports the Express app from api/index.js and starts listening.

const app = require('./api/index');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Just Art running at http://localhost:${PORT}`);
});
