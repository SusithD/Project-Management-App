// Mock API to fetch all projects
export default defineEventHandler(async (event) => {
  // In a real app, this would fetch from a database
  // For demo purposes, we'll return mock data
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Get query parameters for filtering
  const query = getQuery(event)
  const search = query.search?.toString() || ''
  const status = query.status?.toString() || ''
  const assignee = query.assignee?.toString() || ''
  
  // Mock data
  let projects = [
    { 
      id: 1, 
      name: 'Website Redesign', 
      status: 'Ongoing', 
      progress: 75, 
      assignedTo: 'John Doe',
      startDate: '2023-10-15',
      endDate: '2024-05-30',
      lastUpdated: '2024-04-22',
      remarks: 'Frontend development is 80% complete. Backend integration to start next week.'
    },
    { 
      id: 2, 
      name: 'Mobile App Development', 
      status: 'Ongoing', 
      progress: 45, 
      assignedTo: 'Jane Smith',
      startDate: '2024-01-10',
      endDate: '2024-07-15',
      lastUpdated: '2024-04-20',
      remarks: 'UI design completed. Development in progress.'
    },
    { 
      id: 3, 
      name: 'CRM Integration', 
      status: 'On Hold', 
      progress: 30, 
      assignedTo: 'Mark Johnson',
      startDate: '2023-12-05',
      endDate: '2024-06-20',
      lastUpdated: '2024-03-15',
      remarks: 'On hold due to client requirements review.'
    },
    { 
      id: 4, 
      name: 'Brand Redesign', 
      status: 'Completed', 
      progress: 100, 
      assignedTo: 'Emily Clark',
      startDate: '2023-09-01',
      endDate: '2024-02-28',
      lastUpdated: '2024-02-28',
      remarks: 'Successfully completed ahead of schedule.'
    },
    { 
      id: 5, 
      name: 'Marketing Campaign', 
      status: 'Ongoing', 
      progress: 60, 
      assignedTo: 'Sarah Wilson',
      startDate: '2024-02-15',
      endDate: '2024-06-10',
      lastUpdated: '2024-04-18',
      remarks: 'Social media phase complete. Email campaign phase in progress.'
    },
    { 
      id: 6, 
      name: 'Data Migration', 
      status: 'Completed', 
      progress: 100, 
      assignedTo: 'James Brown',
      startDate: '2023-11-20',
      endDate: '2024-03-10',
      lastUpdated: '2024-03-10',
      remarks: 'Data migration completed and verified.'
    }
  ]
  
  // Apply filters
  if (search) {
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.remarks.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  if (status) {
    projects = projects.filter(p => p.status === status)
  }
  
  if (assignee) {
    projects = projects.filter(p => p.assignedTo === assignee)
  }
  
  return projects
})