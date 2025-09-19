// api/index.js - Vercel Serverless Function
import express from 'express';
import cors from 'cors';

// Since this is a serverless function, we need to import the complete server setup
// For now, we'll create a simple API endpoint that returns the frontend

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// For a full-stack app, we need to redirect API calls to the backend
// and serve the frontend for all other routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'API is running' });
});

// Catch all other routes and return a message
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'This is a Vercel deployment. The frontend should be served separately.',
    path: req.originalUrl
  });
});

export default app;