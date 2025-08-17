import { defineEventHandler, readBody } from "h3";
import { getJiraClient } from "~/server/utils/jira";
import { connectToDatabase } from "~/server/utils/database";
import { COLLECTIONS } from "~/server/utils/schemas";
import { ObjectId } from "mongodb";
import { isDemoMode, isDemoUserEmail } from "~/server/utils/demo-mode";
import { getDemoJiraProjectUrl } from "~/server/utils/demo-data";
import { DEMO_JIRA_PROJECTS } from "~/server/utils/demo-data";

/**
 * Link a project to a JIRA project
 *
 * @route POST /api/jira/link-project
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { projectId, jiraProjectKey, syncEnabled = true, userEmail } = body;

    // Check if demo mode is enabled
    const demoMode = isDemoMode();
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);

    if (!projectId || !jiraProjectKey) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: "Project ID and JIRA project key are required",
        },
      };
    }

    if (demoMode && isDemoUser) {
      console.log(
        `[JIRA API] Demo mode: Linking project ${projectId} to JIRA project ${jiraProjectKey}`,
      );

      // Find demo JIRA project
      const demoJiraProject = DEMO_JIRA_PROJECTS.find(
        (p) => p.key === jiraProjectKey,
      );

      if (!demoJiraProject) {
        return {
          statusCode: 404,
          body: {
            success: false,
            message: `Demo JIRA project ${jiraProjectKey} not found`,
          },
        };
      }

      // Get project data and update with demo JIRA integration
      const { db } = await connectToDatabase();
      const projectsCollection = db.collection(COLLECTIONS.PROJECTS);

      const queryFilter: any = {
        $or: [{ id: parseInt(projectId) }],
      };

      if (typeof projectId === "string" && ObjectId.isValid(projectId)) {
        queryFilter.$or.push({ _id: new ObjectId(projectId) });
      }

      const project = await projectsCollection.findOne(queryFilter);

      if (!project) {
        return {
          statusCode: 404,
          body: {
            success: false,
            message: "Project not found",
          },
        };
      }

      // Update project with demo JIRA integration
      const jiraIntegration = {
        enabled: true,
        projectKey: demoJiraProject.key,
        projectName: demoJiraProject.name,
        projectId: demoJiraProject.id,
        syncEnabled,
        lastSyncDate: new Date().toISOString(),
        bidirectionalSync: {
          enabled: syncEnabled,
          conflictResolution: "newest_wins",
          syncFields: {
            summary: true,
            description: true,
            status: true,
            priority: true,
            assignee: false,
            dueDate: true,
            progress: true,
          },
        },
        syncStats: {
          totalSyncs: 0,
          lastSyncDuration: 0,
          conflictsResolved: 0,
        },
      };

      await projectsCollection.updateOne(
        { _id: project._id },
        {
          $set: {
            jiraIntegration,
            lastUpdated: new Date().toISOString(),
          },
        },
      );

      return {
        statusCode: 200,
        body: {
          success: true,
          message: `Project successfully linked to demo JIRA project ${demoJiraProject.name}`,
          jiraProject: demoJiraProject,
          projectUrl: getDemoJiraProjectUrl(demoJiraProject.key),
          integration: jiraIntegration,
          demoMode: true,
        },
      };
    }

    console.log(
      `[JIRA API] Linking project ${projectId} to JIRA project ${jiraProjectKey}`,
    );

    // Get JIRA client and verify the JIRA project exists
    const jiraClient = getJiraClient();
    const jiraProject = await jiraClient.getProject(jiraProjectKey);

    // Connect to database and update the project
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS);

    // Build query filter with proper type handling
    const queryFilter: any = {
      $or: [{ id: parseInt(projectId) }],
    };

    // Only add ObjectId filter if projectId is a valid ObjectId string
    if (typeof projectId === "string" && ObjectId.isValid(projectId)) {
      queryFilter.$or.push({ _id: new ObjectId(projectId) });
    }

    // Find the project
    const project = await projectsCollection.findOne(queryFilter);

    if (!project) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: "Project not found",
        },
      };
    }

    // Update project with JIRA integration
    const updateData = {
      "jiraIntegration.enabled": true,
      "jiraIntegration.projectKey": jiraProject.key,
      "jiraIntegration.projectId": jiraProject.id,
      "jiraIntegration.projectName": jiraProject.name,
      "jiraIntegration.syncEnabled": syncEnabled,
      "jiraIntegration.lastSyncDate": new Date().toISOString(),
      "externalLinks.jiraProject": `${useRuntimeConfig().jira.baseUrl}/browse/${jiraProject.key}`,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    const result = await projectsCollection.updateOne(
      { _id: project._id },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: "Failed to update project",
        },
      };
    }

    console.log(
      `[JIRA API] Successfully linked project ${project.name} to JIRA project ${jiraProject.name}`,
    );

    return {
      statusCode: 200,
      body: {
        success: true,
        message: `Project "${project.name}" successfully linked to JIRA project "${jiraProject.name}"`,
        jiraIntegration: {
          enabled: true,
          projectKey: jiraProject.key,
          projectId: jiraProject.id,
          projectName: jiraProject.name,
          syncEnabled,
          lastSyncDate: updateData["jiraIntegration.lastSyncDate"],
        },
      },
    };
  } catch (error) {
    console.error("[JIRA API] Error linking project to JIRA:", error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to link project to JIRA",
      },
    };
  }
});
