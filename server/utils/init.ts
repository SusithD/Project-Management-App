import { seedUsers } from './seed-users';

// Main initialization function that runs on server startup
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Seed users collection
    await seedUsers();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}