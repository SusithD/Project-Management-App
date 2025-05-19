<script setup>
import { ref, computed, onMounted, watch, watchEffect } from 'vue';
import { useProjectsStore } from '~/stores/projects';
import { useNotificationsStore } from '~/stores/notifications';
import { useUsersStore } from '~/stores/users';
import NewProjectModal from '~/components/projects/NewProjectModal.vue';
// Import the necessary libraries for export
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Get projects from store
const projectsStore = useProjectsStore();
const notificationsStore = useNotificationsStore();
const usersStore = useUsersStore();
const isNewProjectModalOpen = ref(false);
const isLoading = ref(true);
const isExporting = ref(false);

// View mode and UI enhancements
const viewMode = ref('table'); // 'table' or 'cards'
const showStats = ref(true);
const expandedRows = ref(new Set());
const sortBy = ref('name');
const sortDirection = ref('asc');
const priorityFilter = ref('all');
const categoryFilter = ref('all');
const dateRangeFilter = ref({
  start: null,
  end: null
});
const expandedFilters = ref(false);
const hoveredProjectId = ref(null);

// Fetch projects on component mount
onMounted(async () => {
  try {
    isLoading.value = true;
    // Fetch users data to get display names
    await usersStore.fetchUsers();
    await projectsStore.fetchProjects();
  } finally {
    isLoading.value = false;
  }
});

// Helper function to get user name from ID
const getUserName = (userId) => {
  if (!userId) return 'Not assigned';
  
  const user = usersStore.users.find(user => user.id === userId);
  return user ? user.name : userId; // Return name if found, otherwise return ID as fallback
};

// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
const assigneeFilter = ref('all');

// Get unique assignees for filter dropdown
const uniqueAssignees = computed(() => {
  const assigneeIds = [...new Set(projectsStore.projects.map(p => p.assignedTo))];
  
  // Map the IDs to objects with id and display name
  return assigneeIds
    .map(id => ({
      id,
      name: getUserName(id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Get unique categories and priorities for filter dropdowns
const uniqueCategories = computed(() => {
  return [...new Set(projectsStore.projects
    .map(p => p.category)
    .filter(Boolean))]
    .sort();
});

const uniquePriorities = computed(() => {
  return [...new Set(projectsStore.projects
    .map(p => p.priority)
    .filter(Boolean))]
    .sort();
});

// Project statistics
const projectStats = computed(() => {
  const total = projectsStore.projects.length;
  
  // Status counts
  const statusCounts = {};
  projectsStore.projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  // Progress averages
  const avgProgress = projectsStore.projects.length > 0 
    ? Math.round(projectsStore.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total) 
    : 0;
  
  // Deadline metrics
  const now = new Date();
  const upcomingDeadlines = projectsStore.projects.filter(p => {
    if (!p.deadline) return false;
    const deadlineDate = new Date(p.deadline);
    const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14 && p.status !== 'Completed';
  }).length;
  
  // Team allocation
  const assignedProjects = projectsStore.projects.filter(p => p.assignedTo).length;
  const unassignedProjects = total - assignedProjects;
  
  return {
    total,
    statusCounts,
    avgProgress,
    upcomingDeadlines,
    assignedProjects,
    unassignedProjects
  };
});

// Filter projects based on search and filter criteria
const filteredProjects = computed(() => {
  return projectsStore.projects.filter(project => {
    // Apply search filter
    const matchesSearch = searchQuery.value === '' ||
      project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (project.remarks && project.remarks.toLowerCase().includes(searchQuery.value.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter.value === 'all' || project.status === statusFilter.value;
    
    // Apply assignee filter
    const matchesAssignee = assigneeFilter.value === 'all' || project.assignedTo === assigneeFilter.value;
    
    // Apply priority filter
    const matchesPriority = priorityFilter.value === 'all' || 
      (project.priority && project.priority === priorityFilter.value);
    
    // Apply category filter
    const matchesCategory = categoryFilter.value === 'all' || 
      (project.category && project.category === categoryFilter.value);
      
    // Apply date range filter if set
    let matchesDateRange = true;
    if (dateRangeFilter.value.start && dateRangeFilter.value.end) {
      const startDate = new Date(dateRangeFilter.value.start);
      const endDate = new Date(dateRangeFilter.value.end);
      
      if (project.startDate) {
        const projectStartDate = new Date(project.startDate);
        matchesDateRange = projectStartDate >= startDate && projectStartDate <= endDate;
      } else {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesAssignee && 
           matchesPriority && matchesCategory && matchesDateRange;
  });
});

// Sort projects
const sortedProjects = computed(() => {
  return [...filteredProjects.value].sort((a, b) => {
    let aValue, bValue;
    
    // Handle different sort fields
    switch(sortBy.value) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'progress':
        aValue = a.progress || 0;
        bValue = b.progress || 0;
        break;
      case 'assignee':
        aValue = getUserName(a.assignedTo);
        bValue = getUserName(b.assignedTo);
        break;
      case 'startDate':
        aValue = a.startDate ? new Date(a.startDate) : new Date(0);
        bValue = b.startDate ? new Date(b.startDate) : new Date(0);
        break;
      case 'endDate':
        aValue = a.endDate ? new Date(a.endDate) : new Date(0);
        bValue = b.endDate ? new Date(b.endDate) : new Date(0);
        break;
      case 'priority':
        aValue = a.priority || '';
        bValue = b.priority || '';
        break;
      case 'lastUpdated':
        aValue = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        bValue = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        break;
      default:
        aValue = a.name || '';
        bValue = b.name || '';
    }
    
    // Compare values based on sort direction
    if (sortDirection.value === 'asc') {
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    } else {
      if (aValue > bValue) return -1;
      if (aValue < bValue) return 1;
      return 0;
    }
  });
});

// Toggle row expansion
const toggleExpandRow = (projectId) => {
  if (expandedRows.value.has(projectId)) {
    expandedRows.value.delete(projectId);
  } else {
    expandedRows.value.add(projectId);
  }
};

// Toggle sort order
const toggleSort = (field) => {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortDirection.value = 'asc';
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

// Check if a project is approaching deadline
const isApproachingDeadline = (project) => {
  if (!project.deadline || project.status === 'Completed') return false;
  
  const now = new Date();
  const deadline = new Date(project.deadline);
  const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= 0 && daysDiff <= 7; // Within a week
};

// Project hover handlers
const handleProjectHover = (projectId) => {
  hoveredProjectId.value = projectId;
};

const handleProjectLeave = () => {
  hoveredProjectId.value = null;
};

// Handle export to Excel
const exportToExcel = () => {
  isExporting.value = true;
  notificationsStore.info('Preparing Excel export...', { timeout: 2000 });

  try {
    // Create a workbook with modern styling
    const workbook = XLSX.utils.book_new();
    
    // Add a clean, ultra-minimal cover sheet
    const summaryData = [
      [''], // Empty row for spacing
      ['PROJECTS'], 
      ['CoverageX Project Management System'],
      [''],
      [`Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`],
      [''],
      [`Total Projects: ${projectsStore.projects.length}`],
      [''],
    ];
    
    // Count projects by status for stats
    const statusCounts = {};
    projectsStore.projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    });
    
    // Add simple status distribution
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = Math.round(count/projectsStore.projects.length*100);
      summaryData.push([`${status}: ${count} (${percentage}%)`]);
    });
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summarySheet['!cols'] = [{ width: 40 }];
    
    // Add summary sheet to workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Overview');
    
    // Create minimalist overview of all projects
    const headers = [
      'Project Name',
      'Status',
      'Progress',
      'Team Lead',
      'Timeline',
      'Priority'
    ];
    
    // Create simple rows with key information only
    const rows = projectsStore.projects.map(project => [
      project.name,
      project.status,
      `${project.progress}%`,
      getUserName(project.assignedTo),
      `${project.startDate || 'N/A'} - ${project.endDate || 'N/A'}`,
      project.priority || 'N/A'
    ]);
    
    // Create the sheet with headers and rows
    const projectsSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Set column widths
    projectsSheet['!cols'] = [
      { width: 30 }, // Project Name
      { width: 12 }, // Status
      { width: 10 }, // Progress
      { width: 20 }, // Team Lead
      { width: 25 }, // Timeline
      { width: 12 }  // Priority
    ];
    
    // Add to workbook
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'All Projects');
    
    // Create individual project sheets with ultra-minimal design
    projectsStore.projects.forEach(project => {
      // Group all project information into logical sections with clean headings
      const projectData = [];
      
      // Project Info
      projectData.push(
        [project.name], // Title
        [`ID: ${project.id}`], // Subtitle
        [''], // Spacing
        ['DETAILS'], // Section header
        ['Status', project.status],
        ['Progress', `${project.progress}%`],
        ['Priority', project.priority || 'Not specified'],
        ['Category', project.category || 'Not specified'],
        ['']
      );
      
      // Team Info
      projectData.push(
        ['TEAM'],
        ['Lead', getUserName(project.assignedTo)],
        ['Responsible Person', project.responsiblePerson ? getUserName(project.responsiblePerson) : 'Not assigned'],
        ['Team Size', project.team ? project.team.length.toString() : '0'],
        ['Developers', project.developers ? project.developers.length.toString() : '0'],
        ['']
      );
      
      // Timeline Info
      projectData.push(
        ['TIMELINE'],
        ['Start Date', project.startDate || 'Not specified'],
        ['End Date', project.endDate || 'Not specified'],
        ['Deadline', project.deadline || 'Not specified'],
        ['Created', project.createdAt || 'Unknown'],
        ['Last Updated', project.lastUpdated || 'Unknown'],
        ['']
      );
      
      // Only include sections that have content to maintain minimalism
      if (project.remarks || project.notes || project.comments) {
        projectData.push(['NOTES']);
        if (project.remarks) projectData.push(['Remarks', project.remarks]);
        if (project.notes) projectData.push(['Notes', project.notes]);
        if (project.comments) projectData.push(['Comments', project.comments]);
        projectData.push(['']);
      }
      
      if (project.blockers || project.feedbackForBlockers) {
        projectData.push(['BLOCKERS']);
        if (project.blockers) projectData.push(['Blockers', project.blockers]);
        if (project.feedbackForBlockers) projectData.push(['Feedback', project.feedbackForBlockers]);
        projectData.push(['']);
      }
      
      if (project.externalLinks?.githubRepo || project.externalLinks?.figmaLink || project.externalLinks?.jiraProject) {
        projectData.push(['LINKS']);
        if (project.externalLinks?.githubRepo) projectData.push(['GitHub', project.externalLinks.githubRepo]);
        if (project.externalLinks?.figmaLink) projectData.push(['Figma', project.externalLinks.figmaLink]);
        if (project.externalLinks?.jiraProject) projectData.push(['Jira', project.externalLinks.jiraProject]);
      }
      
      // Create sheet with clean data
      const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
      
      // Set column widths for clean reading
      projectSheet['!cols'] = [
        { width: 20 },  // Labels
        { width: 60 }   // Values
      ];
      
      // Clean sheet name (remove special characters that Excel doesn't allow)
      const sheetName = project.name.substring(0, 20).replace(/[\[\]\*\?\/\\:]/g, '');
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(workbook, projectSheet, sheetName);
    });
    
    // Create and save Excel file with minimal filename
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `coveragex-projects-${new Date().toISOString().substring(0, 10)}.xlsx`);

    setTimeout(() => {
      isExporting.value = false;
      notificationsStore.success('Export completed! Your minimal Excel report has been downloaded.');
    }, 1000);
  } catch (error) {
    console.error('Excel generation error:', error);
    isExporting.value = false;
    notificationsStore.error('Failed to generate Excel file. Please try again.');
  }
};

// Handle export to PDF
const exportToPDF = () => {
  isExporting.value = true;
  notificationsStore.info('Preparing PDF export...', { timeout: 2000 });

  try {
    // Create a new jsPDF instance in landscape orientation for more space
    const doc = new jsPDF('landscape');
    
    // Ultra-modern color palette - monochromatic with accent
    const mono = {
      darkest: [33, 33, 33],    // Almost black
      dark: [66, 66, 66],       // Dark gray
      medium: [115, 115, 115],  // Medium gray
      light: [230, 230, 230],   // Light gray
      lightest: [248, 248, 248] // Almost white
    };
    const accent = [79, 70, 229]; // Indigo from your app
    
    // Helper function for cleaner drawing
    const drawRect = (x, y, w, h, color) => {
      doc.setFillColor(...color);
      doc.rect(x, y, w, h, 'F');
    };
    
    // Clean white background
    drawRect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), [255, 255, 255]);
    
    // Minimal header with accent line
    drawRect(0, 0, doc.internal.pageSize.getWidth(), 3, accent);
    
    // Main title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(...mono.darkest);
    doc.text('Projects', 15, 25);
    
    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...mono.medium);
    doc.text('CoverageX Project Management', 15, 35);
    
    // Date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Generated ${date}`, doc.internal.pageSize.getWidth() - 60, 35);
    
    // Stats in a clean bar
    drawRect(0, 45, doc.internal.pageSize.getWidth(), 22, mono.lightest);
    
    // Count projects by status
    const stats = {
      total: projectsStore.projects.length,
      statuses: {}
    };
    projectsStore.projects.forEach(project => {
      stats.statuses[project.status] = (stats.statuses[project.status] || 0) + 1;
    });
    
    // Display stats in a clean inline format
    doc.setFontSize(10);
    doc.setTextColor(...mono.dark);
    doc.text(`Total: ${stats.total}`, 15, 58);
    
    // Display status counts in horizontal layout
    let posX = 70;
    Object.entries(stats.statuses).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, posX, 58);
      posX += 50;
    });
    
    // Projects table with ultra-clean layout
    const startY = 80;
    
    // Table header
    autoTable(doc, {
      startY: startY,
      head: [['Project', 'Status', 'Progress', 'Team', 'Timeline']],
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: mono.darkest,
        fontStyle: 'bold',
        cellPadding: 8
      },
      styles: {
        cellPadding: 8,
        fontSize: 9,
        lineWidth: 0.1,
        lineColor: mono.light
      },
      body: projectsStore.projects.map(project => {
        // Format team members string
        const team = [getUserName(project.assignedTo)];
        if (project.responsiblePerson) {
          team.push(getUserName(project.responsiblePerson));
        }
        if (project.team && project.team.length > 0) {
          team.push(`+${project.team.length} more`);
        }
        
        // Format timeline
        const timeline = project.startDate && project.endDate 
          ? `${project.startDate} - ${project.endDate}`
          : 'Not specified';
          
        // Return row data
        return [
          { content: project.name, styles: { fontStyle: 'bold', cellWidth: 80 } },
          { 
            content: project.status,
            styles: { 
              fontStyle: 'bold',
              textColor: project.status === 'Completed' 
                ? [16, 185, 129] // Green
                : project.status === 'Ongoing'
                  ? [59, 130, 246] // Blue
                  : [245, 158, 11] // Amber
            } 
          },
          { 
            content: `${project.progress}%`, 
            styles: { 
              fontStyle: 'bold',
              textColor: project.progress >= 75 
                ? [16, 185, 129] // Green
                : project.progress >= 50 
                  ? [59, 130, 246] // Blue
                  : project.progress >= 25
                    ? [245, 158, 11] // Amber
                    : [239, 68, 68] // Red
            } 
          },
          { content: team.join(', ') },
          { content: timeline }
        ];
      })
    });
    
    // For each project add detailed page
    projectsStore.projects.forEach((project, index) => {
      doc.addPage();
      
      // Clean white background with accent strip
      drawRect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), [255, 255, 255]);
      drawRect(0, 0, doc.internal.pageSize.getWidth(), 3, accent);
      
      // Project title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(...mono.darkest);
      doc.text(project.name, 15, 25);
      
      // Project ID
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...mono.medium);
      doc.text(`ID: ${project.id}`, 15, 35);
      
      // Status and progress on right
      // Status pill
      let statusColor;
      switch(project.status) {
        case 'Completed': statusColor = [16, 185, 129]; break;
        case 'Ongoing': statusColor = [59, 130, 246]; break;
        default: statusColor = [245, 158, 11]; break;
      }
      
      // Draw ultra-clean status pill
      const statusWidth = doc.getStringUnitWidth(project.status) * 10 / doc.internal.scaleFactor;
      drawRect(doc.internal.pageSize.getWidth() - statusWidth - 35, 20, statusWidth + 20, 14, statusColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(project.status, doc.internal.pageSize.getWidth() - statusWidth - 25, 29);
      
      // Progress counter
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...statusColor);
      doc.text(`${project.progress}%`, doc.internal.pageSize.getWidth() - 40, 55);
      
      doc.setFontSize(10);
      doc.setTextColor(...mono.medium);
      doc.text("Progress", doc.internal.pageSize.getWidth() - 45, 65);
      
      // Minimal separator
      doc.setDrawColor(...mono.light);
      doc.setLineWidth(0.5);
      doc.line(15, 45, doc.internal.pageSize.getWidth() - 15, 45);
      
      // Core project info in a clean grid
      const grid = {
        startY: 55,
        startX: 15,
        width: doc.internal.pageSize.getWidth() - 30,
        columns: 2,
        rowHeight: 30,
        padding: 10
      };
      
      // Grid layout system
      const drawInfoGrid = (sections) => {
        let currentY = grid.startY;
        const columnWidth = grid.width / grid.columns;
        
        sections.forEach((section, sIdx) => {
          // Section title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(...mono.darkest);
          doc.text(section.title, grid.startX + (sIdx % grid.columns) * columnWidth, currentY);
          
          // Section box
          const boxX = grid.startX + (sIdx % grid.columns) * columnWidth;
          const boxY = currentY + 5;
          const boxWidth = columnWidth - grid.padding;
          const boxHeight = grid.rowHeight * 3;
          drawRect(boxX, boxY, boxWidth, boxHeight, mono.lightest);
          
          // Content
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          
          // Draw each field with value
          section.fields.forEach((field, fIdx) => {
            const fieldY = boxY + 15 + (fIdx * 15);
            
            // Field name
            doc.setTextColor(...mono.medium);
            doc.text(field.label, boxX + 10, fieldY);
            
            // Field value
            doc.setTextColor(...mono.darkest);
            const valueText = field.value || 'Not specified';
            
            // Handle long text with truncation
            if (valueText.length > 30) {
              doc.text(`${valueText.substring(0, 27)}...`, boxX + 80, fieldY);
            } else {
              doc.text(valueText, boxX + 80, fieldY);
            }
          });
          
          // Move to next row if we completed a full row
          if (sIdx % grid.columns === grid.columns - 1) {
            currentY += boxHeight + grid.padding + 20;
          }
        });
        
        // Return the next Y position
        return currentY + ((sections.length % grid.columns === 0) ? 0 : grid.rowHeight * 3 + grid.padding + 20);
      };
      
      // Define grid sections
      const sections = [
        {
          title: "Project Details",
          fields: [
            { label: "Category:", value: project.category },
            { label: "Priority:", value: project.priority },
            { label: "Company:", value: project.company },
            { label: "Status Phase:", value: project.statusPhase }
          ]
        },
        {
          title: "Team",
          fields: [
            { label: "Lead:", value: getUserName(project.assignedTo) },
            { label: "Responsible:", value: project.responsiblePerson ? getUserName(project.responsiblePerson) : null },
            { 
              label: "Team Size:", 
              value: project.team ? `${project.team.length} members` : "No team assigned"
            },
            { 
              label: "Developers:", 
              value: project.developers ? `${project.developers.length} developers` : "None assigned"
            }
          ]
        },
        {
          title: "Timeline",
          fields: [
            { label: "Start Date:", value: project.startDate },
            { label: "End Date:", value: project.endDate },
            { label: "Deadline:", value: project.deadline },
            { label: "Raised On:", value: project.initiallyRaisedOn }
          ]
        },
        {
          title: "External Links",
          fields: [
            { label: "GitHub:", value: project.externalLinks?.githubRepo },
            { label: "Figma:", value: project.externalLinks?.figmaLink },
            { label: "Jira:", value: project.externalLinks?.jiraProject },
            { label: "Created By:", value: project.createdBy }
          ]
        }
      ];
      
      let nextY = drawInfoGrid(sections);
      
      // Notes and blockers
      if (project.remarks || project.notes || project.blockers || project.feedbackForBlockers) {
        // Title for detailed content
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...mono.darkest);
        doc.text("Additional Information", 15, nextY);
        
        // Content
        nextY += 10;
        
        // Create detailed information table
        autoTable(doc, {
          startY: nextY,
          theme: 'plain',
          styles: { 
            fontSize: 9, 
            cellPadding: 8,
            overflow: 'linebreak',
            lineWidth: 0.1,
            lineColor: mono.light
          },
          headStyles: {
            fillColor: mono.lightest,
            textColor: mono.darkest,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto' }
          },
          head: [['Type', 'Content']],
          body: [
            ...(project.remarks ? [["Remarks", project.remarks]] : []),
            ...(project.notes ? [["Notes", project.notes]] : []),
            ...(project.blockers ? [["Blockers", project.blockers]] : []),
            ...(project.feedbackForBlockers ? [["Feedback on Blockers", project.feedbackForBlockers]] : []),
            ...(project.comments ? [["Comments", project.comments]] : [])
          ].filter(row => row[1]) // Filter out empty content
        });
      }
      
      // Minimalist footer
      doc.setFontSize(8);
      doc.setTextColor(...mono.medium);
      doc.text(`Page ${index + 2} of ${projectsStore.projects.length + 1}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 10);
      doc.text("CoverageX", 15, doc.internal.pageSize.getHeight() - 10);
    });
    
    // Save with clean filename
    doc.save(`coveragex_projects_${new Date().toISOString().substring(0, 10)}.pdf`);
    
    setTimeout(() => {
      isExporting.value = false;
      notificationsStore.success('Export completed! Your minimal PDF report is ready.');
    }, 1000);
  } catch (error) {
    console.error('PDF generation error:', error);
    isExporting.value = false;
    notificationsStore.error('Failed to generate PDF. Please try again.');
  }
};

// Delete project with confirmation
const deleteProject = async (project) => {
  // Use confirmation from notificationsStore instead of injected notify
  const confirmed = await notificationsStore.confirm(
    `Are you sure you want to delete "${project.name}"?`,
    {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'error'
    }
  );
  
  if (confirmed) {
    try {
      // Use MongoDB _id if available, otherwise fall back to numeric id
      const projectId = project._id || project.id;
      await projectsStore.deleteProject(projectId);
      notificationsStore.success(`Project "${project.name}" was deleted successfully`);
    } catch (error) {
      notificationsStore.error(`Failed to delete project: ${error.message}`);
    }
  }
};

// Open new project modal
const openNewProjectModal = () => {
  isNewProjectModalOpen.value = true;
};

// Close new project modal
const closeNewProjectModal = () => {
  isNewProjectModalOpen.value = false;
};

// Clear all filters
const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  assigneeFilter.value = 'all';
  priorityFilter.value = 'all';
  categoryFilter.value = 'all';
  dateRangeFilter.value = {
    start: null,
    end: null
  };
  
  notificationsStore.info('Filters have been cleared', { timeout: 2000 });
};
</script>

<template>
  <div>
    <!-- Page Header with Title and Action Buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <h1 class="text-2xl font-bold text-neutral-900 mb-4 md:mb-0">Projects</h1>
      
      <div class="flex flex-wrap gap-2">
        <div class="inline-flex rounded-md shadow-sm" role="group">
          <button 
            @click="viewMode = 'table'"
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium border border-neutral-300 rounded-l-lg',
              viewMode === 'table' 
                ? 'bg-primary-50 text-primary-700 border-primary-300' 
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            ]"
          >
            <span class="mdi mdi-table text-lg mr-1"></span>
            Table
          </button>
          <button 
            @click="viewMode = 'cards'"
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium border border-neutral-300 border-l-0 rounded-r-lg',
              viewMode === 'cards' 
                ? 'bg-primary-50 text-primary-700 border-primary-300' 
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            ]"
          >
            <span class="mdi mdi-view-grid text-lg mr-1"></span>
            Cards
          </button>
        </div>
        
        <button 
          @click="exportToExcel"
          :disabled="isExporting"
          class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="isExporting" class="mdi mdi-loading mdi-spin text-lg mr-2 text-success-600"></span>
          <span v-else class="mdi mdi-microsoft-excel text-lg mr-2 text-success-600"></span>
          {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
        </button>
        
        <button 
          @click="exportToPDF"
          :disabled="isExporting"
          class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="isExporting" class="mdi mdi-loading mdi-spin text-lg mr-2 text-error-600"></span>
          <span v-else class="mdi mdi-file-pdf-box text-lg mr-2 text-error-600"></span>
          {{ isExporting ? 'Exporting...' : 'Export to PDF' }}
        </button>
        
        <button 
          @click="openNewProjectModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
        >
          <span class="mdi mdi-plus text-lg mr-2"></span>
          Add Project
        </button>
      </div>
    </div>
    
    <!-- Statistics Dashboard Section -->
    <div v-if="showStats" class="mb-6 animate-fade-in">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Projects Card -->
        <div class="bg-white rounded-lg shadow-card overflow-hidden border border-neutral-100">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-primary-100 rounded-full p-3">
                <span class="mdi mdi-briefcase-outline text-xl text-primary-700"></span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-neutral-500 truncate">Total Projects</dt>
                  <dd>
                    <div class="text-lg font-semibold text-neutral-900">{{ projectStats.total }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-neutral-50 px-5 py-3 flex items-center justify-between">
            <div class="text-xs text-neutral-500">
              <span class="font-medium text-success-600">{{ projectStats.statusCounts?.Completed || 0 }}</span> completed
            </div>
            <div class="text-xs text-neutral-500">
              <span class="font-medium text-accent-600">{{ projectStats.statusCounts?.Ongoing || 0 }}</span> ongoing
            </div>
            <div class="text-xs text-neutral-500">
              <span class="font-medium text-warning-600">{{ projectStats.statusCounts?.['On Hold'] || 0 }}</span> on hold
            </div>
          </div>
        </div>
        
        <!-- Average Progress Card -->
        <div class="bg-white rounded-lg shadow-card overflow-hidden border border-neutral-100">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-accent-100 rounded-full p-3">
                <span class="mdi mdi-chart-line text-xl text-accent-700"></span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-neutral-500 truncate">Average Progress</dt>
                  <dd>
                    <div class="text-lg font-semibold text-neutral-900">{{ projectStats.avgProgress }}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-neutral-50 px-5 py-3">
            <div class="w-full bg-neutral-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full bg-accent-600"
                :style="`width: ${projectStats.avgProgress}%`"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Upcoming Deadlines Card -->
        <div class="bg-white rounded-lg shadow-card overflow-hidden border border-neutral-100">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-warning-100 rounded-full p-3">
                <span class="mdi mdi-calendar-clock text-xl text-warning-700"></span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-neutral-500 truncate">Upcoming Deadlines</dt>
                  <dd>
                    <div class="text-lg font-semibold text-neutral-900">{{ projectStats.upcomingDeadlines }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
            Projects with deadlines in the next 14 days
          </div>
        </div>
        
        <!-- Team Allocation Card -->
        <div class="bg-white rounded-lg shadow-card overflow-hidden border border-neutral-100">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-success-100 rounded-full p-3">
                <span class="mdi mdi-account-group text-xl text-success-700"></span>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-neutral-500 truncate">Team Allocation</dt>
                  <dd>
                    <div class="text-lg font-semibold text-neutral-900">{{ projectStats.assignedProjects }} / {{ projectStats.total }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-neutral-50 px-5 py-3 flex items-center justify-between">
            <div class="text-xs text-neutral-500">
              <span class="font-medium text-success-600">{{ projectStats.assignedProjects }}</span> assigned
            </div>
            <div class="text-xs text-neutral-500">
              <span class="font-medium text-warning-600">{{ projectStats.unassignedProjects }}</span> unassigned
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <button 
          @click="showStats = false"
          class="text-sm text-neutral-500 hover:text-neutral-700 flex items-center"
        >
          <span class="mdi mdi-chevron-up mr-1"></span> Hide Statistics
        </button>
      </div>
    </div>
    <div v-else class="mb-6">
      <button 
        @click="showStats = true"
        class="text-sm text-neutral-500 hover:text-neutral-700 flex items-center"
      >
        <span class="mdi mdi-chevron-down mr-1"></span> Show Statistics
      </button>
    </div>
    
    <!-- Filters Section -->
    <div class="bg-white rounded-lg shadow-card p-4 mb-6">
      <div class="flex flex-wrap justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-neutral-900">Filters</h2>
        <div class="flex gap-2">
          <button 
            @click="expandedFilters = !expandedFilters" 
            class="text-sm text-neutral-500 hover:text-neutral-700 flex items-center"
          >
            <span v-if="expandedFilters" class="mdi mdi-chevron-up mr-1"></span>
            <span v-else class="mdi mdi-chevron-down mr-1"></span>
            {{ expandedFilters ? 'Less Filters' : 'More Filters' }}
          </button>
          <button 
            @click="clearFilters"
            class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            <span class="mdi mdi-filter-remove mr-1"></span>
            Clear All
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search Box -->
        <div>
          <label for="search" class="block text-sm font-medium text-neutral-700 mb-1">Search</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <span class="mdi mdi-magnify text-lg"></span>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              id="search"
              placeholder="Search projects..." 
              class="w-full pl-10 pr-4 py-2 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
          </div>
        </div>
        
        <!-- Status Filter -->
        <div>
          <label for="status" class="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <select 
            v-model="statusFilter"
            id="status"
            class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        
        <!-- Assignee Filter -->
        <div>
          <label for="assignee" class="block text-sm font-medium text-neutral-700 mb-1">Assigned To</label>
          <select 
            v-model="assigneeFilter"
            id="assignee"
            class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            <option v-for="assignee in uniqueAssignees" :key="assignee.id" :value="assignee.id">
              {{ assignee.name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Extended Filters (collapsible) -->
      <transition name="fade">
        <div v-if="expandedFilters" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200">
          <!-- Priority Filter -->
          <div>
            <label for="priority" class="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
            <select 
              v-model="priorityFilter"
              id="priority"
              class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option v-for="priority in uniquePriorities" :key="priority" :value="priority">
                {{ priority }}
              </option>
            </select>
          </div>
          
          <!-- Category Filter -->
          <div>
            <label for="category" class="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select 
              v-model="categoryFilter"
              id="category"
              class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          
          <!-- Date Range Filter -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
            <div class="grid grid-cols-2 gap-2">
              <input 
                v-model="dateRangeFilter.start"
                type="date"
                placeholder="Start Date"
                class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input 
                v-model="dateRangeFilter.end"
                type="date"
                placeholder="End Date"
                class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
    
    <!-- Sort Controls -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <span class="text-sm text-neutral-500 mr-2">Sort by:</span>
        <div class="relative inline-block text-left">
          <select 
            v-model="sortBy"
            class="py-1 px-2 text-sm rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="progress">Progress</option>
            <option value="assignee">Assignee</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
            <option value="priority">Priority</option>
            <option value="lastUpdated">Last Updated</option>
          </select>
        </div>
        <button 
          @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'" 
          class="ml-2 p-1 rounded-md hover:bg-neutral-100 text-neutral-500"
        >
          <span v-if="sortDirection === 'asc'" class="mdi mdi-sort-ascending text-lg"></span>
          <span v-else class="mdi mdi-sort-descending text-lg"></span>
        </button>
      </div>
      
      <div class="text-sm text-neutral-500">
        Showing {{ sortedProjects.length }} of {{ projectsStore.projects.length }} projects
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    </div>
    
    <!-- Table View -->
    <div v-else-if="viewMode === 'table'" class="bg-white rounded-lg shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="pl-6 pr-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div class="flex items-center cursor-pointer" @click="toggleSort('name')">
                  Project Name
                  <span v-if="sortBy === 'name'" class="ml-1">
                    <span v-if="sortDirection === 'asc'" class="mdi mdi-chevron-up text-xs"></span>
                    <span v-else class="mdi mdi-chevron-down text-xs"></span>
                  </span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div class="flex items-center cursor-pointer" @click="toggleSort('status')">
                  Status
                  <span v-if="sortBy === 'status'" class="ml-1">
                    <span v-if="sortDirection === 'asc'" class="mdi mdi-chevron-up text-xs"></span>
                    <span v-else class="mdi mdi-chevron-down text-xs"></span>
                  </span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div class="flex items-center cursor-pointer" @click="toggleSort('progress')">
                  Progress
                  <span v-if="sortBy === 'progress'" class="ml-1">
                    <span v-if="sortDirection === 'asc'" class="mdi mdi-chevron-up text-xs"></span>
                    <span v-else class="mdi mdi-chevron-down text-xs"></span>
                  </span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                <div class="flex items-center cursor-pointer" @click="toggleSort('assignee')">
                  Assigned To
                  <span v-if="sortBy === 'assignee'" class="ml-1">
                    <span v-if="sortDirection === 'asc'" class="mdi mdi-chevron-up text-xs"></span>
                    <span v-else class="mdi mdi-chevron-down text-xs"></span>
                  </span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                <div class="flex items-center cursor-pointer" @click="toggleSort('startDate')">
                  Timeline
                  <span v-if="sortBy === 'startDate'" class="ml-1">
                    <span v-if="sortDirection === 'asc'" class="mdi mdi-chevron-up text-xs"></span>
                    <span v-else class="mdi mdi-chevron-down text-xs"></span>
                  </span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <template v-for="project in sortedProjects" :key="project.id">
              <!-- Main Row -->
              <tr 
                class="hover:bg-neutral-50 cursor-pointer transition-colors" 
                :class="{ 'bg-neutral-50': expandedRows.has(project.id) }"
                @mouseenter="handleProjectHover(project.id)"
                @mouseleave="handleProjectLeave"
              >
                <td class="pl-6 pr-3 py-4">
                  <div class="flex items-center">
                    <!-- Expand/Collapse Button -->
                    <button 
                      @click="toggleExpandRow(project.id)" 
                      class="mr-2 text-neutral-400 hover:text-primary-600"
                    >
                      <span v-if="expandedRows.has(project.id)" class="mdi mdi-chevron-down"></span>
                      <span v-else class="mdi mdi-chevron-right"></span>
                    </button>
                    
                    <!-- Project Name with Indicator -->
                    <div>
                      <div class="flex items-center">
                        <span class="text-sm font-medium text-neutral-900">{{ project.name }}</span>
                        <span 
                          v-if="isApproachingDeadline(project)"
                          class="ml-2 mdi mdi-clock-alert-outline text-warning-600" 
                          title="Approaching deadline"
                        ></span>
                      </div>
                      <div class="text-xs text-neutral-500 mt-1 truncate max-w-[200px]">
                        {{ project.remarks || 'No description' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                  <span 
                    :class="[
                      'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                      project.status === 'Completed' ? 'bg-success-100 text-success-800' : 
                      project.status === 'Ongoing' ? 'bg-accent-100 text-accent-800' : 
                      'bg-warning-100 text-warning-800'
                    ]"
                  >
                    {{ project.status }}
                  </span>
                </td>
                <td class="px-3 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                      <div 
                        :class="[
                          'h-2 rounded-full transition-all duration-500',
                          project.progress >= 80 ? 'bg-success-600' : 
                          project.progress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                        ]"
                        :style="`width: ${project.progress}%`"
                      ></div>
                    </div>
                    <span class="text-xs font-medium text-neutral-700">{{ project.progress }}%</span>
                  </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap hidden md:table-cell">
                  <div class="flex items-center">
                    <span class="inline-block h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2">
                      {{ getUserName(project.assignedTo).charAt(0) }}
                    </span>
                    <span class="text-sm text-neutral-700">{{ getUserName(project.assignedTo) }}</span>
                  </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                  <div class="flex items-center">
                    <span class="mdi mdi-calendar-range text-neutral-400 mr-1"></span>
                    <span class="text-sm text-neutral-700">
                      {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-right text-sm space-x-1">
                  <NuxtLink 
                    :to="`/projects/${project.id}`" 
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                  >
                    View
                  </NuxtLink>
                  <NuxtLink 
                    :to="`/projects/${project.id}`" 
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                  >
                    Edit
                  </NuxtLink>
                  <button 
                    @click.stop="deleteProject(project)" 
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-error-50 text-error-700 hover:bg-error-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              
              <!-- Expanded Row with Details -->
              <tr v-if="expandedRows.has(project.id)">
                <td colspan="6" class="p-0">
                  <div class="bg-neutral-50 p-4 pl-12 border-t border-neutral-100">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <!-- Project Details -->
                      <div class="bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
                        <h3 class="text-sm font-medium text-neutral-900 mb-3">Project Details</h3>
                        <ul class="space-y-2">
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Priority:</span>
                            <span 
                              :class="[
                                'font-medium',
                                project.priority === 'High' ? 'text-error-600' :
                                project.priority === 'Medium' ? 'text-warning-600' :
                                'text-success-600'
                              ]"
                            >{{ project.priority || 'Not set' }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Category:</span>
                            <span class="font-medium text-neutral-700">{{ project.category || 'Not set' }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Company:</span>
                            <span class="font-medium text-neutral-700">{{ project.company || 'Not set' }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Last Updated:</span>
                            <span class="font-medium text-neutral-700">{{ formatDate(project.lastUpdated) }}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <!-- Timeline -->
                      <div class="bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
                        <h3 class="text-sm font-medium text-neutral-900 mb-3">Timeline</h3>
                        <ul class="space-y-2">
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Start Date:</span>
                            <span class="font-medium text-neutral-700">{{ formatDate(project.startDate) }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">End Date:</span>
                            <span class="font-medium text-neutral-700">{{ formatDate(project.endDate) }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Deadline:</span>
                            <span 
                              :class="[
                                'font-medium',
                                isApproachingDeadline(project) ? 'text-error-600' : 'text-neutral-700'
                              ]"
                            >{{ formatDate(project.deadline) }}</span>
                          </li>
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Created On:</span>
                            <span class="font-medium text-neutral-700">{{ formatDate(project.createdAt) }}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <!-- Team and External Links -->
                      <div class="bg-white p-4 rounded-lg shadow-sm border border-neutral-100">
                        <h3 class="text-sm font-medium text-neutral-900 mb-3">Team & Links</h3>
                        <ul class="space-y-2">
                          <li class="flex justify-between text-sm">
                            <span class="text-neutral-500">Responsible Person:</span>
                            <span class="font-medium text-neutral-700">
                              {{ project.responsiblePerson ? getUserName(project.responsiblePerson) : 'Not assigned' }}
                            </span>
                          </li>
                          <li class="flex items-center justify-between text-sm">
                            <span class="text-neutral-500">Team Size:</span>
                            <span class="font-medium text-neutral-700">
                              {{ project.team ? project.team.length : 0 }} members
                            </span>
                          </li>
                          <template v-if="project.externalLinks">
                            <li v-if="project.externalLinks.githubRepo" class="text-sm flex items-center">
                              <span class="mdi mdi-github text-lg mr-1 text-neutral-700"></span>
                              <a 
                                :href="project.externalLinks.githubRepo" 
                                target="_blank" 
                                class="text-primary-600 hover:underline truncate max-w-[150px] inline-block"
                              >
                                GitHub Repository
                              </a>
                            </li>
                            <li v-if="project.externalLinks.figmaLink" class="text-sm flex items-center">
                              <span class="mdi mdi-palette-outline text-lg mr-1 text-neutral-700"></span>
                              <a 
                                :href="project.externalLinks.figmaLink" 
                                target="_blank" 
                                class="text-primary-600 hover:underline truncate max-w-[150px] inline-block"
                              >
                                Figma Designs
                              </a>
                            </li>
                          </template>
                        </ul>
                      </div>
                    </div>
                    
                    <div class="mt-4 text-sm text-neutral-500" v-if="project.remarks || project.notes">
                      <h4 class="font-medium text-neutral-700 mb-1">Description</h4>
                      <p>{{ project.remarks || project.notes || 'No description available' }}</p>
                    </div>
                    
                    <div class="mt-4 flex justify-center">
                      <NuxtLink 
                        :to="`/projects/${project.id}`"
                        class="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        View Full Details
                        <span class="mdi mdi-arrow-right ml-1"></span>
                      </NuxtLink>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            
            <!-- No Projects Found -->
            <tr v-if="sortedProjects.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-folder-search-outline text-4xl text-neutral-400 mb-2"></span>
                  No projects found matching your filters.
                  <button @click="clearFilters" class="mt-2 text-primary-600 hover:text-primary-700">
                    Clear filters
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Card View -->
    <div v-else-if="viewMode === 'cards'" class="mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="project in sortedProjects" 
          :key="project.id" 
          class="bg-white rounded-lg shadow-card border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
          @mouseenter="handleProjectHover(project.id)"
          @mouseleave="handleProjectLeave"
        >
          <!-- Card Header -->
          <div class="p-4 border-b border-neutral-100">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-medium text-neutral-900 pr-4">{{ project.name }}</h3>
              <span 
                :class="[
                  'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                  project.status === 'Completed' ? 'bg-success-100 text-success-800' : 
                  project.status === 'Ongoing' ? 'bg-accent-100 text-accent-800' : 
                  'bg-warning-100 text-warning-800'
                ]"
              >
                {{ project.status }}
              </span>
            </div>
            <div class="flex items-center text-sm text-neutral-500">
              <span class="mdi mdi-calendar text-neutral-400 mr-1"></span>
              <span>{{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</span>
              <span
                v-if="isApproachingDeadline(project)"
                class="ml-2 mdi mdi-clock-alert-outline text-warning-600"
                title="Approaching deadline"
              ></span>
            </div>
          </div>
          
          <!-- Card Body -->
          <div class="p-4">
            <div class="mb-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium text-neutral-700">Progress</span>
                <span class="text-sm font-medium text-neutral-700">{{ project.progress }}%</span>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all duration-500',
                    project.progress >= 80 ? 'bg-success-600' : 
                    project.progress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                  ]"
                  :style="`width: ${project.progress}%`"
                ></div>
              </div>
            </div>
            
            <!-- Project details -->
            <div class="space-y-3">
              <!-- Team -->
              <div class="flex items-center">
                <span class="inline-block h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2">
                  {{ getUserName(project.assignedTo).charAt(0) }}
                </span>
                <div>
                  <div class="text-xs text-neutral-500">Team Lead</div>
                  <div class="text-sm text-neutral-900">{{ getUserName(project.assignedTo) }}</div>
                </div>
              </div>
              
              <!-- Category and Priority -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <div class="text-xs text-neutral-500">Category</div>
                  <div class="text-sm text-neutral-900">{{ project.category || 'Not set' }}</div>
                </div>
                <div>
                  <div class="text-xs text-neutral-500">Priority</div>
                  <div 
                    :class="[
                      'text-sm font-medium',
                      project.priority === 'High' ? 'text-error-600' : 
                      project.priority === 'Medium' ? 'text-warning-600' : 
                      'text-success-600'
                    ]"
                  >
                    {{ project.priority || 'Not set' }}
                  </div>
                </div>
              </div>
              
              <!-- Description -->
              <div v-if="project.remarks">
                <div class="text-xs text-neutral-500">Description</div>
                <div class="text-sm text-neutral-700 line-clamp-2">{{ project.remarks }}</div>
              </div>
            </div>
          </div>
          
          <!-- Card Footer -->
          <div class="bg-neutral-50 px-4 py-3 flex justify-between items-center">
            <div class="text-xs text-neutral-500">
              Last updated: {{ formatDate(project.lastUpdated) }}
            </div>
            
            <div class="flex gap-1">
              <NuxtLink 
                :to="`/projects/${project.id}`" 
                class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
              >
                View
              </NuxtLink>
              <NuxtLink 
                :to="`/projects/${project.id}`" 
                class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
              >
                Edit
              </NuxtLink>
              <button 
                @click="deleteProject(project)" 
                class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-error-50 text-error-700 hover:bg-error-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <!-- Empty state when no projects match filters -->
        <div v-if="sortedProjects.length === 0" class="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-lg">
          <div class="flex flex-col items-center">
            <span class="mdi mdi-folder-search-outline text-5xl text-neutral-300 mb-4"></span>
            <h3 class="text-lg font-medium text-neutral-700 mb-1">No projects found</h3>
            <p class="text-neutral-500 mb-4">Try changing your filter criteria</p>
            <button 
              @click="clearFilters" 
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
        
        <!-- Add new project card -->
        <div 
          class="flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer min-h-[220px]"
          @click="openNewProjectModal"
        >
          <div class="flex flex-col items-center text-center p-4">
            <span class="mdi mdi-plus-circle-outline text-4xl text-primary-500 mb-2"></span>
            <h3 class="text-lg font-medium text-neutral-700 mb-1">Add New Project</h3>
            <p class="text-sm text-neutral-500">Click to create a new project</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Project Modal -->
    <NewProjectModal 
      :is-open="isNewProjectModalOpen" 
      @close="closeNewProjectModal"
    />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active, 
.fade-leave-active {
  transition: all 0.3s ease-out;
}

.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

/* Smooth transition for progress bars */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 500ms;
}
</style>