export interface Project {
  _id?: any;
  id: number;
  name: string;
  status: string;
  progress: number;
  assignedTo: string;
  startDate: string;
  endDate: string;
  remarks?: string;
  notes?: string;
  priority: string;
  category: string;
  team?: string[];
  company?: string;
  statusPhase?: string;
  deadline?: string;
  comments?: string;
  developers?: string[];
  blockers?: string;
  responsiblePerson?: string;
  initiallyRaisedOn?: string;
  pendingDays?: number;
  feedbackForBlockers?: string;
  createdAt: string;
  lastUpdated: string;
  createdBy: string;
  updates?: ProjectUpdate[];
  files?: ProjectFile[];
  externalLinks?: {
    githubRepo?: string;
    figmaLink?: string;
    jiraProject?: string;
  };
}

export interface ProjectUpdate {
  id: string;
  content: string;
  date: string;
  author: string;
}

export interface ProjectFile {
  name: string;
  size: string;
  uploadedOn: string;
  uploadedBy: string;
}
