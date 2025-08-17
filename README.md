# Project Progress Management System

A comprehensive, enterprise-grade project management platform built with modern web technologies. This application provides powerful project tracking, team collaboration, JIRA integration, and role-based access control to streamline project workflows and enhance team productivity.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-green)](https://coveragex-project-management-app.vercel.app)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.13.0-00DC82)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC)](https://tailwindcss.com/)

## 🚀 Live Demo

**Experience the application without any setup:**
[https://coveragex-project-management-app.vercel.app](https://coveragex-project-management-app.vercel.app)

### Demo Users Available
Choose from different roles to explore various permission levels:

| Role | User | Email | Access Level |
|------|------|-------|--------------|
| **Super Admin** | Sarah Johnson | sarah.johnson@demo.com | Full system access, user management |
| **Project Manager** | Michael Chen | michael.chen@demo.com | Project oversight, team management |
| **Business Analyst** | Emily Rodriguez | emily.rodriguez@demo.com | Requirements analysis, reporting |
| **Developer** | Alex Thompson | alex.thompson@demo.com | Task management, technical features |
| **Developer** | Priya Patel | priya.patel@demo.com | Backend development focus |
| **Designer** | David Kim | david.kim@demo.com | UI/UX design workflows |
| **HR Manager** | Lisa Wang | lisa.wang@demo.com | Employee management, reporting |

### Demo Features
- ✅ **5 Sample Projects** with realistic data and varying completion stages
- ✅ **Role-Based Access Control** - Experience different permission levels
- ✅ **JIRA Integration Demo** - Mock JIRA projects and issue tracking
- ✅ **Interactive Dashboards** - Project analytics and reporting
- ✅ **File Management** - Upload and organize project documents
- ✅ **Team Collaboration** - Task assignments and progress tracking
- ✅ **Notification System** - In-app alerts and email notifications (simulated)

> **Note:** Demo data is temporary and resets periodically. No actual emails are sent in demo mode.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Demo Mode Setup](#-demo-mode-setup)
- [Production Setup](#-production-setup)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

##  Features

### Core Project Management
- **Project Dashboard** - Comprehensive overview of all projects with status tracking
- **Task Management** - Create, assign, and track tasks with priority levels
- **Progress Tracking** - Visual progress indicators and milestone management
- **Team Collaboration** - Real-time updates and team communication tools
- **File Management** - Upload, organize, and version control project documents
- **Time Tracking** - Monitor time spent on tasks and projects

### Security & Access Control
- **Role-Based Permissions** - Seven distinct user roles with granular permissions
- **Azure AD Integration** - Enterprise single sign-on authentication
- **Session Management** - Secure session handling with JWT tokens
- **Data Protection** - Encrypted data transmission and storage

### Analytics & Reporting
- **Interactive Dashboards** - Real-time project metrics and KPIs
- **Custom Reports** - Generate detailed reports with export capabilities
- **Progress Analytics** - Track team performance and project trends
- **Resource Utilization** - Monitor team workload and capacity

### JIRA Integration
- **Bi-directional Sync** - Seamless integration with JIRA projects
- **Issue Tracking** - Link and manage JIRA issues within projects
- **Automated Updates** - Real-time synchronization of project status
- **Custom Workflows** - Configure JIRA workflows to match your processes

### Modern User Experience
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode** - Customizable themes for user preference
- **Real-time Notifications** - Instant updates for important events
- **Intuitive Interface** - Clean, modern UI built with best practices

### Administration Tools
- **User Management** - Add, edit, and manage team members
- **Role Configuration** - Define and customize user permissions
- **System Settings** - Configure integrations and system preferences
- **Audit Logs** - Track user actions and system changes

## Technology Stack

### Frontend
- **[Nuxt 3](https://nuxt.com/)** - Full-stack Vue.js framework with SSR/SSG
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Pinia](https://pinia.vuejs.org/)** - State management for Vue.js
- **[Chart.js](https://www.chartjs.org/)** - Interactive charts and visualizations

### Backend
- **[Nuxt Server API](https://nuxt.com/docs/guide/directory-structure/server)** - Server-side API routes
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database for flexible data storage
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling for Node.js
- **[Nodemailer](https://nodemailer.com/)** - Email sending capabilities

### Authentication & Integration
- **[Azure AD/MSAL](https://docs.microsoft.com/en-us/azure/active-directory/)** - Enterprise authentication
- **[JIRA REST API](https://developer.atlassian.com/server/jira/platform/rest-apis/)** - Project management integration
- **[JWT](https://jwt.io/)** - Secure token-based authentication

### Development & Deployment
- **[Docker](https://www.docker.com/)** - Containerization for consistent deployment
- **[Vercel](https://vercel.com/)** - Serverless deployment platform
- **[ESLint](https://eslint.org/)** - Code quality and consistency
- **[Yarn](https://yarnpkg.com/)** - Fast, reliable package management

## Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **Yarn** 1.22.0 or higher
- **MongoDB** (for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/project-management-app.git
cd project-management-app
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 4. Start Development Server
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

## 🎭 Demo Mode Setup

For quick evaluation without external dependencies:

### 1. Enable Demo Mode
```bash
echo "DEMO_MODE=true" >> .env
```

### 2. Run Setup Script
```bash
chmod +x scripts/setup-demo.sh
./scripts/setup-demo.sh
```

### 3. Start Application
```bash
yarn dev
```

### 4. Access Demo
Navigate to `http://localhost:3000/demo-login` and select a demo user to explore the platform.

### Demo Data Includes:
- **7 Demo Users** with different roles and permissions
- **5 Sample Projects** at various completion stages
- **Mock JIRA Integration** with realistic issue data
- **Sample Reports** and analytics dashboards
- **File Upload Examples** with temporary storage

## Production Setup

### Environment Variables
Create a `.env` file with the following configuration:

```bash
# Application Settings
NODE_ENV=production
APP_URL=https://your-domain.com

# Database Configuration
MONGO_URI=mongodb://your-mongodb-uri
MONGO_DB=project_management

# Azure AD Authentication
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_TENANT_ID=your-azure-tenant-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_REDIRECT_URI=https://your-domain.com/auth/redirect

# JIRA Integration
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-jira-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT
JIRA_ENABLED=true

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@company.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Security
JWT_SECRET=your-secure-jwt-secret
```

### Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Production Build
```bash
# Build for production
yarn build

# Start production server
yarn start
```

## 📁 Project Structure

```
├── components/           # Reusable Vue components
│   ├── admin/           # Admin-specific components
│   ├── app/             # Core app components (Header, Sidebar, etc.)
│   ├── common/          # Shared utility components
│   ├── jira/            # JIRA integration components
│   └── projects/        # Project-related components
├── composables/         # Vue composables for reusable logic
├── layouts/             # Application layouts
├── middleware/          # Route middleware for authentication
├── pages/               # Application pages (file-based routing)
│   ├── admin/           # Admin panel pages
│   ├── auth/            # Authentication pages
│   ├── projects/        # Project management pages
│   └── settings/        # Application settings
├── plugins/             # Nuxt plugins for global functionality
├── server/              # Backend API and utilities
│   ├── api/             # API route handlers
│   ├── models/          # Database models
│   ├── plugins/         # Server plugins
│   └── utils/           # Server utilities
├── stores/              # Pinia stores for state management
├── types/               # TypeScript type definitions
└── uploads/             # File upload storage (development)
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Project Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### JIRA Integration
- `GET /api/jira/projects` - Get JIRA projects
- `GET /api/jira/issues` - Get JIRA issues
- `POST /api/jira/sync` - Sync project with JIRA

### Demo APIs
- `GET /api/demo/status` - Check demo mode status
- `POST /api/demo/seed` - Seed demo data
- `POST /api/demo/reset` - Reset demo data

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required environment variables from `.env.example`

3. **Deploy**
   ```bash
   # Production deployment
   vercel --prod
   ```

### Docker Deployment

1. **Build Container**
   ```bash
   docker-compose build
   ```

2. **Run Container**
   ```bash
   docker-compose up -d
   ```

3. **Access Application**
   ```
   http://localhost:3000
   ```

### Manual Server Deployment

1. **Build Application**
   ```bash
   yarn build
   ```

2. **Start Production Server**
   ```bash
   yarn start
   ```

3. **Configure Reverse Proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔧 Configuration

### Role-Based Access Control
The application supports seven user roles with different permission levels:

- **SUPER_ADMIN** - Full system access
- **MANAGER** - Project and team management
- **BUSINESS_ANALYST** - Requirements and reporting
- **DEVELOPER** - Technical development tasks
- **DESIGNER** - UI/UX design workflows
- **HR** - Employee management
- **VIEWER** - Read-only access

### JIRA Integration Setup
1. Generate JIRA API token in your Atlassian account
2. Configure JIRA environment variables
3. Enable JIRA integration in settings
4. Link projects to JIRA projects

### Email Configuration
1. Configure SMTP settings in environment variables
2. Set up email templates in `/server/utils/email/`
3. Test email functionality with demo users

## 🧪 Testing

### Run Tests
```bash
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Run specific test file
yarn test auth.test.js
```

### Demo Testing
```bash
# Test demo functionality
yarn test:demo

# Reset demo data
yarn demo:reset
```

## Contributing

Welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Create Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-username/project-management-app/issues)
- **Demo**: Try the live demo at [https://coveragex-project-management-app.vercel.app](https://coveragex-project-management-app.vercel.app)

## 🙏 Acknowledgments

- Built with [Nuxt 3](https://nuxt.com/) and [Vue 3](https://vuejs.org/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons provided by [Material Design Icons](https://materialdesignicons.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)

---

**Ready to get started?** Visit our [live demo](https://coveragex-project-management-app.vercel.app) or follow the [Quick Start](#-quick-start) guide to set up your own instance!
