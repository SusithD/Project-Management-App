import { User, Project, ProjectUpdate, ProjectFile } from './schemas';
import { ROLES } from '../config/roles';

// Demo Users with different roles
export const DEMO_USERS: User[] = [
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

// Demo Projects
export const DEMO_PROJECTS: Project[] = [
  {
    id: 1001,
    name: 'E-Commerce Platform Redesign',
    status: 'Ongoing',
    progress: 65,
    assignedTo: 'demo-manager-001',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-06-30T00:00:00.000Z',
    remarks: 'Complete redesign of the existing e-commerce platform with modern UI/UX',
    notes: 'Focus on mobile-first design and improved checkout flow',
    priority: 'High',
    category: 'Web Development',
    team: ['demo-dev-001', 'demo-dev-002', 'demo-designer-001'],
    company: 'TechCorp Inc.',
    statusPhase: 'Development',
    deadline: '2024-06-30T00:00:00.000Z',
    comments: 'Making good progress on the frontend components',
    developers: ['demo-dev-001', 'demo-dev-002'],
    blockers: 'Waiting for payment gateway API documentation',
    responsiblePerson: 'Michael Chen',
    initiallyRaisedOn: '2024-01-10T00:00:00.000Z',
    pendingDays: 45,
    feedbackForBlockers: 'API docs expected by next week',
    createdAt: '2024-01-10T00:00:00.000Z',
    lastUpdated: new Date().toISOString(),
    createdBy: 'demo-admin-001',
    externalLinks: {
      githubRepo: 'https://github.com/demo/ecommerce-redesign',
      figmaLink: 'https://figma.com/file/demo-ecommerce',
      jiraProject: 'ECOMM'
    }
  },
  {
    id: 1002,
    name: 'Mobile Banking App',
    status: 'Ongoing',
    progress: 25,
    assignedTo: 'demo-ba-001',
    startDate: '2024-03-01T00:00:00.000Z',
    endDate: '2024-12-31T00:00:00.000Z',
    remarks: 'New mobile banking application for iOS and Android',
    notes: 'Must comply with banking regulations and security standards',
    priority: 'Critical',
    category: 'Mobile Development',
    team: ['demo-dev-001', 'demo-dev-002', 'demo-designer-001'],
    company: 'SecureBank Ltd.',
    statusPhase: 'Requirements Gathering',
    deadline: '2024-12-31T00:00:00.000Z',
    comments: 'Currently gathering security requirements from compliance team',
    developers: ['demo-dev-001', 'demo-dev-002'],
    blockers: 'Waiting for security audit approval',
    responsiblePerson: 'Emily Rodriguez',
    initiallyRaisedOn: '2024-02-15T00:00:00.000Z',
    pendingDays: 15,
    feedbackForBlockers: 'Security team review in progress',
    createdAt: '2024-02-15T00:00:00.000Z',
    lastUpdated: new Date().toISOString(),
    createdBy: 'demo-admin-001',
    externalLinks: {
      githubRepo: 'https://github.com/demo/mobile-banking',
      figmaLink: 'https://figma.com/file/demo-banking',
      jiraProject: 'BANK'
    }
  },
  {
    id: 1003,
    name: 'API Gateway Implementation',
    status: 'Completed',
    progress: 100,
    assignedTo: 'demo-dev-001',
    startDate: '2023-11-01T00:00:00.000Z',
    endDate: '2024-02-28T00:00:00.000Z',
    remarks: 'Implemented centralized API gateway for microservices',
    notes: 'Successfully deployed and monitoring is in place',
    priority: 'Medium',
    category: 'Backend Development',
    team: ['demo-dev-001', 'demo-dev-002'],
    company: 'TechCorp Inc.',
    statusPhase: 'Deployed',
    deadline: '2024-02-28T00:00:00.000Z',
    comments: 'Project completed successfully with all requirements met',
    developers: ['demo-dev-001', 'demo-dev-002'],
    blockers: 'None',
    responsiblePerson: 'Alex Thompson',
    initiallyRaisedOn: '2023-10-15T00:00:00.000Z',
    pendingDays: 0,
    feedbackForBlockers: 'N/A',
    createdAt: '2023-10-15T00:00:00.000Z',
    lastUpdated: '2024-02-28T00:00:00.000Z',
    createdBy: 'demo-admin-001',
    externalLinks: {
      githubRepo: 'https://github.com/demo/api-gateway',
      jiraProject: 'API'
    }
  },
  {
    id: 1004,
    name: 'Customer Portal Enhancement',
    status: 'On Hold',
    progress: 40,
    assignedTo: 'demo-manager-001',
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-05-31T00:00:00.000Z',
    remarks: 'Enhance existing customer portal with new features',
    notes: 'Project paused due to budget constraints',
    priority: 'Low',
    category: 'Web Development',
    team: ['demo-dev-001', 'demo-designer-001'],
    company: 'ServiceCorp',
    statusPhase: 'Development',
    deadline: '2024-05-31T00:00:00.000Z',
    comments: 'Project temporarily on hold pending budget approval',
    developers: ['demo-dev-001'],
    blockers: 'Budget approval required',
    responsiblePerson: 'Michael Chen',
    initiallyRaisedOn: '2024-01-20T00:00:00.000Z',
    pendingDays: 30,
    feedbackForBlockers: 'Finance team reviewing budget request',
    createdAt: '2024-01-20T00:00:00.000Z',
    lastUpdated: new Date().toISOString(),
    createdBy: 'demo-admin-001',
    externalLinks: {
      githubRepo: 'https://github.com/demo/customer-portal',
      figmaLink: 'https://figma.com/file/demo-portal',
      jiraProject: 'PORTAL'
    }
  },
  {
    id: 1005,
    name: 'Data Analytics Dashboard',
    status: 'Ongoing',
    progress: 80,
    assignedTo: 'demo-dev-002',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-04-30T00:00:00.000Z',
    remarks: 'Real-time analytics dashboard for business intelligence',
    notes: 'Using React and D3.js for data visualization',
    priority: 'High',
    category: 'Data Science',
    team: ['demo-dev-002', 'demo-ba-001'],
    company: 'AnalyticsCorp',
    statusPhase: 'Testing',
    deadline: '2024-04-30T00:00:00.000Z',
    comments: 'Final testing phase, preparing for deployment',
    developers: ['demo-dev-002'],
    blockers: 'Performance optimization needed for large datasets',
    responsiblePerson: 'Priya Patel',
    initiallyRaisedOn: '2023-12-15T00:00:00.000Z',
    pendingDays: 20,
    feedbackForBlockers: 'Working on query optimization',
    createdAt: '2023-12-15T00:00:00.000Z',
    lastUpdated: new Date().toISOString(),
    createdBy: 'demo-admin-001',
    externalLinks: {
      githubRepo: 'https://github.com/demo/analytics-dashboard',
      jiraProject: 'ANALYTICS'
    }
  }
];

// Demo Project Updates
export const DEMO_PROJECT_UPDATES: Record<number, ProjectUpdate[]> = {
  1001: [
    {
      id: 'update-1001-001',
      content: 'Completed user authentication module and started working on product catalog component',
      date: '2024-03-15T10:30:00.000Z',
      author: 'Alex Thompson',
      type: 'regular',
      userId: 'demo-dev-001'
    },
    {
      id: 'update-1001-002',
      content: 'Design system components finalized and ready for development team',
      date: '2024-03-14T14:20:00.000Z',
      author: 'David Kim',
      type: 'regular',
      userId: 'demo-designer-001'
    },
    {
      id: 'update-1001-003',
      content: 'Daily standup: Frontend team making good progress, backend API integration starting next week',
      date: '2024-03-13T09:00:00.000Z',
      author: 'Michael Chen',
      type: 'daily',
      userId: 'demo-manager-001'
    }
  ],
  1002: [
    {
      id: 'update-1002-001',
      content: 'Completed initial requirements gathering session with stakeholders',
      date: '2024-03-10T16:45:00.000Z',
      author: 'Emily Rodriguez',
      type: 'regular',
      userId: 'demo-ba-001'
    },
    {
      id: 'update-1002-002',
      content: 'Security requirements document submitted for review',
      date: '2024-03-08T11:15:00.000Z',
      author: 'Emily Rodriguez',
      type: 'regular',
      userId: 'demo-ba-001'
    }
  ],
  1003: [
    {
      id: 'update-1003-001',
      content: 'API Gateway successfully deployed to production environment',
      date: '2024-02-28T15:30:00.000Z',
      author: 'Alex Thompson',
      type: 'regular',
      userId: 'demo-dev-001'
    },
    {
      id: 'update-1003-002',
      content: 'Final testing completed, all endpoints working correctly',
      date: '2024-02-27T13:20:00.000Z',
      author: 'Priya Patel',
      type: 'regular',
      userId: 'demo-dev-002'
    }
  ]
};

// Demo Project Files
export const DEMO_PROJECT_FILES: Record<number, ProjectFile[]> = {
  1001: [
    {
      name: 'Technical_Specification.pdf',
      size: '2.5 MB',
      uploadedOn: '2024-01-20T10:00:00.000Z',
      uploadedBy: 'Michael Chen'
    },
    {
      name: 'UI_Design_Mockups.figma',
      size: '15.2 MB',
      uploadedOn: '2024-01-25T14:30:00.000Z',
      uploadedBy: 'David Kim'
    },
    {
      name: 'API_Documentation.md',
      size: '45 KB',
      uploadedOn: '2024-02-01T09:15:00.000Z',
      uploadedBy: 'Alex Thompson'
    }
  ],
  1002: [
    {
      name: 'Requirements_Document.pdf',
      size: '3.1 MB',
      uploadedOn: '2024-02-20T11:00:00.000Z',
      uploadedBy: 'Emily Rodriguez'
    },
    {
      name: 'Security_Requirements.docx',
      size: '1.8 MB',
      uploadedOn: '2024-03-05T16:45:00.000Z',
      uploadedBy: 'Emily Rodriguez'
    }
  ],
  1003: [
    {
      name: 'Architecture_Diagram.drawio',
      size: '2.1 MB',
      uploadedOn: '2023-11-10T13:20:00.000Z',
      uploadedBy: 'Alex Thompson'
    },
    {
      name: 'Deployment_Guide.md',
      size: '28 KB',
      uploadedOn: '2024-02-25T10:30:00.000Z',
      uploadedBy: 'Priya Patel'
    }
  ]
};

// Demo Jira Projects
export const DEMO_JIRA_PROJECTS = [
  {
    id: '10001',
    key: 'ECOMM',
    name: 'E-Commerce Platform',
    projectTypeKey: 'software',
    style: 'classic',
    isPrivate: false
  },
  {
    id: '10002',
    key: 'BANK',
    name: 'Mobile Banking App',
    projectTypeKey: 'software',
    style: 'classic',
    isPrivate: false
  },
  {
    id: '10003',
    key: 'API',
    name: 'API Gateway',
    projectTypeKey: 'software',
    style: 'classic',
    isPrivate: false
  },
  {
    id: '10004',
    key: 'PORTAL',
    name: 'Customer Portal',
    projectTypeKey: 'software',
    style: 'classic',
    isPrivate: false
  },
  {
    id: '10005',
    key: 'ANALYTICS',
    name: 'Data Analytics',
    projectTypeKey: 'software',
    style: 'classic',
    isPrivate: false
  }
];

// Demo Jira Issues
export const DEMO_JIRA_ISSUES = {
  ECOMM: [
    {
      id: '10001',
      key: 'ECOMM-101',
      summary: 'Implement user authentication system',
      description: 'Create secure user authentication with JWT tokens and role-based access control',
      status: { name: 'In Progress', category: 'To Do' },
      priority: 'High',
      assignee: {
        accountId: 'demo-dev-001',
        displayName: 'Alex Thompson',
        emailAddress: 'alex.thompson@demo.com'
      },
      reporter: {
        accountId: 'demo-manager-001',
        displayName: 'Michael Chen',
        emailAddress: 'michael.chen@demo.com'
      },
      created: '2024-01-15T09:00:00.000Z',
      updated: '2024-03-15T14:30:00.000Z',
      duedate: '2024-03-30T00:00:00.000Z',
      issueType: 'Story'
    },
    {
      id: '10002',
      key: 'ECOMM-102',
      summary: 'Design product catalog component',
      description: 'Create responsive product catalog with filtering and search functionality',
      status: { name: 'To Do', category: 'To Do' },
      priority: 'Medium',
      assignee: {
        accountId: 'demo-dev-001',
        displayName: 'Alex Thompson',
        emailAddress: 'alex.thompson@demo.com'
      },
      reporter: {
        accountId: 'demo-designer-001',
        displayName: 'David Kim',
        emailAddress: 'david.kim@demo.com'
      },
      created: '2024-01-20T10:00:00.000Z',
      updated: '2024-01-20T10:00:00.000Z',
      duedate: '2024-04-15T00:00:00.000Z',
      issueType: 'Story'
    },
    {
      id: '10003',
      key: 'ECOMM-103',
      summary: 'Payment gateway integration bug',
      description: 'Users experiencing timeout errors during checkout process',
      status: { name: 'In Review', category: 'In Progress' },
      priority: 'Critical',
      assignee: {
        accountId: 'demo-dev-002',
        displayName: 'Priya Patel',
        emailAddress: 'priya.patel@demo.com'
      },
      reporter: {
        accountId: 'demo-manager-001',
        displayName: 'Michael Chen',
        emailAddress: 'michael.chen@demo.com'
      },
      created: '2024-03-10T15:30:00.000Z',
      updated: '2024-03-14T11:20:00.000Z',
      duedate: '2024-03-20T00:00:00.000Z',
      issueType: 'Bug'
    }
  ],
  BANK: [
    {
      id: '10004',
      key: 'BANK-101',
      summary: 'Gather security requirements',
      description: 'Document all security requirements for mobile banking app compliance',
      status: { name: 'In Progress', category: 'In Progress' },
      priority: 'High',
      assignee: {
        accountId: 'demo-ba-001',
        displayName: 'Emily Rodriguez',
        emailAddress: 'emily.rodriguez@demo.com'
      },
      reporter: {
        accountId: 'demo-admin-001',
        displayName: 'Sarah Johnson',
        emailAddress: 'sarah.johnson@demo.com'
      },
      created: '2024-02-15T08:00:00.000Z',
      updated: '2024-03-10T16:45:00.000Z',
      duedate: '2024-03-31T00:00:00.000Z',
      issueType: 'Epic'
    },
    {
      id: '10005',
      key: 'BANK-102',
      summary: 'Security audit approval',
      description: 'Obtain security audit approval from compliance team',
      status: { name: 'Blocked', category: 'To Do' },
      priority: 'Critical',
      assignee: null,
      reporter: {
        accountId: 'demo-ba-001',
        displayName: 'Emily Rodriguez',
        emailAddress: 'emily.rodriguez@demo.com'
      },
      created: '2024-03-05T14:00:00.000Z',
      updated: '2024-03-08T11:15:00.000Z',
      duedate: '2024-03-25T00:00:00.000Z',
      issueType: 'Task'
    }
  ],
  API: [
    {
      id: '10006',
      key: 'API-101',
      summary: 'Deploy API Gateway to production',
      description: 'Deploy the completed API Gateway to production environment',
      status: { name: 'Done', category: 'Done' },
      priority: 'High',
      assignee: {
        accountId: 'demo-dev-001',
        displayName: 'Alex Thompson',
        emailAddress: 'alex.thompson@demo.com'
      },
      reporter: {
        accountId: 'demo-manager-001',
        displayName: 'Michael Chen',
        emailAddress: 'michael.chen@demo.com'
      },
      created: '2024-02-20T09:00:00.000Z',
      updated: '2024-02-28T15:30:00.000Z',
      duedate: '2024-02-28T00:00:00.000Z',
      issueType: 'Story'
    }
  ]
};

// Utility functions for demo data
export function getDemoUserByEmail(email: string): User | undefined {
  return DEMO_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function getDemoUserById(id: string): User | undefined {
  return DEMO_USERS.find(user => user.id === id);
}

export function getDemoProjectById(id: number): Project | undefined {
  return DEMO_PROJECTS.find(project => project.id === Number(id) || project.id.toString() === id);
}

export function getDemoJiraProjectByKey(key: string): any | undefined {
  return DEMO_JIRA_PROJECTS.find(project => project.key === key);
}

export function getDemoJiraIssuesByProject(projectKey: string): any[] {
  return DEMO_JIRA_ISSUES[projectKey] || [];
}
