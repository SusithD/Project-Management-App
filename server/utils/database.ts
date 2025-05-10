import { MongoClient, Db, ServerApiVersion } from 'mongodb'
import { COLLECTIONS, projectValidationSchema, userValidationSchema } from '~/server/utils/schemas'
import { useRuntimeConfig } from '#imports'

// Singleton connection variables
let client: MongoClient | null = null
let db: Db | null = null

// Get MongoDB connection details from config
const config = useRuntimeConfig()

// Docker MongoDB connection string
const DOCKER_MONGO_URI = 'mongodb://localhost:27017'

// Use fallback to direct connection string if DNS SRV lookup fails
const MONGO_URI = config.mongodb?.uri || process.env.MONGODB_URI || process.env.MONGO_URI || DOCKER_MONGO_URI

// For local development, use Docker MongoDB as primary connection
const MONGO_DB = config.mongodb?.dbName || process.env.MONGO_DB || 'project_management'

// Connection options with better defaults for reliability
const CONNECTION_OPTIONS = {
  retryWrites: true,
  connectTimeoutMS: 5000, // Lower timeout to fail faster
  socketTimeoutMS: 30000,
  maxPoolSize: 50,
  waitQueueTimeoutMS: 10000,
  serverApi: ServerApiVersion.v1,
  directConnection: false,
  retryReads: true,
  serverSelectionTimeoutMS: 5000, // Lower timeout for faster fallback
}

// More reliable local connection options
const LOCAL_CONNECTION_OPTIONS = {
  ...CONNECTION_OPTIONS,
  directConnection: true, // Better for local connections
  serverSelectionTimeoutMS: 2000,
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

  // Try connecting to Docker MongoDB first
  try {
    console.log(`Attempting to connect to Docker MongoDB at ${DOCKER_MONGO_URI}...`)
    
    client = new MongoClient(DOCKER_MONGO_URI, LOCAL_CONNECTION_OPTIONS)
    await client.connect()
    
    // Test the connection with a ping
    await client.db("admin").command({ ping: 1 });
    console.log("Docker MongoDB ping successful, connection is working");
    
    db = client.db(MONGO_DB)
    await setupCollections(db)
    
    console.log(`Connected to Docker MongoDB database: ${MONGO_DB}`)
    return { db, client }
  } catch (error: any) {
    console.error('Failed to connect to Docker MongoDB:', error.message || error)
    connectionError = error;
    
    // Close the failed connection before trying a new one
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.warn("Error closing failed Docker connection:", closeError);
      }
      client = null;
    }
  }

  // Try connecting to MongoDB Atlas as fallback
  if (MONGO_URI !== DOCKER_MONGO_URI) {
    try {
      console.log(`Attempting to connect to MongoDB Atlas at ${MONGO_URI}...`)
      
      client = new MongoClient(MONGO_URI, CONNECTION_OPTIONS)
      await client.connect()
      
      // Test the connection with a ping
      await client.db("admin").command({ ping: 1 });
      console.log("Atlas MongoDB ping successful, connection is working");
      
      db = client.db(MONGO_DB)
      await setupCollections(db)
      
      console.log(`Connected to MongoDB Atlas database: ${MONGO_DB}`)
      return { db, client }
    } catch (error: any) {
      console.error('Failed to connect to MongoDB Atlas:', error.message || error)
      connectionError = error;
      
      // Close the failed connection
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          console.warn("Error closing failed Atlas connection:", closeError);
        }
        client = null;
      }
    }
  }
    
  // Provide a more helpful error message
  const errorMessage = `
MongoDB Connection Error: Unable to connect to either Docker MongoDB or MongoDB Atlas.

Please check the following:
1. Is Docker running with MongoDB container? Check with: docker ps
2. Is MongoDB Atlas connection string correct? Current: ${MONGO_URI}
3. Do you have network connectivity?
4. Are your MongoDB credentials valid?

Original error: ${connectionError?.message || connectionError || 'Unknown error'}
`;
  throw new Error(errorMessage);
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
      ]);
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