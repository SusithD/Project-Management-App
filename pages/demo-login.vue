<script setup>
import { ref, inject, onMounted } from 'vue';

// Page metadata - use default layout (not dashboard)
definePageMeta({
  layout: 'default'
});

// Use client-side demo data
const { DEMO_USERS, usersByRole, getRoleDisplayName, getRoleDescription } = useDemoData();

const login = inject('login');
const isLoading = ref(false);
const showAnimation = ref(false);
const selectedUser = ref(null);
const showUserSelection = ref(false);

// Demo login function
const handleDemoLogin = async (user) => {
  isLoading.value = true;
  try {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set demo user in auth store
    const authStore = useAuthStore();
    authStore.setDemoUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName: user.role,
      permissions: [], // Will be set by the store
      lastActive: new Date().toISOString(),
      joinedAt: user.joinedAt,
      avatar: user.avatar,
      department: user.department,
      skills: user.skills,
      availability: user.availability
    });
    
    // Navigate to dashboard
    await navigateTo('/dashboard');
  } catch (error) {
    console.error('Demo login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Demo features and limitations data
const demoFeatures = [
  {
    icon: 'mdi-account-group',
    title: 'Role-Based Access Control',
    description: 'Experience different user roles with varying permissions and capabilities',
    color: 'text-blue-600'
  },
  {
    icon: 'mdi-folder-multiple',
    title: 'Sample Projects',
    description: '5 realistic demo projects with complete data including tasks, updates, and files',
    color: 'text-green-600'
  },
  {
    icon: 'mdi-jira',
    title: 'JIRA Integration Demo',
    description: 'Simulated JIRA integration with mock projects, issues, and reporting dashboards',
    color: 'text-orange-600'
  },
  {
    icon: 'mdi-chart-line',
    title: 'Analytics & Reports',
    description: 'Interactive dashboards and project analytics with sample data',
    color: 'text-purple-600'
  },
  {
    icon: 'mdi-email',
    title: 'Notification System',
    description: 'Email notifications and in-app alerts (demo mode - no actual emails sent)',
    color: 'text-red-600'
  },
  {
    icon: 'mdi-file-document',
    title: 'File Management',
    description: 'Upload and manage project files (temporary storage in demo)',
    color: 'text-indigo-600'
  }
];

const demoLimitations = [
  'All data is temporary and resets when you refresh the page',
  'No actual emails are sent (notifications are simulated)',
  'File uploads are temporary and not permanently stored',
  'JIRA integration uses mock data (no real JIRA connection)',
  'Limited to pre-defined demo users and projects',
  'Some advanced features may have reduced functionality'
];

const usageInstructions = [
  {
    step: 1,
    title: 'Choose Your Role',
    description: 'Select a user role below to experience different permission levels and features'
  },
  {
    step: 2,
    title: 'Explore the Dashboard',
    description: 'Navigate through projects, tasks, and reports to see the platform capabilities'
  },
  {
    step: 3,
    title: 'Test JIRA Integration',
    description: 'Visit project details to see mock JIRA integration with sample issues and reports'
  },
  {
    step: 4,
    title: 'Try Different Roles',
    description: 'Log out and try different user roles to see how permissions affect the experience'
  }
];

const showFeatures = ref(false);
const showInstructions = ref(false);

// Add animation effect when page loads
onMounted(() => {
  setTimeout(() => {
    showAnimation.value = true;
  }, 100);
});
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-neutral-50">
    <!-- Left panel - Fixed height, no scrolling -->
    <div class="lg:w-1/2 lg:fixed lg:inset-y-0 lg:left-0 bg-gradient-to-br from-primary-700 to-primary-500 text-white p-12 relative overflow-hidden">
      <div class="absolute inset-0 bg-pattern opacity-10"></div>
      
      <div class="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-white">
              <span class="mdi mdi-chart-timeline-variant text-primary-600 text-xl"></span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">Project Manager</h2>
              <div class="flex items-center mt-1">
                <span class="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full">DEMO</span>
                <span class="ml-2 text-sm text-primary-100">v2.4.1</span>
              </div>
            </div>
          </div>
          
          <div class="mt-16">
            <h1 class="text-4xl font-bold leading-tight">Demo Environment</h1>
            <p class="mt-6 text-lg text-primary-100">
              Experience the full capabilities of our enterprise project management platform with realistic sample data and mock integrations.
            </p>
            
            <!-- Quick Stats -->
            <div class="mt-8 grid grid-cols-2 gap-4">
              <div class="bg-white bg-opacity-10 rounded-lg p-4">
                <div class="text-2xl font-bold">7</div>
                <div class="text-sm text-primary-100">Demo Users</div>
              </div>
              <div class="bg-white bg-opacity-10 rounded-lg p-4">
                <div class="text-2xl font-bold">5</div>
                <div class="text-sm text-primary-100">Sample Projects</div>
              </div>
              <div class="bg-white bg-opacity-10 rounded-lg p-4">
                <div class="text-2xl font-bold">25+</div>
                <div class="text-sm text-primary-100">Mock JIRA Issues</div>
              </div>
              <div class="bg-white bg-opacity-10 rounded-lg p-4">
                <div class="text-2xl font-bold">6</div>
                <div class="text-sm text-primary-100">User Roles</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Features list -->
        <div class="mt-auto">
          <h3 class="text-lg font-semibold mb-4">What You Can Explore</h3>
          <div class="space-y-3">
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-account-multiple text-white"></span>
              </div>
              <p class="ml-3 text-white text-sm">Multiple user roles with different permissions</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-folder-multiple text-white"></span>
              </div>
              <p class="ml-3 text-white text-sm">Complete project lifecycle management</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-jira text-white"></span>
              </div>
              <p class="ml-3 text-white text-sm">Mock JIRA integration with reports</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-chart-line text-white"></span>
              </div>
              <p class="ml-3 text-white text-sm">Analytics dashboards and insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right panel - Scrollable content that adjusts height -->
    <div class="w-full lg:w-1/2 lg:ml-auto min-h-screen">
      <div class="min-h-screen flex items-start justify-center p-6">
        <div 
          :class="[
            'w-full max-w-2xl transition-all duration-500 ease-out transform', 
            showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          ]"
        >
          <div class="bg-white p-8 rounded-2xl shadow-xl my-8">
            <div class="text-center mb-8">
              <!-- Logo and Company Name -->
              <div 
                class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 mb-5 shadow-lg transform transition-transform hover:scale-105 duration-300"
              >
                <span class="mdi mdi-chart-timeline-variant text-white text-3xl"></span>
              </div>
              <h1 class="text-2xl font-bold text-neutral-900 mt-2">Project Manager</h1>
              <div class="flex items-center justify-center mt-2">
                <span class="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full border border-yellow-200">
                  DEMO ENVIRONMENT
                </span>
              </div>
              <p class="text-neutral-600 mt-3">Select a role below to explore the platform with realistic sample data</p>
            </div>

            <!-- Demo Features Toggle -->
            <div class="mb-6">
              <button 
                @click="showFeatures = !showFeatures"
                class="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div class="flex items-center">
                  <span class="mdi mdi-information text-blue-600 mr-2"></span>
                  <span class="text-sm font-medium text-blue-900">Demo Features & Capabilities</span>
                </div>
                <span :class="['mdi', showFeatures ? 'mdi-chevron-up' : 'mdi-chevron-down', 'text-blue-600']"></span>
              </button>
              
              <div v-if="showFeatures" class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="feature in demoFeatures" :key="feature.title" class="flex items-start">
                    <span :class="['mdi', feature.icon, feature.color, 'mr-2 mt-0.5']"></span>
                    <div>
                      <div class="text-sm font-medium text-neutral-900">{{ feature.title }}</div>
                      <div class="text-xs text-neutral-600">{{ feature.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Usage Instructions Toggle -->
            <div class="mb-6">
              <button 
                @click="showInstructions = !showInstructions"
                class="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div class="flex items-center">
                  <span class="mdi mdi-help-circle text-green-600 mr-2"></span>
                  <span class="text-sm font-medium text-green-900">How to Use This Demo</span>
                </div>
                <span :class="['mdi', showInstructions ? 'mdi-chevron-up' : 'mdi-chevron-down', 'text-green-600']"></span>
              </button>
              
              <div v-if="showInstructions" class="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="space-y-3">
                  <div v-for="instruction in usageInstructions" :key="instruction.step" class="flex items-start">
                    <div class="flex-shrink-0 w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                      {{ instruction.step }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-green-900">{{ instruction.title }}</div>
                      <div class="text-xs text-green-700">{{ instruction.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Demo User Selection -->
            <div class="space-y-6">
              <div class="border-t border-neutral-200 pt-6">
                <h3 class="text-lg font-semibold text-neutral-900 mb-4">Choose Your Demo Role</h3>
              </div>
              
              <div v-for="(users, role) in usersByRole" :key="role" class="border border-neutral-200 rounded-lg p-4">
                <div class="mb-4">
                  <h3 class="text-lg font-semibold text-neutral-900">{{ getRoleDisplayName(role) }}</h3>
                  <p class="text-sm text-neutral-600">{{ getRoleDescription(role) }}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    v-for="user in users" 
                    :key="user.id"
                    @click="handleDemoLogin(user)"
                    :disabled="isLoading"
                    class="flex items-center p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all duration-200 group"
                  >
                    <div class="flex-shrink-0 mr-3">
                      <img 
                        :src="user.avatar" 
                        :alt="user.name"
                        class="w-10 h-10 rounded-full object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-neutral-900 truncate">{{ user.name }}</p>
                      <p class="text-xs text-neutral-500 truncate">{{ user.email }}</p>
                      <p class="text-xs text-neutral-400 truncate">{{ user.department }}</p>
                    </div>
                    <div class="flex-shrink-0">
                      <span class="mdi mdi-chevron-right text-neutral-400 group-hover:text-primary-600 transition-colors"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Loading State -->
            <div v-if="isLoading" class="mt-6 text-center">
              <div class="inline-flex items-center text-primary-600">
                <div class="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2"></div>
                <span>Logging in...</span>
              </div>
            </div>
            
            <!-- Enhanced Demo Info -->
            <div class="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <span class="mdi mdi-alert-circle text-amber-600 text-lg"></span>
                </div>
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-amber-900">Important Demo Limitations</h4>
                  <ul class="text-sm text-amber-800 mt-2 space-y-1">
                    <li v-for="limitation in demoLimitations" :key="limitation" class="flex items-start">
                      <span class="mdi mdi-circle-small text-amber-600 mr-1 mt-0.5"></span>
                      <span>{{ limitation }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Demo Data Reset Info -->
            <div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div class="flex items-center">
                <span class="mdi mdi-refresh text-purple-600 mr-2"></span>
                <div class="text-sm">
                  <span class="font-medium text-purple-900">Data Reset:</span>
                  <span class="text-purple-700 ml-1">All demo data resets when you refresh the page or restart the session</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Footer -->
          <div class="text-center mb-8 text-xs text-neutral-500">
            <div class="flex items-center justify-center space-x-4 mb-2">
              <span>© 2025 Project Manager</span>
              <span>•</span>
              <span>Demo Environment v2.4.1</span>
              <span>•</span>
              <span class="text-green-600 font-medium">✓ Active</span>
            </div>
            <p class="text-neutral-400">
              This demo showcases enterprise project management capabilities with sample data
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Background pattern */
.bg-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
