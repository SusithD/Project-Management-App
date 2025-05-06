import { defineNuxtPlugin } from '#app'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Toast notification modern options
const options = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__fade',
  maxToasts: 20,
  // Modern styling overrides
  toastClassName: "modern-toast",
  bodyClassName: ["modern-toast-body"],
  containerClassName: "modern-toast-container",
  // Custom icons
  filterBeforeCreate: (toast, toasts) => {
    if (toasts.filter(t => t.content === toast.content).length !== 0) {
      // Returning false discards the toast
      return false;
    }
    return toast;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, options)
  
  // Add global CSS for modern toast styling
  if (process.client) {
    const style = document.createElement('style')
    style.innerHTML = `
      .modern-toast-container {
        z-index: 9999;
      }
      
      .modern-toast {
        border-radius: 0.75rem !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        padding: 0.75rem !important;
        min-height: auto !important;
        transition: all 0.3s ease;
        opacity: 0.97 !important;
      }
      
      .modern-toast:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      }
      
      .modern-toast-body {
        font-family: inherit !important;
        padding: 0.25rem !important;
      }
      
      .Vue-Toastification__progress-bar {
        height: 2px !important;
        opacity: 0.7 !important;
      }
      
      .Vue-Toastification__close-button {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease;
      }
      
      .Vue-Toastification__close-button:hover {
        background-color: rgba(0, 0, 0, 0.1) !important;
      }
    `
    document.head.appendChild(style)
  }
})