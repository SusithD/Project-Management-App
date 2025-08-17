# Demo Environment Setup Guide

This guide will help you set up a comprehensive demo environment for the Project Management App that allows any user to explore the platform with realistic sample data.

## Overview

The demo environment provides:
- **Demo Login System**: Bypass Microsoft OAuth with role-based user selection
- **Sample Data**: Realistic projects, users, and Jira integration data
- **Role-Based Access**: Experience different user perspectives (Admin, Manager, Developer, etc.)
- **Demo Mode Indicators**: Visual indicators when running in demo mode
- **Data Management**: Tools to seed, reset, and manage demo data

## Quick Start

### 1. Enable Demo Mode

Set the environment variable to enable demo mode:

```bash
# In your .env file or environment
DEMO_MODE=true
```

Or for development, demo mode is automatically enabled when `NODE_ENV=development`.

### 2. Access Demo Login

Navigate to the demo login page:
```
http://localhost:3000/demo-login
```

### 3. Select a Demo User

Choose from different roles:
- **Super Admin**: Full system access
- **Manager**: Project management capabilities
- **Business Analyst**: Requirements and planning features
- **Developer**: Technical development features
- **Designer**: UI/UX design features
- **HR**: Human resources features

## Demo Data Structure

### Demo Users (7 users)

| Role | Name | Email | Department |
|------|------|-------|------------|
| Super Admin | Sarah Johnson | sarah.johnson@demo.com | IT Management |
| Manager | Michael Chen | michael.chen@demo.com | Engineering |
| Business Analyst | Emily Rodriguez | emily.rodriguez@demo.com | Product Management |
| Developer | Alex Thompson | alex.thompson@demo.com | Engineering |
| Developer | Priya Patel | priya.patel@demo.com | Engineering |
| Designer | David Kim | david.kim@demo.com | Design |
| HR | Lisa Wang | lisa.wang@demo.com | Human Resources |

### Demo Projects (5 projects)

1. **E-Commerce Platform Redesign** (65% complete)
   - Status: In Progress
   - Team: 3 members
   - Jira Project: ECOMM

2. **Mobile Banking App** (25% complete)
   - Status: Planning
   - Team: 3 members
   - Jira Project: BANK

3. **API Gateway Implementation** (100% complete)
   - Status: Completed
   - Team: 2 members
   - Jira Project: API

4. **Customer Portal Enhancement** (40% complete)
   - Status: On Hold
   - Team: 2 members
   - Jira Project: PORTAL

5. **Data Analytics Dashboard** (80% complete)
   - Status: In Progress
   - Team: 2 members
   - Jira Project: ANALYTICS

### Demo Jira Data

- **5 Jira Projects** with realistic names and keys
- **Sample Issues** for each project including:
  - User Stories
  - Bugs
  - Tasks
  - Epics
- **Realistic Statuses** and priorities
- **Assigned Users** and reporters

## Setup Steps

### Step 1: Environment Configuration

1. **Enable Demo Mode**:
   ```bash
   # Add to your .env file
   DEMO_MODE=true
   ```

2. **Database Connection**: Ensure your MongoDB connection is working

### Step 2: Seed Demo Data

The demo data will be automatically seeded when the server starts in demo mode. Alternatively, you can manually seed the data:

```bash
# Using the API endpoint
curl -X POST http://localhost:3000/api/demo/seed

# Or visit the admin page
http://localhost:3000/admin/demo-management
```

### Step 3: Access Demo Environment

1. **Start the application**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to demo login**:
   ```
   http://localhost:3000/demo-login
   ```

3. **Select a demo user** and explore the platform

## Demo Features

### 1. Role-Based Experience

Each demo user has different permissions and can access different features:

- **Super Admin**: Full access to all features including user management
- **Manager**: Project management, team oversight, reports
- **Business Analyst**: Requirements analysis, project planning, reports
- **Developer**: Project updates, task management, Jira integration
- **Designer**: Project viewing, design-related features
- **HR**: User management, reports

### 2. Sample Data Integration

- **Projects**: Realistic project data with different statuses and progress
- **Users**: Team members with different roles and departments
- **Jira Integration**: Mock Jira projects and issues
- **Project Updates**: Sample updates and comments
- **Project Files**: Sample documentation and design files

### 3. Demo Mode Indicators

- **Visual Indicator**: Yellow "Demo Mode" badge in the top-right corner
- **API Responses**: Demo mode status in API responses
- **Session Management**: Demo users have 24-hour sessions

## API Endpoints

### Demo Management

- `GET /api/demo/status` - Check demo mode and data status
- `POST /api/demo/seed` - Seed demo data
- `POST /api/demo/reset` - Reset demo data

### Demo-Enhanced Endpoints

All existing API endpoints support demo mode:
- `GET /api/users` - Returns demo users when in demo mode
- `GET /api/projects` - Returns demo projects when in demo mode
- `GET /api/jira/projects` - Returns demo Jira projects when in demo mode
- `GET /api/jira/issues` - Returns demo Jira issues when in demo mode

## Admin Management

### Demo Management Page

Access the demo management page at:
```
http://localhost:3000/admin/demo-management
```

Features:
- **Status Overview**: Demo mode and data status
- **Data Management**: Seed and reset demo data
- **User Counts**: Number of demo users and projects
- **Access Control**: Only accessible to Super Admins

### Manual Data Management

```bash
# Check demo status
curl http://localhost:3000/api/demo/status

# Seed demo data
curl -X POST http://localhost:3000/api/demo/seed

# Reset demo data
curl -X POST http://localhost:3000/api/demo/reset
```

## Customization

### Adding More Demo Users

Edit `server/utils/demo-data.ts` to add more demo users:

```typescript
export const DEMO_USERS: User[] = [
  // ... existing users
  {
    id: 'demo-dev-003',
    name: 'New Developer',
    email: 'new.dev@demo.com',
    role: 'DEVELOPER',
    // ... other properties
  }
];
```

### Adding More Demo Projects

Add more projects to the `DEMO_PROJECTS` array:

```typescript
export const DEMO_PROJECTS: Project[] = [
  // ... existing projects
  {
    id: 1006,
    name: 'New Project',
    status: 'Planning',
    // ... other properties
  }
];
```

### Customizing Jira Data

Modify the Jira demo data in the same file:

```typescript
export const DEMO_JIRA_PROJECTS = [
  // ... existing projects
  {
    id: '10006',
    key: 'NEW',
    name: 'New Jira Project',
    // ... other properties
  }
];
```

## Troubleshooting

### Demo Data Not Loading

1. **Check Demo Mode**:
   ```bash
   curl http://localhost:3000/api/demo/status
   ```

2. **Manual Seeding**:
   ```bash
   curl -X POST http://localhost:3000/api/demo/seed
   ```

3. **Check Database Connection**: Ensure MongoDB is running and accessible

### Demo Login Not Working

1. **Check Demo Page**: Ensure `/demo-login` route is accessible
2. **Check Auth Store**: Verify demo user functionality in `stores/auth.js`
3. **Browser Console**: Check for JavaScript errors

### API Endpoints Returning Production Data

1. **Verify Demo Mode**: Check if `DEMO_MODE=true` is set
2. **Check User**: Ensure the user email contains `@demo.com`
3. **API Headers**: Verify demo user detection logic

## Security Considerations

### Demo Mode Safety

- **Data Isolation**: Demo data is separate from production data
- **Temporary Changes**: All changes are reset when demo data is refreshed
- **Access Control**: Demo management requires admin permissions
- **Session Limits**: Demo sessions expire after 24 hours

### Production Deployment

- **Environment Variables**: Ensure `DEMO_MODE=false` in production
- **Access Control**: Restrict demo management endpoints
- **Data Backup**: Regular backups of production data
- **Monitoring**: Monitor for unauthorized demo mode access

## Best Practices

### For Demo Users

1. **Explore Different Roles**: Try logging in as different user types
2. **Test Features**: Use all available features for each role
3. **Data Changes**: Make changes to see how the system responds
4. **Reset Data**: Use the reset function to start fresh

### For Administrators

1. **Regular Updates**: Keep demo data current and relevant
2. **User Feedback**: Collect feedback from demo users
3. **Data Quality**: Ensure demo data represents realistic scenarios
4. **Documentation**: Keep demo setup documentation updated

## Support

If you encounter issues with the demo environment:

1. **Check Logs**: Review server and browser console logs
2. **Verify Setup**: Ensure all setup steps are completed
3. **Database**: Check MongoDB connection and collections
4. **Environment**: Verify environment variables are set correctly

For additional support, refer to the main project documentation or contact the development team.
