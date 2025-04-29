const express = require("express");
const cors = require("cors");
const app = express();
const os = require("os"); // in order to get the ip address of server
const PORT = 3000;
const uuid = require('uuid');

// Logic for when hosting on local network
const getLocalIP = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i.family === "IPv4" && !i.internal)?.address || "localhost";

const LOCAL_IP = getLocalIP();

app.listen(PORT, LOCAL_IP, () => {
  console.log(`Server running at http://${LOCAL_IP}:${PORT}`);
});

/* Logic for when hosting on locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} */

app.use(cors());
app.use(express.json());

let idCounter = 1;
let listings = [];

const allowedCategories = ['Home', 'Garden', 'Education', 'Vehicles', 'Technology', 'Computers', 'Clothing', 'Sports', 'Electronics', 'Outdoors'];

listings = [
  {
    id: uuid.v4(),
    title: 'Electric Scooter',
    category: 'Vehicles',
    price: 25,
    description: 'Fast and efficient electric scooter.',
    owner: 'user6',
    uploadDate: '2025-03-25',
    location: 'Ilfov'
  },
  {
    id: uuid.v4(),
    title: 'Camping Tent',
    category: 'Home',
    price: 10,
    description: 'Spacious tent for outdoor adventures.',
    owner: 'user7',
    uploadDate: '2025-03-26',
    location: 'Brasov'
  },
  {
    id: uuid.v4(),
    title: 'VR Headset',
    category: 'Technology',
    price: 30,
    description: 'High-end virtual reality headset.',
    owner: 'user8',
    uploadDate: '2025-03-27',
    location: 'Sibiu'
  },
];

function validateListing(data) {
  if (typeof data.title !== 'string') return "Title must be a string.";
  if (!allowedCategories.includes(data.category)) return `Category must be one of: ${allowedCategories.join(', ')}.`;
  if (!Number.isInteger(data.price)) return "Price must be an integer.";
  if (typeof data.description !== 'string') return "Description must be a string.";
  if (typeof data.owner !== 'string') return "Owner must be a string.";
  if (typeof data.uploadDate !== 'string') return "Upload date must be a string.";
  if (typeof data.location !== 'string') return "Location must be a string.";
  return null;
}

// Routes
app.get('/api/listings', (req, res) => {
  const { page = 1, limit = 5 } = req.query; 

  const startIndex = (page - 1) * limit;  
  const endIndex = page * limit;  

  const paginatedListings = listings.slice(startIndex, endIndex);  

  res.json(paginatedListings);  
});


app.post('/api/listings', async (req, res) => {
  const { title, category, price, description, owner, uploadDate, location } = req.body;

  if (!title || !category || !price || !description || !owner || !uploadDate || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const error = validateListing(req.body);
  if (error) return res.status(400).json({ error });

  const newListing = {
    id: uuid.v4(),
    ...req.body
  };

  listings.push(newListing);
  res.status(201).json(newListing);
});

app.put('/api/listings/:id', (req, res) => {
  const listingId = req.params.id;
  const listingIndex = listings.findIndex(listing => listing.id === listingId);
  if (listingIndex === -1) {
    return res.status(404).send({ message: 'Listing not found' });
  }
  // Handle partial update
  const updatedListing = { ...listings[listingIndex], ...req.body };
  listings[listingIndex] = updatedListing;
  res.status(200).json(updatedListing);
});


app.delete('/api/listings/:id', (req, res) => {
  const listingId = req.params.id;
  const listingIndex = listings.findIndex(listing => listing.id === listingId);
  if (listingIndex === -1) {
    return res.status(404).send({ message: 'Listing not found' });
  }
  listings.splice(listingIndex, 1);
  res.status(204).send(); // Successfully deleted
});


app.post('/api/listings/reset', (req, res) => {
  listings = [];
  idCounter = 1;
  res.status(200).send('Reset complete');
});

// Add this to your server.js file
app.get('/api/listings/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* istanbul ignore next */

/* 👇 Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}*/

// 👇 Export app for testing
module.exports = app;

/*

Invoke-WebRequest -Uri "http://26.183.81.226:3000/api/listings/4" -Method DELETE
Invoke-WebRequest -Uri "http://26.183.81.226:3000/api/listings" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"title": "Mountain Bike", "category": "Vehicles", "price": 50}'
Invoke-WebRequest -Uri "http://26.183.81.226:3000/api/listings/4" -Method PUT -Headers @{"Content-Type"="application/json"} -Body '{"title": "Mountain Bikeee", "category": "Vehicles", "price": 30}'
Invoke-WebRequest -Uri "http://26.183.81.226:3000/api/listings" -Method GET

*/