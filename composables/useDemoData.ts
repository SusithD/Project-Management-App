// Client-side demo data composable
export const useDemoData = () => {
  // Demo Users with different roles
  const DEMO_USERS = [
    {
      id: 'demo-admin-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@demo.com',
      role: 'SUPER_ADMIN',
      department: 'IT Management',
      skills: ['Project Management', 'Leadership', 'Strategic Planning'],
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 2,
        workload: 75
      },
      joinedAt: '2023-01-15T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-manager-001',
      name: 'Michael Chen',
      email: 'michael.chen@demo.com',
      role: 'MANAGER',
      department: 'Engineering',
      skills: ['Team Leadership', 'Agile', 'Technical Architecture'],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 3,
        workload: 85
      },
      joinedAt: '2023-03-20T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-03-20T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-ba-001',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@demo.com',
      role: 'BUSINESS_ANALYST',
      department: 'Product Management',
      skills: ['Requirements Analysis', 'User Research', 'Process Modeling'],
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 2,
        workload: 60
      },
      joinedAt: '2023-02-10T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-02-10T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-dev-001',
      name: 'Alex Thompson',
      email: 'alex.thompson@demo.com',
      role: 'DEVELOPER',
      department: 'Engineering',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 2,
        workload: 70
      },
      joinedAt: '2023-04-05T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-04-05T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-dev-002',
      name: 'Priya Patel',
      email: 'priya.patel@demo.com',
      role: 'DEVELOPER',
      department: 'Engineering',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'partially_available',
        reason: 'Working on critical bug fixes',
        allocatedProjects: 1,
        workload: 90
      },
      joinedAt: '2023-05-12T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-05-12T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-designer-001',
      name: 'David Kim',
      email: 'david.kim@demo.com',
      role: 'DESIGNER',
      department: 'Design',
      skills: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 2,
        workload: 65
      },
      joinedAt: '2023-06-18T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-06-18T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'demo-hr-001',
      name: 'Lisa Wang',
      email: 'lisa.wang@demo.com',
      role: 'HR',
      department: 'Human Resources',
      skills: ['Recruitment', 'Employee Relations', 'HR Policies'],
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      availability: {
        status: 'available',
        allocatedProjects: 1,
        workload: 50
      },
      joinedAt: '2023-01-30T00:00:00.000Z',
      lastActive: new Date().toISOString(),
      createdAt: '2023-01-30T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    }
  ];

  // Group users by role
  const usersByRole = computed(() => {
    const grouped = {};
    DEMO_USERS.forEach(user => {
      if (!grouped[user.role]) {
        grouped[user.role] = [];
      }
      grouped[user.role].push(user);
    });
    return grouped;
  });

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'SUPER_ADMIN': 'Super Admin',
      'MANAGER': 'Manager',
      'BUSINESS_ANALYST': 'Business Analyst',
      'DEVELOPER': 'Developer',
      'DESIGNER': 'Designer',
      'HR': 'HR'
    };
    return roleNames[role] || role;
  };

  // Get role description
  const getRoleDescription = (role: string) => {
    const descriptions = {
      'SUPER_ADMIN': 'Full system access and user management',
      'MANAGER': 'Project management and team oversight',
      'BUSINESS_ANALYST': 'Requirements analysis and project planning',
      'DEVELOPER': 'Technical development and implementation',
      'DESIGNER': 'UI/UX design and prototyping',
      'HR': 'Human resources and user management'
    };
    return descriptions[role] || '';
  };

  return {
    DEMO_USERS,
    usersByRole,
    getRoleDisplayName,
    getRoleDescription
  };
};
