const mongoose = require('mongoose');

/* ────────────────────────────────────────────────────────────
   MongoDB Connection – Pocket Cash Finance AI Agent
   Reads MONGO_URI from .env
   Usage: require('./config/db') in server.js
──────────────────────────────────────────────────────────── */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These are the recommended options for Mongoose 7+
      serverSelectionTimeoutMS: 5000,   // fail fast if server unreachable
      socketTimeoutMS         : 45000,  // close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);   // crash the process so the server doesn't start without DB
  }
};

/* ── Connection event listeners ── */
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

/* ── Graceful shutdown on SIGINT (Ctrl+C) / SIGTERM ── */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received – closing MongoDB connection...`);
  await mongoose.connection.close();
  console.log('   MongoDB connection closed. Exiting.');
  process.exit(0);
};

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = connectDB;
