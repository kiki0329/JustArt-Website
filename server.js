// server.js
// Local development entry point.
// Serves static files and starts listening on port.

const path = require('path');
const express = require('express');
const app = require('./api/index');

// In local development, serve static files from root directory
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
    console.log(`Just Art running at http://localhost:${PORT}`);
});
