export interface User {
  _id?: any;
  id: string;
  name: string;
  email: string;
  role: string;
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
}