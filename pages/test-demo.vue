<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Demo Login Test</h1>
      
      <div class="space-y-4">
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 class="text-lg font-semibold text-green-800 mb-2">✅ Demo Login Page</h2>
          <p class="text-green-700 mb-4">The demo login page should now be accessible without redirects.</p>
          
          <NuxtLink 
            to="/demo-login"
            class="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Demo Login
          </NuxtLink>
        </div>
        
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 class="text-lg font-semibold text-blue-800 mb-2">🔧 What Was Fixed</h2>
          <ul class="text-blue-700 space-y-1 text-sm">
            <li>• Updated global auth middleware to exclude /demo-login</li>
            <li>• Updated auth session plugin to skip demo login route</li>
            <li>• Fixed server-side import issue in demo login page</li>
            <li>• Added proper page metadata for layout</li>
          </ul>
        </div>
        
                  <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 class="text-lg font-semibold text-yellow-800 mb-2">📋 Next Steps</h2>
            <ol class="text-yellow-700 space-y-1 text-sm">
              <li>1. Click "Go to Demo Login" above</li>
              <li>2. Select a demo user role</li>
              <li>3. Explore the platform with sample data</li>
              <li>4. Check that demo mode indicator appears</li>
            </ol>
          </div>
          
          <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h2 class="text-lg font-semibold text-purple-800 mb-2">🧪 Test Demo Data</h2>
            <p class="text-purple-700 mb-3">Test if demo data is being returned correctly:</p>
            <button 
              @click="testDemoData"
              :disabled="testingDemo"
              class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {{ testingDemo ? 'Testing...' : 'Test Demo Data' }}
            </button>
            <div v-if="demoTestResult" class="mt-3 p-3 bg-white rounded border">
              <pre class="text-xs text-gray-700">{{ JSON.stringify(demoTestResult, null, 2) }}</pre>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Page metadata
definePageMeta({
  layout: 'default'
});

const testingDemo = ref(false);
const demoTestResult = ref(null);

// Test demo data
const testDemoData = async () => {
  testingDemo.value = true;
  demoTestResult.value = null;
  
  try {
    const authStore = useAuthStore();
    const queryParams = new URLSearchParams();
    if (authStore.userEmail) {
      queryParams.append('userEmail', authStore.userEmail);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/demo/test${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    demoTestResult.value = data;
  } catch (error) {
    console.error('Error testing demo data:', error);
    demoTestResult.value = { error: error.message };
  } finally {
    testingDemo.value = false;
  }
};
</script>
