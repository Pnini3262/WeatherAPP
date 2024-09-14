
import express from 'express';
import routes from'./src/routes.js';
import dotenv from 'dotenv';
import cors from 'cors';


//const express = require('express');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Define routes
app.use('/api', routes);


// Define a root route
app.get('/', (req, res) => {
     res.send('Welcome to the weather homePage');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});








