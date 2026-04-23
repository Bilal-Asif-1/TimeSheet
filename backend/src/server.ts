import app from "./app";
import { connectDB } from "./config/db";

// This is the main entry file of your backend app.
// When you run `npm run dev`, this file starts first.
// This file does only 2 jobs:
// 1) connect database
// 2) start listening on a port

// Server port (fallback to 5000 if PORT is not set).
const PORT = process.env.PORT || 5000;

// Start order:
// 1) Connect to database
// 2) Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
