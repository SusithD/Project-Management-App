import { ROLES } from '../config/roles';

export interface User {
  _id?: any;
  id: string;
  name: string;
  email: string;
  role: keyof typeof ROLES; // Now typed to only allow valid roles
  department?: string;
  skills?: string[];
  avatar?: string;
  availability: {
    status: 'available' | 'partially_available' | 'unavailable';
    reason?: string;
    availableFrom?: string; // ISO date string when they become available again
    allocatedProjects?: number; // Count of currently allocated projects
    workload?: number; // Percentage (0-100) representing current workload
  };
  joinedAt?: string;
  lastActive?: string;
  // New fields for role-based access
  permissions?: string[]; // Cached permissions for quick access
  lastRoleUpdate?: string; // When role was last updated
}