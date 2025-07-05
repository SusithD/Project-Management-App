import { connectToDatabase } from '../utils/database';
import { EMAIL_ROLE_MAPPING } from '../config/roles';

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔄 Migrating email role mappings to database...');
  
  try {
    const { db } = await connectToDatabase();
    
    // Check if mappings already exist
    const existingCount = await db.collection('email_role_mappings').countDocuments();
    
    if (existingCount === 0) {
      // Migrate hardcoded mappings to database
      const mappings = Object.entries(EMAIL_ROLE_MAPPING).map(([email, role]) => ({
        email: email.toLowerCase(),
        role: role,
        reason: 'Migrated from hardcoded configuration',
        createdAt: new Date().toISOString(),
        createdBy: 'system@migration',
        lastModified: new Date().toISOString(),
        lastModifiedBy: 'system@migration'
      }));
      
      if (mappings.length > 0) {
        await db.collection('email_role_mappings').insertMany(mappings);
        console.log(`✅ Migrated ${mappings.length} email role mappings to database`);
      }
    } else {
      console.log(`ℹ️  Found ${existingCount} existing email role mappings in database`);
    }
  } catch (error) {
    console.error('❌ Error migrating email role mappings:', error);
  }
});