// Role-based access control configuration
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RoleConfig {
  name: string;
  permissions: Permission[];
  hierarchy: number; // Higher number = more permissions
}

// Define all available roles with their permissions
export const ROLES: Record<string, RoleConfig> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    hierarchy: 100,
    permissions: [
      { resource: '*', actions: ['*'] }, // Full access to everything
    ]
  },
  MANAGER: {
    name: 'Manager',
    hierarchy: 80,
    permissions: [
      { resource: 'projects', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'users', actions: ['read', 'update'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'jira', actions: ['read', 'write'] },
    ]
  },
  BUSINESS_ANALYST: {
    name: 'Business Analyst',
    hierarchy: 70,
    permissions: [
      { resource: 'projects', actions: ['create', 'read', 'update'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'tasks', actions: ['create', 'read', 'update'] },
      { resource: 'jira', actions: ['read', 'write'] },
    ]
  },
  DEVELOPER: {
    name: 'Developer',
    hierarchy: 50,
    permissions: [
      { resource: 'projects', actions: ['read', 'update'] },
      { resource: 'tasks', actions: ['read', 'update'] },
      { resource: 'jira', actions: ['read', 'write'] },
    ]
  },
  DESIGNER: {
    name: 'Designer',
    hierarchy: 50,
    permissions: [
      { resource: 'projects', actions: ['read', 'update'] },
      { resource: 'tasks', actions: ['read', 'update'] },
    ]
  },
  HR: {
    name: 'HR',
    hierarchy: 60,
    permissions: [
      { resource: 'users', actions: ['create', 'read', 'update'] },
      { resource: 'projects', actions: ['read'] },
      { resource: 'reports', actions: ['read'] },
    ]
  }
};

// Email to role mapping - This is where you define who gets what role
export const EMAIL_ROLE_MAPPING: Record<string, keyof typeof ROLES> = {
  // Super Admin
  'admin@theqexle.com': 'SUPER_ADMIN',
  'salwis@theqexle.com': 'SUPER_ADMIN',
  
  // Managers
  'manager@theqexle.com': 'MANAGER',
  'project.manager@theqexle.com': 'MANAGER',
//   'salwis@theqexle.com': 'MANAGER',
  
  // Business Analysts
  'ba@theqexle.com': 'BUSINESS_ANALYST',
  'analyst@theqexle.com': 'BUSINESS_ANALYST',
//   'slaiws@theqexle.com': 'BUSINESS_ANALYST',
  
  // Developers
  'dev@theqexle.com': 'DEVELOPER',
  'developer@theqexle.com': 'DEVELOPER',
//   'salwis@theqexle.com': 'DEVELOPER',
  
  // Designers
  'design@theqexle.com': 'DESIGNER',
  'designer@theqexle.com': 'DESIGNER',
  
  // HR
  'hr@theqexle.com': 'HR',
  'people@theqexle.com': 'HR',
};

// Default role for users not in the mapping
export const DEFAULT_ROLE: keyof typeof ROLES = 'DEVELOPER';

// Utility functions
export function getRoleByEmail(email: string): keyof typeof ROLES {
  const normalizedEmail = email.toLowerCase().trim();
  return EMAIL_ROLE_MAPPING[normalizedEmail] || DEFAULT_ROLE;
}

export function hasPermission(userRole: keyof typeof ROLES, resource: string, action: string): boolean {
  const role = ROLES[userRole];
  if (!role) return false;
  
  // Super admin has access to everything
  if (userRole === 'SUPER_ADMIN') return true;
  
  // Check specific permissions
  return role.permissions.some(permission => {
    const resourceMatch = permission.resource === '*' || permission.resource === resource;
    const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
    return resourceMatch && actionMatch;
  });
}

export function canAccessResource(userRole: keyof typeof ROLES, resource: string): boolean {
  return hasPermission(userRole, resource, 'read');
}

export function isHigherRole(role1: keyof typeof ROLES, role2: keyof typeof ROLES): boolean {
  return ROLES[role1].hierarchy > ROLES[role2].hierarchy;
}