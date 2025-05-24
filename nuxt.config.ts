// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  css: [
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  
  runtimeConfig: {
    // Server-side environment variables
    azureAd: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      redirectUri: process.env.AZURE_AD_REDIRECT_URI
    },
    // Email configuration
    email: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || '587',
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASS || '',
      from: process.env.EMAIL_FROM || 'noreply@projectmanagement.com'
    },
    // MongoDB configuration
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGO_DB || 'project_management'
    },
    // JIRA configuration
    jira: {
      baseUrl: process.env.JIRA_BASE_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || '',
      enabled: process.env.JIRA_ENABLED === 'true'
    },
    // Public environment variables
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      // Add Jira base URL to public config for client-side access
      jira: {
        baseUrl: process.env.JIRA_BASE_URL || ''
      },
      msalConfig: {
        auth: {
          clientId: process.env.AZURE_AD_CLIENT_ID || 'your-client-id',
          authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'your-tenant-id'}`,
          redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/auth/redirect',
          postLogoutRedirectUri: process.env.MSAL_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000'
        },
        cache: {
          cacheLocation: 'localStorage'
        }
      }
    }
  },
  
  app: {
    head: {
      title: 'Project Progress Management System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Project Progress Management System for tracking and updating project statuses' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  
  // Persist hydration state for login information 
  imports: {
    autoImport: true,
    dirs: [
      'stores'
    ]
  },
  
  // SSR detection
  ssr: true,
  
  // Improve client/server state handling
  experimental: {
    asyncContext: true,
    payloadExtraction: true
  },
  
  // Route middleware config to better handle auth redirects
  routeRules: {
    // Public routes
    '/login': { ssr: false },
    '/auth/**': { ssr: false },
    
    // Protected routes that need authentication
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/projects/**': { ssr: false },
    '/users/**': { ssr: false },
    '/tasks/**': { ssr: false },
    '/settings/**': { ssr: false },
    '/reports/**': { ssr: false }
  },

  // Adding an alias for the dashboard
  alias: {
    '/dashboard': '~/pages/dashboard.vue'
  }
})