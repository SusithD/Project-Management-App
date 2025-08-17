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
        name: 'Kasun Perera',
        email: 'kperera@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'kd001',
        name: 'Dilusha Fernando',
        email: 'dfernando@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sa001',
        name: 'Ruwan Jayasinghe',
        email: 'rjayasinghe@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sk001',
        name: 'Sanjeewa Kumara',
        email: 'skumara@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pds001',
        name: 'Pasindu Silva',
        email: 'psilva@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pa001',
        name: 'Pathum Abeywardena',
        email: 'pabeywardena@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rp001',
        name: 'Ravindu Palliyaguru',
        email: 'rpalliyaguru@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ga001',
        name: 'Gayan Abeysekara',
        email: 'gabeysekara@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'nt001',
        name: 'Nipun Theekshana',
        email: 'ntheekshana@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ki001',
        name: 'Kushan Illangakoon',
        email: 'killangakoon@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'gp001',
        name: 'Gihan Pathirana',
        email: 'gpathirana@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'hr001',
        name: 'Harshani Rathnayake',
        email: 'hrathnayake@demo.com',
        role: 'Business Analyst',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rs001',
        name: 'Ruwangi Senanayake',
        email: 'rsenanayake@demo.com',
        role: 'HR',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'pc001',
        name: 'Pramud Chathuranga',
        email: 'pchathuranga@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ns001',
        name: 'Nadeesha Samarakoon',
        email: 'nsamarakoon@demo.com',
        role: 'Developer',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'sar001',
        name: 'Sasindu Ariyapala',
        email: 'sariyapala@demo.com',
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