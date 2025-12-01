// server.js
const express = require('express');
const path = require('path');
const app = express();

// Render uses the PORT environment variable; fallback to 3000 locally
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(express.json()); // For parsing application/json (for API calls)
app.use(express.urlencoded({ extended: true }));

// --- STATIC FILE SERVING ---
// Assuming your HTML, CSS, JS files are in the root directory:
app.use(express.static(path.join(__dirname)));
// If you had a 'public' folder, you'd use: app.use(express.static(path.join(__dirname, 'public')));


// --- API/FUNCTION ROUTING ---
// You must manually import and expose your Netlify functions as Express routes.
// Example for submit-proposal.js:

// Import the logic (you'll need to modify the function files to be compatible exports)
// const submitProposalHandler = require('./netlify/functions/submit-proposal');

// You will need to rewrite the function logic slightly to accept Express req, res
// app.post('/.netlify/functions/submit-proposal', (req, res) => {
//     // Call your function logic here, adapted for Express
//     // ...
//     res.status(200).send('Proposal received!');
// });

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});