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
    // MongoDB configuration
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGO_DB || 'project_management'
    },
    // Public environment variables
    public: {
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
  }
})