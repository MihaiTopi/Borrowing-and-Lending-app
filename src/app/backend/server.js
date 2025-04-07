const express = require("express");
const cors = require("cors");
const app = express();
const os = require("os"); // in order to get the ip address of server
const PORT = 3000;

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
    id: idCounter++,
    title: 'Bicycle',
    category: 'Sports',
    price: 25,
    description: 'Mountain bike, good condition.',
    owner: 'John Doe',
    uploadDate: '2025-04-01',
    location: 'New York'
  },
  {
    id: idCounter++,
    title: 'Projector',
    category: 'Electronics',
    price: 30,
    description: '1080p projector, suitable for presentations.',
    owner: 'Jane Smith',
    uploadDate: '2025-04-03',
    location: 'San Francisco'
  },
  {
    id: idCounter++,
    title: 'Tent',
    category: 'Outdoors',
    price: 15,
    description: '2-person tent, waterproof.',
    owner: 'Alice Johnson',
    uploadDate: '2025-04-05',
    location: 'Seattle'
  }
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
  res.json(listings);
});

app.post('/api/listings', async (req, res) => {
  const { title, category, price, description, owner, uploadDate, location } = req.body;

  if (!title || !category || !price || !description || !owner || !uploadDate || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const error = validateListing(req.body);
  if (error) return res.status(400).json({ error });

  const newListing = {
    id: idCounter++,
    ...req.body
  };

  listings.push(newListing);
  res.status(201).json(newListing);
});

app.put('/api/listings/:id', async (req, res) => {
  const listingId = req.params.id;
  const listing = listings.find(l => l.id === parseInt(listingId));

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const error = validateListing(req.body);
  if (error) return res.status(400).json({ error });

  Object.assign(listing, req.body);
  res.json(listing);
});

app.delete('/api/listings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  listings = listings.filter(listing => listing.id !== id);
  res.status(204).end();
});

app.post('/api/listings/reset', (req, res) => {
  listings = [];
  idCounter = 1;
  res.status(200).send('Reset complete');
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
