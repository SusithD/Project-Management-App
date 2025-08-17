import { connectToDatabase } from './database';
import { COLLECTIONS } from './schemas';
import { 
  DEMO_USERS, 
  DEMO_PROJECTS, 
  DEMO_PROJECT_UPDATES, 
  DEMO_PROJECT_FILES 
} from './demo-data';

// This function seeds the database with demo data
export async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Clear existing demo data
    await clearDemoData(db);
    
    // Seed users
    await seedDemoUsers(db);
    
    // Seed projects
    await seedDemoProjects(db);
    
    // Seed project updates
    await seedDemoProjectUpdates(db);
    
    // Seed project files
    await seedDemoProjectFiles(db);
    
    console.log('Demo data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

// Clear existing demo data
async function clearDemoData(db: any) {
  console.log('Clearing existing demo data...');
  
  try {
    // Clear demo users
    await db.collection(COLLECTIONS.USERS).deleteMany({
      email: { $regex: /@demo\.com$/ }
    });
    
    // Clear demo projects (IDs starting with 1000)
    await db.collection(COLLECTIONS.PROJECTS).deleteMany({
      id: { $gte: 1000, $lt: 2000 }
    });
    
    console.log('Existing demo data cleared');
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
}

// Seed demo users
async function seedDemoUsers(db: any) {
  console.log('Seeding demo users...');
  
  try {
    // Insert demo users
    const result = await db.collection(COLLECTIONS.USERS).insertMany(DEMO_USERS);
    console.log(`Successfully seeded ${result.insertedCount} demo users`);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    throw error;
  }
}

// Seed demo projects
async function seedDemoProjects(db: any) {
  console.log('Seeding demo projects...');
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    // Insert demo projects one by one to prevent one invalid project from blocking all others
    for (const project of DEMO_PROJECTS) {
      try {
        await db.collection(COLLECTIONS.PROJECTS).insertOne(project);
        console.log(`Successfully seeded demo project: ${project.name} (ID: ${project.id})`);
        successCount++;
      } catch (error) {
        console.error(`Error seeding demo project ${project.name} (ID: ${project.id}):`, error.message);
        errorCount++;
      }
    }
    
    console.log(`Demo project seeding completed: ${successCount} succeeded, ${errorCount} failed`);
  } catch (error) {
    console.error('Error in demo project seeding process:', error);
    throw error;
  }
}

// Seed demo project updates
async function seedDemoProjectUpdates(db: any) {
  console.log('Seeding demo project updates...');
  
  try {
    const updatesToInsert = [];
    
    // Convert the updates object to an array of documents
    Object.entries(DEMO_PROJECT_UPDATES).forEach(([projectId, updates]) => {
      updates.forEach(update => {
        updatesToInsert.push({
          ...update,
          projectId: parseInt(projectId)
        });
      });
    });
    
    if (updatesToInsert.length > 0) {
      const result = await db.collection('project_updates').insertMany(updatesToInsert);
      console.log(`Successfully seeded ${result.insertedCount} demo project updates`);
    }
  } catch (error) {
    console.error('Error seeding demo project updates:', error);
    throw error;
  }
}

// Seed demo project files
async function seedDemoProjectFiles(db: any) {
  console.log('Seeding demo project files...');
  
  try {
    const filesToInsert = [];
    
    // Convert the files object to an array of documents
    Object.entries(DEMO_PROJECT_FILES).forEach(([projectId, files]) => {
      files.forEach(file => {
        filesToInsert.push({
          ...file,
          projectId: parseInt(projectId)
        });
      });
    });
    
    if (filesToInsert.length > 0) {
      const result = await db.collection('project_files').insertMany(filesToInsert);
      console.log(`Successfully seeded ${result.insertedCount} demo project files`);
    }
  } catch (error) {
    console.error('Error seeding demo project files:', error);
    throw error;
  }
}

// Reset demo data (clear and reseed)
export async function resetDemoData() {
  try {
    console.log('Resetting demo data...');
    await seedDemoData();
    console.log('Demo data reset completed');
  } catch (error) {
    console.error('Error resetting demo data:', error);
    throw error;
  }
}

// Check if demo data exists
export async function checkDemoDataExists() {
  try {
    const { db } = await connectToDatabase();
    
    const userCount = await db.collection(COLLECTIONS.USERS).countDocuments({
      email: { $regex: /@demo\.com$/ }
    });
    
    const projectCount = await db.collection(COLLECTIONS.PROJECTS).countDocuments({
      id: { $gte: 1000, $lt: 2000 }
    });
    
    return {
      usersExist: userCount > 0,
      projectsExist: projectCount > 0,
      userCount,
      projectCount
    };
  } catch (error) {
    console.error('Error checking demo data:', error);
    return {
      usersExist: false,
      projectsExist: false,
      userCount: 0,
      projectCount: 0
    };
  }
}
