// Notifications plugin for global access to notification system
import { useNotificationsStore } from '~/stores/notifications';

export default defineNuxtPlugin((nuxtApp) => {
  // Create helper functions
  const notificationHelpers = {
    /**
     * Show a toast notification
     * @param {string} message - The notification message 
     * @param {string} type - Type of notification (success, error, info, warning)
     * @param {Object} options - Additional options
     */
    toast(message, type = 'info', options = {}) {
      const store = useNotificationsStore();
      return store.add({
        type,
        message,
        ...options
      });
    },

    /**
     * Show a success notification
     * @param {string} message - The notification message
     * @param {Object} options - Additional options
     */
    success(message, options = {}) {
      const store = useNotificationsStore();
      return store.success(message, options);
    },

    /**
     * Show an error notification
     * @param {string} message - The notification message
     * @param {Object} options - Additional options
     */
    error(message, options = {}) {
      const store = useNotificationsStore();
      return store.error(message, options);
    },

    /**
     * Show an info notification
     * @param {string} message - The notification message
     * @param {Object} options - Additional options
     */
    info(message, options = {}) {
      const store = useNotificationsStore();
      return store.info(message, options);
    },

    /**
     * Show a warning notification
     * @param {string} message - The notification message
     * @param {Object} options - Additional options
     */
    warning(message, options = {}) {
      const store = useNotificationsStore();
      return store.warning(message, options);
    },

    /**
     * Show a notification with action buttons
     * @param {string} message - The notification message
     * @param {string} type - Type of notification (success, error, info, warning)
     * @param {Array} actions - Action buttons to display
     * @param {Object} options - Additional options
     */
    withActions(message, type = 'info', actions, options = {}) {
      const store = useNotificationsStore();
      return store.withActions(message, type, actions, options);
    },

    /**
     * Show a confirmation notification and return a promise
     * @param {string} message - The confirmation message
     * @param {Object} options - Confirmation options
     * @returns {Promise} Promise that resolves with user's choice
     */
    confirm(message, options = {}) {
      const store = useNotificationsStore();
      return store.confirm(message, options);
    },

    /**
     * Show a confirmation notification with custom buttons
     * @param {string} message - The notification message
     * @param {Array} options - Confirmation options 
     * @returns {Promise} Promise that resolves with the ID of the button clicked
     */
    async prompt(message, options = {}) {
      const store = useNotificationsStore();
      
      const actions = options.actions || [
        { id: 'cancel', text: 'Cancel', primary: false },
        { id: 'ok', text: 'OK', primary: true }
      ];
      
      return new Promise((resolve) => {
        const actionButtons = actions.map(action => ({
          ...action,
          onClick: () => resolve(action.id)
        }));
        
        store.add({
          type: options.type || 'warning',
          message,
          timeout: 0, // Don't auto-dismiss
          actions: actionButtons,
          ...options
        });
      });
    }
  };

  // Make notification helpers available globally in the application
  nuxtApp.provide('notify', notificationHelpers);
});