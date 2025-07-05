<template>
  <div class="flex items-center space-x-2">
    <!-- Role Badge -->
    <span 
      :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        roleColorClasses
      ]"
    >
      <span :class="['w-2 h-2 mr-2 rounded-full', roleDotColor]"></span>
      {{ displayRole }}
    </span>
    
    <!-- Permission Level Indicator -->
    <div v-if="showPermissionLevel" class="flex items-center text-xs text-gray-500">
      <span class="mdi mdi-shield-check mr-1"></span>
      Level {{ permissionLevel }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  role: {
    type: String,
    required: true
  },
  showPermissionLevel: {
    type: Boolean,
    default: false
  }
});

// Client-side role configuration
const roleConfig = {
  'SUPER_ADMIN': { name: 'Super Administrator', hierarchy: 6 },
  'MANAGER': { name: 'Manager', hierarchy: 5 },
  'BUSINESS_ANALYST': { name: 'Business Analyst', hierarchy: 4 },
  'DEVELOPER': { name: 'Developer', hierarchy: 3 },
  'DESIGNER': { name: 'Designer', hierarchy: 2 },
  'HR': { name: 'Human Resources', hierarchy: 1 }
};

const displayRole = computed(() => {
  return roleConfig[props.role]?.name || props.role;
});

const permissionLevel = computed(() => {
  return roleConfig[props.role]?.hierarchy || 0;
});

const roleColorClasses = computed(() => {
  const colorMap = {
    'SUPER_ADMIN': 'bg-red-100 text-red-800',
    'MANAGER': 'bg-purple-100 text-purple-800',
    'BUSINESS_ANALYST': 'bg-blue-100 text-blue-800',
    'DEVELOPER': 'bg-green-100 text-green-800',
    'DESIGNER': 'bg-pink-100 text-pink-800',
    'HR': 'bg-orange-100 text-orange-800'
  };
  return colorMap[props.role] || 'bg-gray-100 text-gray-800';
});

const roleDotColor = computed(() => {
  const colorMap = {
    'SUPER_ADMIN': 'bg-red-400',
    'MANAGER': 'bg-purple-400',
    'BUSINESS_ANALYST': 'bg-blue-400',
    'DEVELOPER': 'bg-green-400',
    'DESIGNER': 'bg-pink-400',
    'HR': 'bg-orange-400'
  };
  return colorMap[props.role] || 'bg-gray-400';
});
</script>