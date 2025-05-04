// MongoDB schemas and collection definitions
import { ObjectId, Int32 } from 'mongodb';

// Collection names
export const COLLECTIONS = {
  PROJECTS: 'projects',
  USERS: 'users',
  FILES: 'files'
};

// Project update interface
export interface ProjectUpdate {
  id: string;
  message: string;
  date: string;
  user: string;
}

// Project interface
export interface Project {
  id: number | Int32;
  name: string;
  status: string;
  progress: number | Int32;
  assignedTo: string;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  createdAt: string;
  remarks?: string;
  notes?: string;
  priority: string;
  category: string;
  team: string[];
  updates?: ProjectUpdate[];
  _id?: ObjectId;
  
  // New fields
  company?: string;
  statusPhase?: string;
  deadline?: string;
  comments?: string;
  developers?: string[];
  blockers?: string;
  responsiblePerson?: string;
  initiallyRaisedOn?: string;
  pendingDays?: number | Int32;
  feedbackForBlockers?: string;
}

// User interface
export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

// File interface
export interface FileAttachment {
  _id?: ObjectId;
  projectId: string | number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

// MongoDB validation schemas
export const projectValidationSchema = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'status', 'assignedTo', 'startDate', 'endDate', 'priority', 'category'],
      properties: {
        id: {
          bsonType: 'int',
          description: 'must be an integer and is required'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        status: {
          bsonType: 'string',
          enum: ['Ongoing', 'Completed', 'On Hold'],
          description: 'must be one of the enum values and is required'
        },
        progress: {
          bsonType: 'int',
          minimum: 0,
          maximum: 100,
          description: 'must be an integer between 0 and 100'
        },
        assignedTo: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        startDate: {
          bsonType: 'string',
          description: 'must be a date string and is required'
        },
        endDate: {
          bsonType: 'string',
          description: 'must be a date string and is required'
        },
        lastUpdated: {
          bsonType: 'string',
          description: 'must be a date string'
        },
        createdAt: {
          bsonType: 'string',
          description: 'must be a date string'
        },
        remarks: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        notes: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        priority: {
          bsonType: 'string',
          enum: ['Low', 'Medium', 'High', 'Urgent'],
          description: 'must be one of the enum values and is required'
        },
        category: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        team: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings'
        },
        // New fields
        company: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        statusPhase: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        deadline: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        comments: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        developers: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings if present'
        },
        blockers: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        responsiblePerson: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        initiallyRaisedOn: {
          bsonType: 'string',
          description: 'must be a date string if present'
        },
        pendingDays: {
          bsonType: 'int',
          description: 'must be an integer if present'
        },
        feedbackForBlockers: {
          bsonType: 'string',
          description: 'must be a string if present'
        },
        updates: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['id', 'message', 'date', 'user'],
            properties: {
              id: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              message: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              date: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              user: {
                bsonType: 'string',
                description: 'must be a string and is required'
              }
            }
          }
        }
      }
    }
  }
};