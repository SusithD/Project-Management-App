import { MongoClient, Db, ServerApiVersion } from 'mongodb'
import { COLLECTIONS, projectValidationSchema, userValidationSchema } from '~/server/utils/schemas'
import { useRuntimeConfig } from '#imports'

// Singleton connection variables
let client: MongoClient | null = null
let db: Db | null = null

// Get MongoDB connection details from config
const config = useRuntimeConfig()

// Use provided URI or fallback to localhost
const MONGO_URI = config.mongodb?.uri || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017'

// Database name
const MONGO_DB = config.mongodb?.dbName || process.env.MONGO_DB || 'project_management'

// Connection options
const CONNECTION_OPTIONS = {
  retryWrites: true,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  maxPoolSize: 50,
  waitQueueTimeoutMS: 10000,
  serverApi: ServerApiVersion.v1,
  directConnection: false,
  retryReads: true,
  serverSelectionTimeoutMS: 5000,
}

/**
 * Connects to MongoDB and returns the database and client instances
 */
export async function connectToDatabase() {
  // Return existing connection if available
  if (client && db) {
    return { db, client }
  }

  let connectionError = null;
  try {
    console.log(`Attempting to connect to MongoDB at ${MONGO_URI}...`)
    client = new MongoClient(MONGO_URI, CONNECTION_OPTIONS)
    await client.connect()

    // Test the connection with a ping
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB ping successful, connection is working")

    db = client.db(MONGO_DB)
    await setupCollections(db)

    console.log(`Connected to MongoDB database: ${MONGO_DB}`)
    return { db, client }
  } catch (error: any) {
    console.error('Failed to connect to MongoDB:', error.message || error)
    connectionError = error

    // Close the failed connection
    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        console.warn("Error closing failed MongoDB connection:", closeError)
      }
      client = null
    }

    // Provide a more helpful error message
    const errorMessage = `
MongoDB Connection Error: Unable to connect to MongoDB.

Please check the following:
1. Is the MongoDB connection string correct? Current: ${MONGO_URI}
2. Do you have network connectivity?
3. Are your MongoDB credentials valid?

Original error: ${connectionError?.message || connectionError || 'Unknown error'}
`
    throw new Error(errorMessage)
  }
}

/**
 * Sets up collections and their validations
 */
async function setupCollections(db: Db) {
  try {
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    // Setup projects collection
    if (!collectionNames.includes(COLLECTIONS.PROJECTS)) {
      await db.createCollection(COLLECTIONS.PROJECTS, projectValidationSchema)
      console.log(`Created ${COLLECTIONS.PROJECTS} collection with validation`)
      
      // Create indexes for projects
      const projectCollection = db.collection(COLLECTIONS.PROJECTS)
      await Promise.all([
        projectCollection.createIndex({ name: 1 }),
        projectCollection.createIndex({ status: 1 }),
        projectCollection.createIndex({ assignedTo: 1 }),
        projectCollection.createIndex({ priority: 1 }),
        projectCollection.createIndex({ category: 1 })
      ])
    }
    
    // Setup users collection
    if (!collectionNames.includes(COLLECTIONS.USERS)) {
      await db.createCollection(COLLECTIONS.USERS, userValidationSchema)
      console.log(`Created ${COLLECTIONS.USERS} collection with validation`)
      await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true })
    }
    
    // Setup files collection
    if (!collectionNames.includes(COLLECTIONS.FILES)) {
      await db.createCollection(COLLECTIONS.FILES)
      console.log(`Created ${COLLECTIONS.FILES} collection`)
      await db.collection(COLLECTIONS.FILES).createIndex({ projectId: 1 })
    }
  } catch (error) {
    console.error('Error setting up collections:', error)
    throw error
  }
}