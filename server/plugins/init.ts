import { initializeDatabase } from '../utils/init';

export default defineNitroPlugin(async () => {
  console.log('Server plugin: Running database initialization...');
  
  // Initialize database (seed collections, etc.)
  await initializeDatabase();
});