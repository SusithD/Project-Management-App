import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { 
  JiraConfig, 
  JiraProject, 
  JiraIssue, 
  JiraCreateIssueRequest, 
  JiraTransition, 
  JiraSearchResult,
  JiraUser,
  JiraWebhookConfig 
} from '~/types/jira';

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    
    if (!config.enabled) {
      throw new Error('JIRA integration is disabled');
    }

    if (!config.baseUrl || !config.email || !config.apiToken) {
      throw new Error('JIRA configuration is incomplete. Please check your environment variables.');
    }

    // Create axios instance with JIRA configuration
    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Add request/response interceptors for logging and error handling
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[JIRA Client] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[JIRA Client] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[JIRA Client] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[JIRA Client] Response error:', error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): Error {
    if (error.response) {
      // JIRA API error response
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return new Error('JIRA authentication failed. Please check your credentials.');
        case 403:
          return new Error('JIRA access forbidden. Please check your permissions.');
        case 404:
          return new Error('JIRA resource not found.');
        case 429:
          return new Error('JIRA rate limit exceeded. Please try again later.');
        default:
          return new Error(`JIRA API error: ${data?.errorMessages?.join(', ') || error.message}`);
      }
    } else if (error.request) {
      return new Error('Unable to connect to JIRA. Please check your network connection.');
    } else {
      return new Error(`JIRA client error: ${error.message}`);
    }
  }

  // Test JIRA connection
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/myself');
      return true;
    } catch (error) {
      console.error('[JIRA Client] Connection test failed:', error);
      return false;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<JiraUser> {
    const response = await this.client.get('/myself');
    return response.data;
  }

  // Get all projects
  async getProjects(): Promise<JiraProject[]> {
    const response = await this.client.get('/project');
    return response.data;
  }

  // Get specific project by key
  async getProject(projectKey: string): Promise<JiraProject> {
    const response = await this.client.get(`/project/${projectKey}`);
    return response.data;
  }

  // Search for issues using JQL
  async searchIssues(jql: string, startAt: number = 0, maxResults: number = 50): Promise<JiraSearchResult> {
    const response = await this.client.post('/search', {
      jql,
      startAt,
      maxResults,
      fields: [
        'summary',
        'description',
        'status',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'duedate',
        'project',
        'issuetype'
      ]
    });
    return response.data;
  }

  // Get issues for a specific project
  async getProjectIssues(projectKey: string, maxResults: number = 100): Promise<JiraIssue[]> {
    const jql = `project = "${projectKey}" ORDER BY created DESC`;
    const result = await this.searchIssues(jql, 0, maxResults);
    return result.issues;
  }

  // Get specific issue by key
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const response = await this.client.get(`/issue/${issueKey}`);
    return response.data;
  }

  // Create new issue
  async createIssue(issueData: JiraCreateIssueRequest): Promise<JiraIssue> {
    const response = await this.client.post('/issue', issueData);
    
    // Get the full issue data after creation
    const issueKey = response.data.key;
    return await this.getIssue(issueKey);
  }

  // Update issue
  async updateIssue(issueKey: string, fields: Partial<JiraCreateIssueRequest['fields']>): Promise<void> {
    await this.client.put(`/issue/${issueKey}`, {
      fields
    });
  }

  // Get available transitions for an issue
  async getIssueTransitions(issueKey: string): Promise<JiraTransition[]> {
    const response = await this.client.get(`/issue/${issueKey}/transitions`);
    return response.data.transitions;
  }

  // Transition issue status
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    await this.client.post(`/issue/${issueKey}/transitions`, {
      transition: {
        id: transitionId
      }
    });
  }

  // Add comment to issue
  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.client.post(`/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment
              }
            ]
          }
        ]
      }
    });
  }

  // Get issue types for a project
  async getProjectIssueTypes(projectKey: string): Promise<any[]> {
    const response = await this.client.get(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`);
    return response.data.projects[0]?.issuetypes || [];
  }

  // Search users
  async searchUsers(query: string): Promise<JiraUser[]> {
    const response = await this.client.get(`/user/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Get user by account ID
  async getUser(accountId: string): Promise<JiraUser> {
    const response = await this.client.get(`/user?accountId=${accountId}`);
    return response.data;
  }

  // Webhook Management
  async createWebhook(webhookConfig: Omit<JiraWebhookConfig, 'id'>): Promise<JiraWebhookConfig> {
    const response = await this.client.post('/webhook', webhookConfig);
    return response.data;
  }

  async getWebhooks(): Promise<JiraWebhookConfig[]> {
    const response = await this.client.get('/webhook');
    return response.data;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/webhook/${webhookId}`);
  }

  // Bi-directional Sync Methods
  async getIssueHistory(issueKey: string): Promise<any> {
    const response = await this.client.get(`/issue/${issueKey}?expand=changelog`);
    return response.data.changelog;
  }

  async getIssueLastUpdated(issueKey: string): Promise<string> {
    const issue = await this.getIssue(issueKey);
    return issue.fields.updated;
  }

  // Advanced Search with custom fields
  async searchIssuesAdvanced(jql: string, fields: string[] = [], expand: string[] = []): Promise<JiraSearchResult> {
    const response = await this.client.post('/search', {
      jql,
      fields: fields.length > 0 ? fields : [
        'summary',
        'description', 
        'status',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'duedate',
        'project',
        'issuetype'
      ],
      expand: expand.join(','),
      maxResults: 1000
    });
    return response.data;
  }

  // Bulk update issues
  async bulkUpdateIssues(issueUpdates: Array<{issueKey: string, fields: any}>): Promise<any> {
    const response = await this.client.post('/issue/bulk', {
      issueUpdates: issueUpdates.map(update => ({
        key: update.issueKey,
        fields: update.fields
      }))
    });
    return response.data;
  }
}