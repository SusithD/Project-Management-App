import { defineStore } from 'pinia';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    nextId: 1,
    config: {
      position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top, bottom
      defaultTimeout: 5000,
      maxNotifications: 10,
      closeOnClick: true,
      pauseOnHover: true,
      allowDuplicates: false,
      newestOnTop: true,
      showProgress: true,
      swipeToClose: true,
      backdrop: false // Show backdrop behind notifications
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
    },

    /**
     * Check if a notification with specific message already exists
     */
    hasNotification: (state) => (message) => {
      return state.notifications.some(n => n.message === message);
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
     * @param {string} [notification.icon] - Custom icon to use (overrides default)
     */
    add(notification) {
      // Check for duplicates if not allowed
      if (!this.config.allowDuplicates && this.hasNotification(notification.message)) {
        return -1; // Skip adding duplicate
      }

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
      
      // Add to beginning or end based on config
      if (this.config.newestOnTop) {
        this.notifications.unshift(newNotification);
      } else {
        this.notifications.push(newNotification);
      }
      
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
    },

    /**
     * Show a notification with a promise that resolves when closed
     * @param {string} message - Notification message
     * @param {string} type - Type of notification
     * @param {Object} options - Additional options
     * @returns {Promise} Promise that resolves when notification is closed
     */
    async prompt(message, options = {}) {
      return new Promise((resolve) => {
        const id = this.add({
          type: options.type || 'info',
          message,
          actions: [{
            text: options.buttonText || 'OK',
            onClick: () => resolve(true),
            primary: true
          }],
          timeout: options.timeout || 0,
          onClose: () => resolve(false),
          ...options
        });
      });
    },
    
    /**
     * Add a smart notification with context-aware settings
     */
    addSmart(type, message, context = {}) {
      const notification = {
        id: this.nextId++,
        type,
        message,
        createdAt: new Date(),
        timeout: this.getTimeoutForType(type),
        dismissible: true,
        showTime: true,
        priority: this.getPriorityForType(type),
        ...context
      };

      // Add context-specific enhancements
      if (context.projectId) {
        notification.actions = [
          {
            text: 'View Project',
            action: () => navigateTo(`/projects/${context.projectId}`),
            primary: true
          }
        ];
      }

      if (context.userId) {
        notification.actions = notification.actions || [];
        notification.actions.push({
          text: 'View User',
          action: () => navigateTo(`/users/${context.userId}`)
        });
      }

      this.addNotification(notification);
      return notification.id;
    },

    /**
     * Add notification with progress tracking
     */
    addProgress(message, initialProgress = 0) {
      const notification = {
        id: this.nextId++,
        type: 'info',
        message,
        createdAt: new Date(),
        timeout: 0, // Don't auto-dismiss
        dismissible: false,
        showTime: true,
        progress: initialProgress,
        showProgress: true
      };

      this.addNotification(notification);
      return notification.id;
    },

    /**
     * Update progress notification
     */
    updateProgress(id, progress, message) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.progress = Math.min(100, Math.max(0, progress));
        if (message) notification.message = message;
        
        // Auto-complete when reaching 100%
        if (progress >= 100) {
          setTimeout(() => {
            notification.type = 'success';
            notification.dismissible = true;
            notification.timeout = 3000;
            this.scheduleRemoval(notification);
          }, 500);
        }
      }
    },

    /**
     * Add notification for system events
     */
    addSystemEvent(event, data = {}) {
      const eventMessages = {
        'project.created': `Project "${data.projectName}" has been created`,
        'project.updated': `Project "${data.projectName}" has been updated`,
        'project.deleted': `Project "${data.projectName}" has been deleted`,
        'project.completed': `🎉 Project "${data.projectName}" has been completed!`,
        'user.assigned': `You have been assigned to project "${data.projectName}"`,
        'deadline.approaching': `⚠️ Project "${data.projectName}" deadline is approaching`,
        'deadline.overdue': `🚨 Project "${data.projectName}" is overdue`,
        'sync.completed': `JIRA sync completed for "${data.projectName}"`,
        'backup.completed': 'System backup completed successfully',
        'maintenance.scheduled': 'Scheduled maintenance will begin in 30 minutes'
      };

      const message = eventMessages[event] || `System event: ${event}`;
      const type = this.getTypeForEvent(event);
      
      this.addSmart(type, message, data);
    },

    /**
     * Get appropriate timeout based on notification type
     */
    getTimeoutForType(type) {
      const timeouts = {
        error: 8000,
        warning: 6000,
        success: 4000,
        info: 5000
      };
      return timeouts[type] || this.config.defaultTimeout;
    },

    /**
     * Get priority level for notification type
     */
    getPriorityForType(type) {
      const priorities = {
        error: 3,
        warning: 2,
        success: 1,
        info: 0
      };
      return priorities[type] || 0;
    },

    /**
     * Get notification type based on system event
     */
    getTypeForEvent(event) {
      if (event.includes('error') || event.includes('failed') || event.includes('overdue')) {
        return 'error';
      }
      if (event.includes('warning') || event.includes('approaching') || event.includes('maintenance')) {
        return 'warning';
      }
      if (event.includes('completed') || event.includes('success') || event.includes('created')) {
        return 'success';
      }
      return 'info';
    },

    /**
     * Add a notification with custom ID
     * @param {Object} notification - Notification data
     * @param {number} notification.id - Custom ID for the notification
     * @param {string} notification.type - Type of notification (success, error, info, warning)
     * @param {string} notification.message - Notification message
     * @param {number} [notification.timeout=5000] - Auto-dismiss timeout in milliseconds
     * @param {boolean} [notification.dismissible=true] - Whether the notification can be dismissed manually
     * @param {Array} [notification.actions] - Action buttons that can be shown in the notification
     * @param {boolean} [notification.showTime=true] - Whether to show the timestamp
     * @param {string} [notification.icon] - Custom icon to use (overrides default)
     */
    addNotification(notification) {
      // Check for duplicates if not allowed
      if (!this.config.allowDuplicates && this.hasNotification(notification.message)) {
        return -1; // Skip adding duplicate
      }

      // Ensure ID is set
      if (!notification.id) {
        notification.id = this.nextId++;
      }
      
      const defaults = {
        type: 'info',
        message: '',
        timeout: this.config.defaultTimeout,
        dismissible: true,
        showTime: true,
        createdAt: new Date()
      };
      
      const newNotification = { ...defaults, ...notification };
      
      // Add to beginning or end based on config
      if (this.config.newestOnTop) {
        this.notifications.unshift(newNotification);
      } else {
        this.notifications.push(newNotification);
      }
      
      // Auto-dismiss after timeout if specified
      if (newNotification.timeout > 0) {
        setTimeout(() => {
          this.remove(newNotification.id);
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
      
      return notification.id;
    },

    /**
     * Schedule removal of a notification
     * @param {Object} notification - Notification object
     * @param {number} delay - Delay in milliseconds
     */
    scheduleRemoval(notification, delay = 3000) {
      setTimeout(() => {
        this.remove(notification.id);
      }, delay);
    }
  }
});