<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useNotificationsStore } from '~/stores/notifications';

const notificationsStore = useNotificationsStore();
const isSmallScreen = ref(false);
const maxVisibleNotifications = ref(5); // Limit visible notifications

// Position notifications at the top right on desktop and bottom on small screens
const notificationsPosition = computed(() => {
  return isSmallScreen.value ? 'toast-bottom' : 'toast-top-right';
});

// Show only the most recent notifications
const visibleNotifications = computed(() => {
  return notificationsStore.notifications.slice(0, maxVisibleNotifications.value);
});

// Count of additional notifications not shown
const hiddenNotificationsCount = computed(() => {
  return Math.max(0, notificationsStore.notifications.length - maxVisibleNotifications.value);
});

// Function to get icon based on notification type
const getIconClass = (type) => {
  switch (type) {
    case 'success':
      return 'mdi-check-circle';
    case 'error':
      return 'mdi-alert-circle';
    case 'warning':
      return 'mdi-alert';
    case 'info':
    default:
      return 'mdi-information';
  }
};

// Get the background gradient based on notification type
const getGradientClass = (type) => {
  switch (type) {
    case 'success':
      return 'from-success-500 to-success-600';
    case 'error':
      return 'from-error-500 to-error-600';
    case 'warning':
      return 'from-warning-500 to-warning-600';
    case 'info':
    default:
      return 'from-info-500 to-info-600';
  }
};

// Handle window resize to determine screen size
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 640;
};

// Close a notification manually
const closeNotification = (id) => {
  notificationsStore.remove(id);
};

// Clear all notifications
const clearAllNotifications = () => {
  notificationsStore.clear();
};

// Auto-clear old notifications after a threshold
watch(() => notificationsStore.notifications.length, (newLength, oldLength) => {
  if (newLength > 10) { // If we have more than 10 notifications
    const oldestNotification = [...notificationsStore.notifications]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    
    if (oldestNotification) {
      notificationsStore.remove(oldestNotification.id);
    }
  }
});

onMounted(() => {
  if (process.client) {
    handleResize();
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('resize', handleResize);
  }
});
</script>

<template>
  <div :class="[notificationsPosition, 'fixed z-50 p-4 space-y-3 pointer-events-none max-w-md w-full']">
    <!-- Clear all button if there are multiple notifications -->
    <div v-if="notificationsStore.notifications.length > 1" class="flex justify-end mb-2 pointer-events-auto">
      <button 
        @click="clearAllNotifications"
        class="text-xs bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full hover:bg-black/90 transition-colors
               flex items-center shadow-lg hover:shadow-xl"
      >
        <span class="mdi mdi-notification-clear-all mr-1"></span>
        Clear all
      </button>
    </div>
    
    <!-- Hidden notifications counter -->
    <div v-if="hiddenNotificationsCount > 0" class="text-center mb-2 pointer-events-auto">
      <span class="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs shadow-lg">
        +{{ hiddenNotificationsCount }} more notifications
      </span>
    </div>
    
    <transition-group name="notification" tag="div" class="space-y-3">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        class="toast pointer-events-auto transform transition-all duration-300 scale-100"
      >
        <!-- Modern toast design with glass morphism effect -->
        <div class="relative overflow-hidden bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
          <!-- Colored indicator based on type -->
          <div 
            :class="['absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b', getGradientClass(notification.type)]"
          ></div>
          
          <div class="px-4 py-3 flex items-start">
            <!-- Icon with colored background -->
            <div :class="[
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-gradient-to-br',
              getGradientClass(notification.type),
              'text-white shadow-sm'
            ]">
              <span :class="['mdi', getIconClass(notification.type)]"></span>
            </div>
            
            <div class="flex-1">
              <!-- Message with proper formatting -->
              <p class="text-sm font-medium text-neutral-800 leading-5">
                {{ notification.message }}
              </p>
              
              <!-- Action buttons if provided -->
              <div v-if="notification.actions" class="mt-2 flex space-x-2">
                <button
                  v-for="(action, idx) in notification.actions"
                  :key="idx"
                  @click="action.onClick(); closeNotification(notification.id)"
                  class="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200"
                  :class="action.primary ? 
                    'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md' : 
                    'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'"
                >
                  {{ action.text }}
                </button>
              </div>
              
              <!-- Timestamp with subtle styling -->
              <div v-if="notification.showTime !== false" class="text-xs text-neutral-500 mt-1.5">
                {{ new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
            
            <!-- Close button -->
            <button
              v-if="notification.dismissible"
              @click="closeNotification(notification.id)"
              class="flex-shrink-0 ml-2 w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 
                     hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <span class="mdi mdi-close text-lg"></span>
            </button>
          </div>
          
          <!-- Progress bar for auto-dismiss -->
          <div
            v-if="notification.timeout > 0"
            class="h-0.5 bg-neutral-100"
          >
            <div
              :class="[
                'h-full',
                {
                  'bg-success-500': notification.type === 'success',
                  'bg-error-500': notification.type === 'error',
                  'bg-warning-500': notification.type === 'warning',
                  'bg-info-500': notification.type === 'info',
                }
              ]"
              :style="{
                width: '100%',
                animation: `progress-shrink ${notification.timeout}ms linear forwards`
              }"
            ></div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-top-right {
  top: 1rem;
  right: 1rem;
}

.toast-bottom {
  bottom: 1rem;
  left: 0;
  right: 0;
  margin: 0 auto;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

@media (max-width: 640px) {
  .notification-enter-from {
    transform: translateY(30px) scale(0.9);
  }
  .notification-leave-to {
    transform: translateY(30px) scale(0.9);
  }
}

@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Add subtle hover effect */
.toast:hover {
  transform: translateY(-2px) scale(1.01);
}

/* Add subtle pulse animation for new notifications */
@keyframes subtle-pulse {
  0% { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
  50% { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
  100% { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
}
</style>