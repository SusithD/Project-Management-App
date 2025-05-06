<template>
  <div class="relative">
    <!-- Header with title -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
        <p class="text-neutral-600">Manage your account and application preferences</p>
      </div>
    </div>

    <!-- Settings Section -->
    <div class="bg-white rounded-xl shadow-card mb-8">
      <!-- Tabs Navigation -->
      <div class="border-b border-neutral-200 px-5">
        <div class="flex">
          <button 
            @click="activeTab = 'account'" 
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              activeTab === 'account' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Account
          </button>
          <button 
            @click="activeTab = 'profile'" 
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              activeTab === 'profile' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Profile
          </button>
          <button 
            @click="activeTab = 'notifications'" 
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              activeTab === 'notifications' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Notifications
          </button>
          <button 
            @click="activeTab = 'appearance'" 
            :class="[
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              activeTab === 'appearance' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Appearance
          </button>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="p-6">
        <!-- Account Settings -->
        <div v-if="activeTab === 'account'" class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-neutral-900 mb-4">Account Information</h3>
            
            <div class="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <label for="email" class="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  :value="user.email"
                  readonly
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm bg-neutral-50 text-neutral-700 sm:text-sm"
                />
              </div>
              
              <div>
                <label for="name" class="block text-sm font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  v-model="user.name"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div class="pt-5 border-t border-neutral-200">
            <h3 class="text-lg font-medium text-neutral-900 mb-4">Change Password</h3>
            
            <div class="space-y-4">
              <div>
                <label for="current-password" class="block text-sm font-medium text-neutral-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current-password"
                  v-model="passwords.current"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label for="new-password" class="block text-sm font-medium text-neutral-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  v-model="passwords.new"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label for="confirm-password" class="block text-sm font-medium text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  v-model="passwords.confirm"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div class="mt-6">
              <button
                @click="updatePassword"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
        
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-neutral-900 mb-4">Profile Information</h3>
            
            <div class="flex items-center mb-6">
              <div class="relative h-24 w-24 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200">
                <div v-if="!user.avatar" class="h-full w-full flex items-center justify-center bg-neutral-200 text-neutral-500">
                  <span class="mdi mdi-account text-4xl"></span>
                </div>
                <img v-else :src="user.avatar" alt="Profile" class="h-full w-full object-cover" />
                
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button class="text-white text-sm font-medium">
                    Change
                  </button>
                </div>
              </div>
              
              <div class="ml-6">
                <button class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Upload new image
                </button>
                <p class="mt-1 text-xs text-neutral-500">
                  JPG, GIF or PNG. Max size of 2MB
                </p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <label for="job-title" class="block text-sm font-medium text-neutral-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  id="job-title"
                  v-model="user.jobTitle"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label for="department" class="block text-sm font-medium text-neutral-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  v-model="user.department"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div class="sm:col-span-2">
                <label for="bio" class="block text-sm font-medium text-neutral-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows="4"
                  v-model="user.bio"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div class="pt-5 border-t border-neutral-200">
            <div class="flex justify-end">
              <button
                type="button"
                class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                Cancel
              </button>
              <button
                @click="updateProfile"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        
        <!-- Notification Settings -->
        <div v-if="activeTab === 'notifications'" class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-neutral-900 mb-4">Notification Preferences</h3>
            
            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    v-model="notifications.email"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="email-notifications" class="font-medium text-neutral-700">Email Notifications</label>
                  <p class="text-neutral-500">Receive notifications about project updates, tasks and messages via email.</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="push-notifications"
                    type="checkbox"
                    v-model="notifications.push"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="push-notifications" class="font-medium text-neutral-700">Push Notifications</label>
                  <p class="text-neutral-500">Receive push notifications in your browser or mobile app.</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="task-reminders"
                    type="checkbox"
                    v-model="notifications.taskReminders"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="task-reminders" class="font-medium text-neutral-700">Task Reminders</label>
                  <p class="text-neutral-500">Get reminded about upcoming task deadlines.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-5 border-t border-neutral-200">
            <div class="flex justify-end">
              <button
                @click="updateNotifications"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
        
        <!-- Appearance Settings -->
        <div v-if="activeTab === 'appearance'" class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-neutral-900 mb-4">Appearance Settings</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  Theme
                </label>
                
                <div class="grid grid-cols-3 gap-4">
                  <div
                    @click="appearance.theme = 'light'"
                    :class="[
                      'border rounded-md p-4 cursor-pointer',
                      appearance.theme === 'light' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300'
                    ]"
                  >
                    <div class="bg-white border border-neutral-200 h-16 rounded-md mb-2"></div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium">Light</span>
                      <span v-if="appearance.theme === 'light'" class="mdi mdi-check-circle text-primary-500"></span>
                    </div>
                  </div>
                  
                  <div
                    @click="appearance.theme = 'dark'"
                    :class="[
                      'border rounded-md p-4 cursor-pointer',
                      appearance.theme === 'dark' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300'
                    ]"
                  >
                    <div class="bg-neutral-800 border border-neutral-700 h-16 rounded-md mb-2"></div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium">Dark</span>
                      <span v-if="appearance.theme === 'dark'" class="mdi mdi-check-circle text-primary-500"></span>
                    </div>
                  </div>
                  
                  <div
                    @click="appearance.theme = 'system'"
                    :class="[
                      'border rounded-md p-4 cursor-pointer',
                      appearance.theme === 'system' ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300'
                    ]"
                  >
                    <div class="bg-gradient-to-r from-white to-neutral-800 h-16 rounded-md mb-2"></div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium">System</span>
                      <span v-if="appearance.theme === 'system'" class="mdi mdi-check-circle text-primary-500"></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  Color Scheme
                </label>
                
                <div class="grid grid-cols-4 gap-4">
                  <div
                    v-for="color in colorOptions"
                    :key="color.value"
                    @click="appearance.colorScheme = color.value"
                    :class="[
                      'border rounded-md p-2 cursor-pointer',
                      appearance.colorScheme === color.value ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300'
                    ]"
                  >
                    <div :class="`bg-${color.value}-500 h-8 rounded-md mb-2`"></div>
                    <div class="flex justify-center items-center">
                      <span class="text-xs font-medium">{{ color.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-5 border-t border-neutral-200">
            <div class="flex justify-end">
              <button
                @click="updateAppearance"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '~/stores/auth';

definePageMeta({
  layout: 'dashboard'
});

// Auth store
const authStore = useAuthStore();

// Toast notifications
function useToastification() {
  const { $toast } = useNuxtApp();
  
  return {
    success: (message) => $toast.success(message),
    error: (message) => $toast.error(message),
    info: (message) => $toast.info(message),
    warning: (message) => $toast.warning(message)
  };
}

const toast = useToastification();

// Active settings tab
const activeTab = ref('account');

// Mock user data (in a real app, this would come from an API or store)
const user = reactive({
  email: authStore.userEmail || 'user@example.com',
  name: authStore.userName || 'John Doe',
  avatar: null,
  jobTitle: 'Software Developer',
  department: 'Engineering',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies ultricies, nisl nisl.'
});

// Password change form
const passwords = reactive({
  current: '',
  new: '',
  confirm: ''
});

// Notification settings
const notifications = reactive({
  email: true,
  push: true,
  taskReminders: true
});

// Appearance settings
const appearance = reactive({
  theme: 'light',
  colorScheme: 'primary'
});

const colorOptions = [
  { value: 'primary', label: 'Blue' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'teal', label: 'Teal' }
];

// Form submission functions
const updatePassword = () => {
  // Validate passwords
  if (!passwords.current) {
    return toast.error('Please enter your current password');
  }
  
  if (!passwords.new) {
    return toast.error('Please enter a new password');
  }
  
  if (passwords.new !== passwords.confirm) {
    return toast.error('New passwords do not match');
  }
  
  // In a real app, you would submit this to an API
  // For now, just show a success message
  toast.success('Password updated successfully');
  
  // Reset form
  passwords.current = '';
  passwords.new = '';
  passwords.confirm = '';
};

const updateProfile = () => {
  // In a real app, you would submit this to an API
  toast.success('Profile information updated');
};

const updateNotifications = () => {
  // In a real app, you would submit this to an API
  toast.success('Notification preferences saved');
};

const updateAppearance = () => {
  // In a real app, you would save this to user preferences
  toast.success('Appearance preferences saved');
};
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}
</style>