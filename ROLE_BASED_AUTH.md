# Role-Based Authentication System

## Overview

This implementation provides a complete role-based authentication system with email-based automatic role assignment, hierarchical permissions, and both client-side and server-side protection.

## Features

### ✅ Role Management
- **6 Predefined Roles**: Super Admin, Manager, Business Analyst, Developer, Designer, HR
- **Email-based Assignment**: Automatic role assignment based on email addresses
- **Hierarchical Structure**: Roles have different authority levels
- **Dynamic Permission System**: Granular permissions for different resources and actions

### ✅ Authentication Flow
- **Azure AD Integration**: Uses existing OAuth flow
- **Automatic User Creation**: Creates users with assigned roles on first login
- **Session Management**: Maintains user state across sessions
- **Role Updates**: Automatic role updates when email patterns change

### ✅ Permission System
- **Resource-based**: Controls access to projects, users, reports, tasks
- **Action-based**: Granular control (read, create, update, delete)
- **UI Integration**: Conditional rendering based on permissions
- **API Protection**: Server-side middleware for route protection

## File Structure

```
server/
├── config/
│   └── roles.ts                    # Role definitions and permissions
├── utils/
│   └── auth-roles.ts              # Authentication utilities
├── api/
│   ├── auth/
│   │   └── user.post.ts           # User authentication endpoint
│   └── users/
│       └── [id].put.ts            # User role update endpoint
├── middleware/
│   └── auth.global.ts             # Global auth middleware
stores/
└── auth.js                        # Frontend auth store
components/
├── common/
│   └── RoleBadge.vue             # Role display component
└── app/
    ├── Header.vue                 # Updated with role display
    └── Sidebar.vue               # Role-based navigation
pages/
├── admin/
│   ├── roles.vue                 # Role management dashboard
│   └── auth-demo.vue             # Implementation examples
```

## Quick Start

### 1. Configure Email-Role Mappings

Edit `server/config/roles.ts` to set up your email patterns:

```typescript
export const EMAIL_ROLE_MAPPINGS = [
  { pattern: /admin@company\.com/, role: 'SUPER_ADMIN' },
  { pattern: /manager.*@company\.com/, role: 'MANAGER' },
  { pattern: /dev.*@company\.com/, role: 'DEVELOPER' },
  // Add your patterns here
];
```

### 2. Use in Templates

```vue
<!-- Basic permission checking -->
<button v-if="authStore.hasPermission('projects', 'create')">
  Create Project
</button>

<!-- Resource access checking -->
<AdminPanel v-if="authStore.isSuperAdmin" />
<ManagerDashboard v-else-if="authStore.isManager" />
```

### 3. Use in Scripts

```javascript
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

// Check permissions
const canEdit = authStore.hasPermission('projects', 'update');
const isAdmin = authStore.isSuperAdmin;
```

### 4. Protect API Routes

```typescript
import { requirePermission } from '~/server/utils/auth-roles';

export default defineEventHandler(async (event) => {
  await requirePermission('projects', 'create')(event);
  // Your API logic here
});
```

## Role Definitions

| Role | Hierarchy | Description | Key Permissions |
|------|-----------|-------------|-----------------|
| **SUPER_ADMIN** | 100 | Full system access | All resources: CRUD |
| **MANAGER** | 80 | Team and project management | Users: Read/Update, Projects: CRUD |
| **BUSINESS_ANALYST** | 60 | Project analysis and reporting | Projects: Read/Update, Reports: CRUD |
| **DEVELOPER** | 40 | Development tasks | Projects: Read, Tasks: CRUD |
| **DESIGNER** | 40 | Design and UX tasks | Projects: Read, Tasks: CRUD |
| **HR** | 50 | Human resources | Users: Read, Reports: Read |

## Permission Matrix

| Resource | SUPER_ADMIN | MANAGER | BUSINESS_ANALYST | DEVELOPER | DESIGNER | HR |
|----------|-------------|---------|------------------|-----------|----------|-----|
| **Projects** | CRUD | CRUD | Read/Update | Read | Read | - |
| **Users** | CRUD | Read/Update | - | - | - | Read |
| **Tasks** | CRUD | CRUD | Read/Update | CRUD | CRUD | - |
| **Reports** | CRUD | CRUD | CRUD | Read | Read | Read |

## API Endpoints

### Authentication
- `POST /api/auth/user` - Authenticate user and assign role
- `GET /api/auth/verify` - Verify current user session

### User Management
- `GET /api/users` - List all users (requires user read permission)
- `PUT /api/users/[id]` - Update user role (requires user update permission)

## Security Features

### ✅ Role Hierarchy
- Higher-level roles can manage lower-level roles
- Super Admins can manage anyone
- Managers can manage employees below their level

### ✅ Permission Validation
- Client-side: UI conditional rendering
- Server-side: API endpoint protection
- Route-level: Middleware protection

### ✅ Automatic Updates
- Role assignments update automatically on login
- Permissions are re-evaluated on each request
- Session state is maintained securely

## Usage Examples

Visit `/admin/auth-demo` to see live examples of:
- Current user permissions
- Role-based UI components
- Permission checking examples
- Implementation code samples

## Admin Interface

Visit `/admin/roles` to:
- View all users and their roles
- Update user roles (if you have permission)
- See role statistics
- Manage role assignments

## Testing

The system includes comprehensive examples and a demo page to test all functionality:

1. **Login** with different email addresses to test role assignment
2. **Visit** `/admin/auth-demo` to see your current permissions
3. **Navigate** to different pages to test route protection
4. **Use** the role management dashboard at `/admin/roles`

## Customization

### Adding New Roles
1. Add role definition to `ROLES` in `server/config/roles.ts`
2. Add email pattern to `EMAIL_ROLE_MAPPINGS`
3. Update UI components as needed

### Adding New Permissions
1. Add resource/action to role permissions in `roles.ts`
2. Use `authStore.hasPermission()` in components
3. Protect API routes with `requirePermission()`

### Custom Role Assignment Logic
Modify `getRoleByEmail()` in `server/config/roles.ts` to implement custom logic beyond pattern matching.

## Production Considerations

1. **Email Patterns**: Set up proper email domain patterns for your organization
2. **Default Role**: Configure appropriate default role for unmatched emails  
3. **Database Indexes**: Add indexes on user email and role fields
4. **Logging**: Add audit logging for role changes
5. **Testing**: Test with various email patterns and role combinations

## Troubleshooting

- **Role not assigned**: Check email patterns in `EMAIL_ROLE_MAPPINGS`
- **Permission denied**: Verify role has required permissions in `ROLES`
- **UI not updating**: Check auth store state and component reactivity
- **API errors**: Verify server-side permission middleware

This system provides a solid foundation for role-based authentication that can be easily extended and customized for your specific needs.