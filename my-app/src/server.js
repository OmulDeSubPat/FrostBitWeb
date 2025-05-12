const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Load the self-signed certificate
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// Start HTTPS server on port 3000
https.createServer(options, app).listen(3000, () => {
  console.log('Server running on https://192.168.37.120:3000');
});