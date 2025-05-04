// Database connection utility
import { MongoClient, Db } from 'mongodb'
import { COLLECTIONS, projectValidationSchema } from '~/server/utils/schemas'
import { useRuntimeConfig } from '#imports'

// Connection variables
let client: MongoClient | null = null
let db: Db | null = null

// Get runtime config
const config = useRuntimeConfig()

// Get MongoDB connection details from runtime config
const MONGO_URI = process.env.MONGODB_URI || config.mongodb?.uri || process.env.MONGO_URI || 'mongodb://localhost:27017'
const MONGO_DB = config.mongodb?.dbName || process.env.MONGO_DB || 'project_management'

// Option parameters for connecting to MongoDB
const CONNECTION_OPTIONS = {
  // Retry to connect
  retryWrites: true,
  // Connection timeout in milliseconds (30 seconds)
  connectTimeoutMS: 30000,
  // Socket timeout in milliseconds (45 seconds)
  socketTimeoutMS: 45000,
  // Max number of reconnect attempts
  maxPoolSize: 50,
  // Whether to wait for reconnect
  waitQueueTimeoutMS: 10000
}

/**
 * Connects to MongoDB and returns the database and client instances
 */
export async function connectToDatabase() {
  // If we already have a connection, return it
  if (client && db) {
    return { db, client }
  }

  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`)
    
    // Create a new client and connect
    client = new MongoClient(MONGO_URI, CONNECTION_OPTIONS)
    await client.connect()
    
    // Get database
    db = client.db(MONGO_DB)
    
    // Setup collections and validations if they don't exist
    await setupCollections(db)
    
    console.log(`Connected to MongoDB database: ${MONGO_DB}`)
    return { db, client }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

/**
 * Sets up collections and their validations
 */
async function setupCollections(db: Db) {
  try {
    // Check if projects collection exists, if not create it
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    // Setup projects collection
    if (!collectionNames.includes(COLLECTIONS.PROJECTS)) {
      await db.createCollection(COLLECTIONS.PROJECTS, projectValidationSchema)
      console.log(`Created ${COLLECTIONS.PROJECTS} collection with validation`)
      
      // Create indexes for projects
      await db.collection(COLLECTIONS.PROJECTS).createIndex({ name: 1 })
      await db.collection(COLLECTIONS.PROJECTS).createIndex({ status: 1 })
      await db.collection(COLLECTIONS.PROJECTS).createIndex({ assignedTo: 1 })
      await db.collection(COLLECTIONS.PROJECTS).createIndex({ priority: 1 })
      await db.collection(COLLECTIONS.PROJECTS).createIndex({ category: 1 })
    }
    
    // Setup users collection (will be needed for authentication later)
    if (!collectionNames.includes(COLLECTIONS.USERS)) {
      await db.createCollection(COLLECTIONS.USERS)
      console.log(`Created ${COLLECTIONS.USERS} collection`)
      
      // Create indexes for users
      await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true })
    }
    
    // Setup files collection (for project attachments)
    if (!collectionNames.includes(COLLECTIONS.FILES)) {
      await db.createCollection(COLLECTIONS.FILES)
      console.log(`Created ${COLLECTIONS.FILES} collection`)
      
      // Create indexes for files
      await db.collection(COLLECTIONS.FILES).createIndex({ projectId: 1 })
    }
  } catch (error) {
    console.error('Error setting up collections:', error)
    throw error
  }
}