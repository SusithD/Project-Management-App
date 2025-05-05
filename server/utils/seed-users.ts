import { connectToDatabase } from './database';
import { COLLECTIONS, User } from './schemas';

// This function seeds the users collection with initial data if it's empty
export async function seedUsers() {
  try {
    console.log('Checking if users need to be seeded...');
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if users collection is empty
    const count = await db.collection(COLLECTIONS.USERS).countDocuments();
    
    if (count > 0) {
      console.log('Users collection already populated, skipping seed.');
      return;
    }
    
    // Initial user data
    const users: User[] = [
      {
        id: 'mb001',
        name: 'Madhushika Bandara',
        email: 'mbandara@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'kd001',
        name: 'Kasun Dissanayaka',
        email: 'kdissanayaka@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sa001',
        name: 'Susith Alwis',
        email: 'SAlwis@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sk001',
        name: 'Sajith Kumara',
        email: 'skumara@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pds001',
        name: 'Pasindu De Silva',
        email: 'PDeSilva@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pa001',
        name: 'Pathum Addarapathirana',
        email: 'paddarapathirana@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rp001',
        name: 'Rusiru Pallawala',
        email: 'rpallawala@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ga001',
        name: 'Gishan Abeysinghe',
        email: 'gabeysinghe@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'nt001',
        name: 'Nipuna Theekshana',
        email: 'ntheekshana@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ki001',
        name: 'Kumal Illankoon',
        email: 'killankoon@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'gp001',
        name: 'Gopinath Pakeerathan',
        email: 'gpakeerathan@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hr001',
        name: 'Heshadee Ranasinghe',
        email: 'hranasinghe@Coveragex.com',
        role: 'Business Analyst',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rs001',
        name: 'Rishmi Samaradiwakara',
        email: 'RSamaradiwakara@Coveragex.com',
        role: 'HR',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pc001',
        name: 'Pahan Chathuranga',
        email: 'pchathuranga@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ns001',
        name: 'Nethupama Shavinda',
        email: 'nshavinda@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sar001',
        name: 'Sajith Ariyarathna',
        email: 'sariyarathna@Coveragex.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Insert all users
    await db.collection(COLLECTIONS.USERS).insertMany(users);
    
    console.log(`Successfully seeded ${users.length} users into the database.`);
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}