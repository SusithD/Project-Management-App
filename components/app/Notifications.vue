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

// Animation class based on notification type for entering/leaving
const getAnimationClass = (type) => {
  return {
    'animate-slide-in-right': !isSmallScreen.value,
    'animate-slide-in-up': isSmallScreen.value
  };
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
    <div v-if="notificationsStore.notifications.length > 1" class="flex justify-end mb-1 pointer-events-auto">
      <button 
        @click="clearAllNotifications"
        class="text-xs bg-neutral-800 text-white px-2 py-1 rounded hover:bg-neutral-700 transition-colors 
               flex items-center shadow-md opacity-80 hover:opacity-100"
      >
        <span class="mdi mdi-notification-clear-all mr-1"></span>
        Clear all
      </button>
    </div>
    
    <!-- Hidden notifications counter -->
    <div v-if="hiddenNotificationsCount > 0" class="text-center mb-2 pointer-events-auto">
      <span class="bg-neutral-800 text-white px-2 py-1 rounded-full text-xs">
        +{{ hiddenNotificationsCount }} more notifications
      </span>
    </div>
    
    <transition-group name="notification">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        :class="[
          'toast shadow-lg rounded-lg overflow-hidden pointer-events-auto',
          getAnimationClass(notification.type),
          {
            'bg-success-50 border-l-4 border-success-500': notification.type === 'success',
            'bg-error-50 border-l-4 border-error-500': notification.type === 'error',
            'bg-warning-50 border-l-4 border-warning-500': notification.type === 'warning',
            'bg-info-50 border-l-4 border-info-500': notification.type === 'info',
          }
        ]"
      >
        <div class="flex items-start p-4">
          <div :class="[
              'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-3',
              {
                'text-success-600': notification.type === 'success',
                'text-error-600': notification.type === 'error',
                'text-warning-600': notification.type === 'warning',
                'text-info-600': notification.type === 'info',
              }
            ]"
          >
            <span :class="['mdi text-xl', getIconClass(notification.type)]"></span>
          </div>
          <div class="flex-1 ml-2">
            <p :class="[
                'text-sm font-medium mb-1',
                {
                  'text-success-800': notification.type === 'success',
                  'text-error-800': notification.type === 'error',
                  'text-warning-800': notification.type === 'warning',
                  'text-info-800': notification.type === 'info',
                }
              ]"
            >
              {{ notification.message }}
            </p>
            
            <!-- Action buttons if provided -->
            <div v-if="notification.actions" class="mt-2 flex space-x-2">
              <button
                v-for="(action, idx) in notification.actions"
                :key="idx"
                @click="action.onClick(); closeNotification(notification.id)"
                class="text-xs px-2 py-1 rounded font-medium"
                :class="action.primary ? 
                  'bg-primary-500 text-white hover:bg-primary-600' : 
                  'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'"
              >
                {{ action.text }}
              </button>
            </div>
            
            <!-- Timestamp -->
            <div v-if="notification.showTime !== false" class="text-xs text-neutral-500 mt-1">
              {{ new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
          <button
            v-if="notification.dismissible"
            @click="closeNotification(notification.id)"
            class="flex-shrink-0 ml-2 text-neutral-400 hover:text-neutral-700 focus:outline-none"
          >
            <span class="mdi mdi-close text-lg"></span>
          </button>
        </div>
        <!-- Progress bar for auto-dismiss -->
        <div
          v-if="notification.timeout > 0"
          class="h-1 bg-neutral-200"
        >
          <div
            :class="[
              'h-full transition-all duration-100',
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
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .notification-enter-from {
    transform: translateY(100%);
  }
  .notification-leave-to {
    transform: translateY(100%);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s forwards;
}

.animate-slide-in-up {
  animation: slide-in-up 0.3s forwards;
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
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
</style>