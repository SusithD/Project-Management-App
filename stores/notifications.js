import { defineStore } from 'pinia';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    nextId: 1,
    config: {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top, bottom
      defaultTimeout: 5000,
      maxNotifications: 10
    }
  }),
  
  getters: {
    /**
     * Get notifications by type
     */
    getByType: (state) => (type) => {
      return state.notifications.filter(n => n.type === type);
    },
    
    /**
     * Count notifications by type
     */
    countByType: (state) => (type) => {
      return state.notifications.filter(n => n.type === type).length;
    }
  },
  
  actions: {
    /**
     * Configure notification system
     * @param {Object} config - Configuration options
     */
    configure(config) {
      this.config = {
        ...this.config,
        ...config
      };
    },
    
    /**
     * Add a new notification
     * @param {Object} notification - Notification data
     * @param {string} notification.type - Type of notification (success, error, info, warning)
     * @param {string} notification.message - Notification message
     * @param {number} [notification.timeout=5000] - Auto-dismiss timeout in milliseconds
     * @param {boolean} [notification.dismissible=true] - Whether the notification can be dismissed manually
     * @param {Array} [notification.actions] - Action buttons that can be shown in the notification
     * @param {boolean} [notification.showTime=true] - Whether to show the timestamp
     */
    add(notification) {
      const id = this.nextId++;
      const defaults = {
        id,
        type: 'info',
        message: '',
        timeout: this.config.defaultTimeout,
        dismissible: true,
        showTime: true,
        createdAt: new Date()
      };
      
      const newNotification = { ...defaults, ...notification };
      this.notifications.unshift(newNotification); // Add to beginning for newest first
      
      // Auto-dismiss after timeout if specified
      if (newNotification.timeout > 0) {
        setTimeout(() => {
          this.remove(id);
        }, newNotification.timeout);
      }
      
      // Respect max notifications limit
      if (this.notifications.length > this.config.maxNotifications) {
        const oldest = [...this.notifications]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
        if (oldest) {
          this.remove(oldest.id);
        }
      }
      
      return id;
    },
    
    /**
     * Remove a notification by ID
     * @param {number} id - ID of notification to remove
     */
    remove(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },
    
    /**
     * Remove all notifications
     */
    clear() {
      this.notifications = [];
    },
    
    /**
     * Add a success notification
     * @param {string} message - Notification message
     * @param {Object} options - Optional notification options
     * @param {number} [options.timeout=5000] - Auto-dismiss timeout
     * @param {Array} [options.actions] - Action buttons
     */
    success(message, options = {}) {
      return this.add({
        type: 'success',
        message,
        ...options
      });
    },
    
    /**
     * Add an error notification
     * @param {string} message - Notification message
     * @param {Object} options - Optional notification options
     * @param {number} [options.timeout=8000] - Auto-dismiss timeout
     * @param {Array} [options.actions] - Action buttons
     */
    error(message, options = {}) {
      const defaultOptions = { timeout: 8000 };
      return this.add({
        type: 'error',
        message,
        ...defaultOptions,
        ...options
      });
    },
    
    /**
     * Add an info notification
     * @param {string} message - Notification message
     * @param {Object} options - Optional notification options
     * @param {number} [options.timeout=5000] - Auto-dismiss timeout
     * @param {Array} [options.actions] - Action buttons
     */
    info(message, options = {}) {
      return this.add({
        type: 'info',
        message,
        ...options
      });
    },
    
    /**
     * Add a warning notification
     * @param {string} message - Notification message
     * @param {Object} options - Optional notification options
     * @param {number} [options.timeout=7000] - Auto-dismiss timeout
     * @param {Array} [options.actions] - Action buttons
     */
    warning(message, options = {}) {
      const defaultOptions = { timeout: 7000 };
      return this.add({
        type: 'warning',
        message,
        ...defaultOptions,
        ...options
      });
    },
    
    /**
     * Add a notification with action buttons
     * @param {string} message - Notification message
     * @param {string} type - Type of notification
     * @param {Array} actions - Array of action objects
     * @param {Object} options - Additional notification options
     */
    withActions(message, type = 'info', actions, options = {}) {
      return this.add({
        type,
        message,
        actions,
        timeout: 0, // Don't auto-dismiss by default for notifications with actions
        ...options
      });
    },
    
    /**
     * Create a confirmation notification that resolves a promise based on user action
     * @param {string} message - Confirmation message
     * @param {Object} options - Confirmation options
     * @returns {Promise} Promise that resolves with user's choice
     */
    confirm(message, options = {}) {
      return new Promise((resolve) => {
        const confirmId = this.add({
          type: options.type || 'warning',
          message,
          timeout: 0, // No auto-dismiss for confirmation
          actions: [
            {
              text: options.cancelText || 'Cancel',
              onClick: () => resolve(false),
              primary: false
            },
            {
              text: options.confirmText || 'Confirm',
              onClick: () => resolve(true),
              primary: true
            }
          ],
          ...options
        });
      });
    }
  }
});