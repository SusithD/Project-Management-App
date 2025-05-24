import { defineEventHandler, getQuery, createError } from 'h3'
import { getJiraClient } from '~/server/utils/jira'
import type { Project } from '~/server/models/project'
import type { JiraIssue, JiraSearchResult } from '~/types/jira'

// Extended Project interface with JIRA integration
interface ProjectWithJira extends Project {
  jiraIntegration?: {
    enabled: boolean
    projectKey: string
    lastSyncDate?: string
  }
}

interface TaskStats {
  [key: string]: number
}

interface UserTaskData {
  projectId: string
  projectName: string
  projectKey: string | null
  isJiraIntegrated: boolean
  tasks: any[]
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId || query.userEmail
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID or email is required'
      })
    }

    // For now, we'll use mock projects since the Project model doesn't have JIRA integration yet
    // In a real implementation, you would fetch from database with JIRA integration fields
    const mockProjects: ProjectWithJira[] = [
      {
        id: 1,
        name: 'E-commerce Platform',
        status: 'In Progress',
        progress: 75,
        assignedTo: userId as string,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        priority: 'High',
        category: 'Web Development',
        responsiblePerson: userId as string,
        createdAt: '2024-01-01',
        lastUpdated: '2024-05-20',
        createdBy: 'admin@company.com',
        jiraIntegration: {
          enabled: true,
          projectKey: 'ECOM'
        }
      },
      {
        id: 2,
        name: 'Mobile App Development',
        status: 'Planning',
        progress: 25,
        assignedTo: userId as string,
        startDate: '2024-03-01',
        endDate: '2024-09-30',
        priority: 'Medium',
        category: 'Mobile Development',
        developers: [userId as string],
        createdAt: '2024-02-15',
        lastUpdated: '2024-05-15',
        createdBy: 'admin@company.com',
        jiraIntegration: {
          enabled: true,
          projectKey: 'MOBILE'
        }
      }
    ]

    const projectTasks: UserTaskData[] = []

    // Process each project and fetch JIRA issues if integrated
    for (const project of mockProjects) {
      const projectData: UserTaskData = {
        projectId: project.id.toString(),
        projectName: project.name,
        projectKey: project.jiraIntegration?.projectKey || null,
        isJiraIntegrated: project.jiraIntegration?.enabled || false,
        tasks: []
      }

      // If project has JIRA integration, fetch issues from JIRA
      if (project.jiraIntegration?.enabled && project.jiraIntegration?.projectKey) {
        try {
          const jiraClient = getJiraClient()
          
          // Build JQL to get issues assigned to the user
          const jql = `project = "${project.jiraIntegration.projectKey}" AND assignee = "${userId}" ORDER BY created DESC`
          
          const jiraResponse: JiraSearchResult = await jiraClient.searchIssues(jql, 0, 100)

          // Transform JIRA issues to our task format
          const jiraTasks = jiraResponse.issues?.map((issue: JiraIssue) => ({
            id: issue.key,
            issueKey: issue.key,
            title: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status.name,
            statusCategory: issue.fields.status.statusCategory?.name || 'To Do',
            priority: issue.fields.priority?.name || 'Medium',
            assignee: {
              id: issue.fields.assignee?.accountId,
              name: issue.fields.assignee?.displayName,
              email: issue.fields.assignee?.emailAddress
            },
            issueType: issue.fields.issuetype?.name,
            created: issue.fields.created,
            updated: issue.fields.updated,
            dueDate: issue.fields.duedate,
            components: (issue.fields as any).components?.map((c: any) => c.name) || [],
            labels: (issue.fields as any).labels || [],
            timeEstimate: (issue.fields as any).timeoriginalestimate,
            timeRemaining: (issue.fields as any).timeestimate,
            timeSpent: (issue.fields as any).timespent,
            source: 'jira',
            jiraUrl: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`
          })) || []

          projectData.tasks = jiraTasks
        } catch (jiraError: any) {
          console.error(`Error fetching JIRA issues for project ${project.name}:`, jiraError)
          // Continue with other projects even if one fails
        }
      }

      // Add some mock tasks if JIRA is not available or no issues found
      if (projectData.tasks.length === 0) {
        projectData.tasks = [
          {
            id: `${project.id}-task-1`,
            issueKey: null,
            title: `Sample Task for ${project.name}`,
            description: `This is a sample task for the project ${project.name}`,
            status: 'In Progress',
            statusCategory: 'In Progress',
            priority: 'Medium',
            assignee: {
              id: 'current-user',
              name: 'Current User',
              email: userId
            },
            issueType: 'Task',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            components: [],
            labels: [],
            source: 'internal',
            jiraUrl: null
          }
        ]
      }

      projectTasks.push(projectData)
    }

    // Calculate summary statistics
    const allTasks = projectTasks.flatMap(p => p.tasks)
    const tasksByStatus: TaskStats = allTasks.reduce((acc: TaskStats, task: any) => {
      const status = task.statusCategory || task.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const tasksByPriority: TaskStats = allTasks.reduce((acc: TaskStats, task: any) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {})

    const overdueTasks = allTasks.filter((task: any) => {
      if (!task.dueDate || ['Done', 'Completed', 'Closed'].includes(task.status)) return false
      return new Date(task.dueDate) < new Date()
    }).length

    const completedTasks = allTasks.filter((task: any) => 
      ['Done', 'Completed', 'Closed'].includes(task.status)
    ).length

    const inProgressTasks = allTasks.filter((task: any) => 
      ['In Progress', 'In Review', 'In Development'].includes(task.status)
    ).length

    const stats = {
      totalTasks: allTasks.length,
      totalProjects: projectTasks.length,
      jiraIntegratedProjects: projectTasks.filter(p => p.isJiraIntegrated).length,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      completedTasks,
      inProgressTasks
    }

    return {
      success: true,
      data: {
        projects: projectTasks,
        stats,
        user: userId
      }
    }

  } catch (error: any) {
    console.error('Error fetching user tasks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch user tasks'
    })
  }
})