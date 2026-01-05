/**
 * Test Setup
 * 
 * Global test configuration and utilities for Jest tests.
 * This file runs before all tests.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to in-memory MongoDB before all tests
 */
beforeAll(async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create in-memory MongoDB instance with explicit configuration
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test-db'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('MongoDB Memory Server URI:', mongoUri);

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout
      socketTimeoutMS: 45000
    });

    console.log('✓ Connected to in-memory test database');
    console.log('✓ Connection state:', mongoose.connection.readyState);
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}, 60000); // 60 second timeout for beforeAll

/**
 * Clear all collections after each test
 */
afterEach(async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('Database not connected, skipping cleanup');
    return;
  }
  
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
});

/**
 * Disconnect and stop MongoDB server after all tests
 */
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✓ Disconnected from test database');
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✓ Stopped MongoDB Memory Server');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60000); // 60 second timeout for afterAll

/**
 * Global test timeout (60 seconds)
 * Increased to handle MongoDB Memory Server startup and complex model creation
 */
jest.setTimeout(60000);

