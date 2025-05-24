// JIRA Integration Types
export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  enabled: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  properties: Record<string, any>;
  entityId: string;
  uuid: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      id: string;
      name: string;
      statusCategory: {
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority: {
      id: string;
      name: string;
      iconUrl: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    reporter: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    project: {
      id: string;
      key: string;
      name: string;
    };
    issuetype: {
      id: string;
      name: string;
      iconUrl: string;
    };
  };
}

export interface JiraCreateIssueRequest {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      accountId: string;
    };
    duedate?: string;
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
    statusCategory: {
      id: number;
      key: string;
      colorName: string;
      name: string;
    };
  };
}

export interface JiraSearchResult {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraUser {
  accountId: string;
  accountType: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
  locale: string;
}

// Webhook Types
export interface JiraWebhookEvent {
  timestamp: number;
  webhookEvent: string;
  issue?: JiraIssue;
  user: JiraUser;
  changelog?: {
    id: string;
    items: Array<{
      field: string;
      fieldtype: string;
      from: string;
      fromString: string;
      to: string;
      toString: string;
    }>;
  };
}

export interface JiraWebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  filters?: {
    issueRelatedEventsSection?: string;
  };
  excludeBody?: boolean;
}

// Bi-directional Sync Types
export interface SyncConflict {
  field: string;
  jiraValue: any;
  projectValue: any;
  resolvedValue?: any;
  resolution?: 'jira' | 'project' | 'manual';
}

export interface SyncResult {
  success: boolean;
  conflictsDetected: SyncConflict[];
  conflictsResolved: SyncConflict[];
  updatedFields: string[];
  message: string;
}

export interface BiDirectionalSyncConfig {
  enabled: boolean;
  conflictResolution: 'jira_wins' | 'project_wins' | 'manual' | 'newest_wins';
  syncFields: {
    summary: boolean;
    description: boolean;
    status: boolean;
    priority: boolean;
    assignee: boolean;
    dueDate: boolean;
    progress: boolean;
  };
  lastSyncTimestamp?: string;
}

// Reporting Types
export interface JiraReportMetrics {
  totalIssues: number;
  issuesByStatus: Record<string, number>;
  issuesByPriority: Record<string, number>;
  issuesByType: Record<string, number>;
  averageResolutionTime: number;
  velocity: {
    current: number;
    trend: number;
  };
  burndown: Array<{
    date: string;
    remaining: number;
    completed: number;
  }>;
}

export interface ProjectJiraMetrics {
  projectId: string;
  projectName: string;
  jiraProjectKey: string;
  metrics: JiraReportMetrics;
  lastUpdated: string;
}