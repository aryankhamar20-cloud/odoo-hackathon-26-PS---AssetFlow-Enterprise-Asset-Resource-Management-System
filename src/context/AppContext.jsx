import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

// Helper to get from localStorage or fallback to default
const getStorageItem = (key, fallback) => {
  const item = localStorage.getItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item);
  } catch (e) {
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  // --- SEED DATA ---
  const initialDepartments = [
    { id: 'd-1', name: 'Administration', headId: 'e-1', parentId: null, status: 'Active' },
    { id: 'd-2', name: 'Operations', headId: 'e-2', parentId: null, status: 'Active' },
    { id: 'd-3', name: 'Information Technology', headId: 'e-3', parentId: 'd-2', status: 'Active' },
    { id: 'd-4', name: 'Human Resources', headId: 'e-4', parentId: 'd-2', status: 'Active' },
    { id: 'd-5', name: 'Finance', headId: null, parentId: 'd-2', status: 'Active' },
    { id: 'd-6', name: 'Marketing (Inactive)', headId: null, parentId: null, status: 'Inactive' },
  ];

  const initialEmployees = [
    { id: 'e-1', name: 'Super Admin', email: 'admin@company.com', password: 'admin', departmentId: 'd-1', role: 'Admin', status: 'Active' },
    { id: 'e-2', name: 'Priya Sharma', email: 'priya@company.com', password: 'password', departmentId: 'd-2', role: 'Asset Manager', status: 'Active' },
    { id: 'e-3', name: 'John Doe', email: 'john@company.com', password: 'password', departmentId: 'd-3', role: 'Department Head', status: 'Active' },
    { id: 'e-4', name: 'Sarah Jenkins', email: 'sarah@company.com', password: 'password', departmentId: 'd-4', role: 'Department Head', status: 'Active' },
    { id: 'e-5', name: 'Raj Patel', email: 'raj@company.com', password: 'password', departmentId: 'd-3', role: 'Employee', status: 'Active' },
    { id: 'e-6', name: 'Lisa Kudrow', email: 'lisa@company.com', password: 'password', departmentId: 'd-4', role: 'Employee', status: 'Active' },
    { id: 'e-7', name: 'David Gahan', email: 'david@company.com', password: 'password', departmentId: 'd-3', role: 'Employee', status: 'Active' },
    { id: 'e-8', name: 'Former Employee', email: 'former@company.com', password: 'password', departmentId: 'd-5', role: 'Employee', status: 'Inactive' },
  ];

  const initialCategories = [
    { id: 'c-1', name: 'Electronics', fields: [{ name: 'Warranty Period', type: 'text', required: true }] },
    { id: 'c-2', name: 'Furniture', fields: [{ name: 'Material', type: 'text', required: false }] },
    { id: 'c-3', name: 'Vehicles', fields: [{ name: 'Insurance Expiry', type: 'date', required: true }] },
    { id: 'c-4', name: 'Shared Rooms', fields: [{ name: 'Capacity', type: 'number', required: true }] },
  ];

  const initialAssets = [
    {
      id: 'a-1',
      tag: 'AF-0001',
      name: 'MacBook Pro 16"',
      categoryId: 'c-1',
      serialNumber: 'SN-MBP16001',
      acquisitionDate: '2025-01-10',
      acquisitionCost: 2200,
      condition: 'New',
      location: 'IT Lab',
      shared: false,
      status: 'Available',
      extraFields: { 'Warranty Period': '3 Years' }
    },
    {
      id: 'a-2',
      tag: 'AF-0002',
      name: 'Dell XPS 15',
      categoryId: 'c-1',
      serialNumber: 'SN-DELLXPS02',
      acquisitionDate: '2024-06-15',
      acquisitionCost: 1800,
      condition: 'Good',
      location: 'Room 101',
      shared: false,
      status: 'Allocated',
      extraFields: { 'Warranty Period': '2 Years' }
    },
    {
      id: 'a-3',
      tag: 'AF-0003',
      name: 'Ergonomic Desk Chair',
      categoryId: 'c-2',
      serialNumber: 'SN-CHAIR304',
      acquisitionDate: '2024-02-20',
      acquisitionCost: 350,
      condition: 'Good',
      location: 'Main Office',
      shared: false,
      status: 'Available',
      extraFields: { 'Material': 'Mesh Fabric' }
    },
    {
      id: 'a-4',
      tag: 'AF-0004',
      name: 'Company Shuttle Van',
      categoryId: 'c-3',
      serialNumber: 'SN-VAN9988',
      acquisitionDate: '2023-11-05',
      acquisitionCost: 45000,
      condition: 'Fair',
      location: 'Garage',
      shared: true,
      status: 'Available',
      extraFields: { 'Insurance Expiry': '2026-12-31' }
    },
    {
      id: 'a-5',
      tag: 'AF-0005',
      name: 'Main Conference Room B2',
      categoryId: 'c-4',
      serialNumber: 'SN-ROOMB2',
      acquisitionDate: '2022-08-01',
      acquisitionCost: 15000,
      condition: 'New',
      location: 'Building B, Floor 2',
      shared: true,
      status: 'Available',
      extraFields: { 'Capacity': '15' }
    },
    {
      id: 'a-6',
      tag: 'AF-0006',
      name: 'iPhone 15 Pro',
      categoryId: 'c-1',
      serialNumber: 'SN-IPHONE15P',
      acquisitionDate: '2024-09-20',
      acquisitionCost: 1100,
      condition: 'Fair',
      location: 'IT Lab',
      shared: false,
      status: 'Under Maintenance',
      extraFields: { 'Warranty Period': '1 Year' }
    },
    {
      id: 'a-7',
      tag: 'AF-0007',
      name: 'Standing Desk Dual-Motor',
      categoryId: 'c-2',
      serialNumber: 'SN-DESK402',
      acquisitionDate: '2024-05-18',
      acquisitionCost: 650,
      condition: 'Good',
      location: 'HR Office',
      shared: false,
      status: 'Allocated',
      extraFields: { 'Material': 'Oak Wood' }
    },
  ];

  const initialAllocations = [
    {
      id: 'al-1',
      assetId: 'a-2',
      assignedTo: 'e-5', // Raj Patel
      type: 'employee',
      assignedDate: '2026-06-01',
      expectedReturn: '2026-07-10', // Overdue return since current is 2026-07-12
      actualReturn: null,
      status: 'active',
      notes: 'Assigned for IT development project.'
    },
    {
      id: 'al-2',
      assetId: 'a-7',
      assignedTo: 'd-4', // HR Department
      type: 'department',
      assignedDate: '2026-05-20',
      expectedReturn: null,
      actualReturn: null,
      status: 'active',
      notes: 'Shared desk in HR bullpen.'
    }
  ];

  // Helper date generators for bookings
  const getTodayAt = (hours, mins = 0) => {
    const d = new Date();
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };
  const getTomorrowAt = (hours, mins = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  const initialBookings = [
    {
      id: 'b-1',
      resourceId: 'a-5', // Conference Room B2
      bookedBy: 'e-3', // John Doe
      start: getTodayAt(9),
      end: getTodayAt(10),
      status: 'Completed',
      notes: 'IT Sprint Sync'
    },
    {
      id: 'b-2',
      resourceId: 'a-5', // Conference Room B2
      bookedBy: 'e-4', // Sarah Jenkins
      start: getTodayAt(14),
      end: getTodayAt(15, 30),
      status: 'Upcoming',
      notes: 'HR Interview Loop'
    },
    {
      id: 'b-3',
      resourceId: 'a-4', // Shuttle Van
      bookedBy: 'e-5', // Raj Patel
      start: getTomorrowAt(10),
      end: getTomorrowAt(12),
      status: 'Upcoming',
      notes: 'Client Airport Pickup'
    }
  ];

  const initialMaintenance = [
    {
      id: 'm-1',
      assetId: 'a-6', // iPhone 15 Pro
      description: 'Battery drains completely within 2 hours of moderate usage.',
      priority: 'High',
      status: 'Approved',
      technician: 'TechSupport - Mike',
      raisedBy: 'e-6', // Lisa
      raisedDate: '2026-07-10',
      resolvedDate: null,
      notes: 'Waiting for replacement OEM battery shipment.'
    },
    {
      id: 'm-2',
      assetId: 'a-1', // MacBook Pro
      description: 'Screen flickering occasionally when opening the lid beyond 90 degrees.',
      priority: 'Medium',
      status: 'Pending',
      technician: null,
      raisedBy: 'e-2', // Priya
      raisedDate: '2026-07-11',
      resolvedDate: null,
      notes: ''
    }
  ];

  const initialAudits = [
    {
      id: 'au-1',
      name: 'IT Lab General Q2 Audit',
      scopeType: 'location',
      scopeValue: 'IT Lab',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      auditors: ['e-2'], // Priya
      status: 'closed',
      checkedAssets: {
        'a-1': 'Verified',
        'a-2': 'Verified',
        'a-6': 'Damaged'
      },
      discrepancyReport: [
        { assetId: 'a-6', assetTag: 'AF-0006', name: 'iPhone 15 Pro', issue: 'Damaged - physical degradation' }
      ]
    },
    {
      id: 'au-2',
      name: 'HR Department Mid-Year Check',
      scopeType: 'department',
      scopeValue: 'd-4', // HR
      startDate: '2026-07-12',
      endDate: '2026-07-15',
      auditors: ['e-4'], // Sarah
      status: 'open',
      checkedAssets: {
        'a-7': 'Verified'
      },
      discrepancyReport: []
    }
  ];

  const initialNotifications = [
    { id: 'n-1', title: 'Asset Allocated', text: 'Dell XPS 15 (AF-0002) has been allocated to Raj Patel', type: 'info', read: false, time: '2026-06-01T10:00:00.000Z' },
    { id: 'n-2', title: 'Maintenance Approved', text: 'Maintenance request for iPhone 15 Pro (AF-0006) was approved by Priya Sharma', type: 'warning', read: false, time: '2026-07-10T14:30:00.000Z' },
    { id: 'n-3', title: 'Asset Return Overdue', text: 'Dell XPS 15 (AF-0002) return date (2026-07-10) is overdue.', type: 'danger', read: false, time: '2026-07-11T08:00:00.000Z' }
  ];

  const initialLogs = [
    { id: 'l-1', action: 'System Initialized', details: 'Database seeded with default enterprise configuration.', user: 'System', time: '2026-07-12T00:00:00.000Z' },
    { id: 'l-2', action: 'Employee Directory Setup', details: 'Imported 8 employees into database.', user: 'Super Admin', time: '2026-07-12T00:05:00.000Z' },
    { id: 'l-3', action: 'Asset Registered', details: 'MacBook Pro 16" (AF-0001) registered by Asset Manager Priya Sharma.', user: 'Priya Sharma', time: '2026-07-12T01:10:00.000Z' }
  ];

  // --- STATE ---
  const [departments, setDepartments] = useState(() => getStorageItem('af_departments', initialDepartments));
  const [employees, setEmployees] = useState(() => getStorageItem('af_employees', initialEmployees));
  const [categories, setCategories] = useState(() => getStorageItem('af_categories', initialCategories));
  const [assets, setAssets] = useState(() => getStorageItem('af_assets', initialAssets));
  const [allocations, setAllocations] = useState(() => getStorageItem('af_allocations', initialAllocations));
  const [bookings, setBookings] = useState(() => getStorageItem('af_bookings', initialBookings));
  const [maintenance, setMaintenance] = useState(() => getStorageItem('af_maintenance', initialMaintenance));
  const [audits, setAudits] = useState(() => getStorageItem('af_audits', initialAudits));
  const [notifications, setNotifications] = useState(() => getStorageItem('af_notifications', initialNotifications));
  const [logs, setLogs] = useState(() => getStorageItem('af_logs', initialLogs));

  const [currentUser, setCurrentUser] = useState(() => {
    // One-time session cache reset to push active developers to the login screen
    if (localStorage.getItem('af_session_reset_v1') !== 'true') {
      localStorage.removeItem('af_current_user');
      localStorage.setItem('af_session_reset_v1', 'true');
    }

    const saved = localStorage.getItem('af_current_user');
    try {
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {
      console.error(e);
    }
    return null; // Start with no user logged in
  });

  // Save state updates to localStorage
  useEffect(() => { localStorage.setItem('af_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('af_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('af_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('af_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('af_allocations', JSON.stringify(allocations)); }, [allocations]);
  useEffect(() => { localStorage.setItem('af_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('af_maintenance', JSON.stringify(maintenance)); }, [maintenance]);
  useEffect(() => { localStorage.setItem('af_audits', JSON.stringify(audits)); }, [audits]);
  useEffect(() => { localStorage.setItem('af_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('af_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('af_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('af_current_user');
  }, [currentUser]);

  // --- ACTIONS ---

  // Log system action
  const logAction = (action, details) => {
    const userName = currentUser ? currentUser.name : 'Guest';
    const newLog = {
      id: `l-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      details,
      user: userName,
      time: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Trigger user notification
  const addNotification = (title, text, type = 'info') => {
    const newNoti = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      text,
      type,
      read: false,
      time: new Date().toISOString()
    };
    setNotifications(prev => [newNoti, ...prev]);
  };

  // Auth Operations
  const handleLogin = (email, password) => {
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.password === password);
    if (!user) return { success: false, message: 'Invalid email or password.' };
    if (user.status === 'Inactive') return { success: false, message: 'Your account is deactivated. Contact Admin.' };
    setCurrentUser(user);
    logAction('User Login', `User ${user.name} logged in.`);
    return { success: true };
  };

  const handleSignup = (name, email, password) => {
    const exists = employees.some(e => e.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, message: 'Email already registered.' };
    const newEmp = {
      id: `e-${Date.now()}`,
      name,
      email,
      password,
      departmentId: '',
      role: 'Employee', // Strict standard Employee
      status: 'Active'
    };
    setEmployees(prev => [...prev, newEmp]);
    setCurrentUser(newEmp);
    logAction('User Signup', `New user registered: ${name} (${email}). Default role: Employee.`);
    addNotification('Welcome to AssetFlow!', `You have signed up as ${name}. Please contact your administrator to set your department and advance roles.`, 'info');
    return { success: true };
  };

  const handleLogout = () => {
    logAction('User Logout', `User ${currentUser?.name} logged out.`);
    setCurrentUser(null);
  };

  // Judge Quick Role Switcher
  const quickSwitchRole = (role) => {
    // Find an employee with this role to assume their identity, or temporarily edit current user role for mock purposes
    const matchedEmployee = employees.find(e => e.role === role && e.status === 'Active');
    if (matchedEmployee) {
      setCurrentUser(matchedEmployee);
      logAction('Judge Role Quick-Switch', `Switched active user to ${matchedEmployee.name} (${role})`);
    } else {
      // If none found (rare), just update the currentUser object's role directly
      setCurrentUser(prev => ({
        ...prev,
        role: role
      }));
      logAction('Judge Role Override', `Overrode current user role to ${role}`);
    }
  };

  // Organization Setup
  const createDepartment = (name, headId, parentId) => {
    if (currentUser?.role !== 'Admin') {
      addNotification('Permission Denied', 'Only Admins can create departments.', 'danger');
      return { success: false, message: 'Only Admins can perform this action.' };
    }
    const newDept = {
      id: `d-${Date.now()}`,
      name,
      headId: headId || null,
      parentId: parentId || null,
      status: 'Active'
    };
    setDepartments(prev => [...prev, newDept]);
    logAction('Create Department', `Department '${name}' created.`);
    return { success: true };
  };

  const editDepartment = (id, name, headId, parentId, status) => {
    if (currentUser?.role !== 'Admin') {
      addNotification('Permission Denied', 'Only Admins can modify departments.', 'danger');
      return { success: false, message: 'Only Admins can perform this action.' };
    }
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, name, headId: headId || null, parentId: parentId || null, status } : d));
    logAction('Modify Department', `Department '${name}' modified. Status: ${status}.`);
    return { success: true };
  };

  const createCategory = (name, customFields) => {
    if (currentUser?.role !== 'Admin') {
      addNotification('Permission Denied', 'Only Admins can create categories.', 'danger');
      return { success: false, message: 'Only Admins can perform this action.' };
    }
    const newCat = {
      id: `c-${Date.now()}`,
      name,
      fields: customFields // array of {name, type, required}
    };
    setCategories(prev => [...prev, newCat]);
    logAction('Create Asset Category', `Category '${name}' created.`);
    return { success: true };
  };

  const editCategory = (id, name, customFields) => {
    if (currentUser?.role !== 'Admin') {
      addNotification('Permission Denied', 'Only Admins can modify categories.', 'danger');
      return { success: false, message: 'Only Admins can perform this action.' };
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, fields: customFields } : c));
    logAction('Modify Asset Category', `Category '${name}' updated.`);
    return { success: true };
  };

  const updateEmployeeRoleAndDept = (employeeId, role, departmentId, status) => {
    if (currentUser?.role !== 'Admin') {
      addNotification('Permission Denied', 'Only Admins can edit employee access.', 'danger');
      return { success: false, message: 'Only Admins can perform this action.' };
    }
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, role, departmentId, status } : e));
    const empName = employees.find(e => e.id === employeeId)?.name || 'Employee';
    logAction('Update Employee Details', `Employee '${empName}' updated: Role -> ${role}, Department -> ${departmentId}, Status -> ${status}.`);
    
    // Auto sync current user if editing self
    if (currentUser && currentUser.id === employeeId) {
      setCurrentUser(prev => ({ ...prev, role, departmentId, status }));
    }
    return { success: true };
  };

  // Asset Directory Operations
  const registerAsset = (assetData) => {
    // Auto-generate tag (find max current digit)
    const tags = assets.map(a => parseInt(a.tag.split('-')[1]) || 0);
    const maxDigit = tags.length > 0 ? Math.max(...tags) : 0;
    const nextTag = `AF-${String(maxDigit + 1).padStart(4, '0')}`;

    const newAsset = {
      id: `a-${Date.now()}`,
      tag: nextTag,
      ...assetData,
      status: 'Available'
    };
    setAssets(prev => [...prev, newAsset]);
    logAction('Register Asset', `Registered new asset: ${assetData.name} with Tag: ${nextTag}.`);
    addNotification('New Asset Registered', `Asset ${assetData.name} (${nextTag}) is now available in inventory.`, 'success');
  };

  const editAssetDetails = (id, assetData) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...assetData } : a));
    logAction('Modify Asset', `Asset '${assetData.name}' (${id}) details updated.`);
  };

  const deleteAsset = (id) => {
    const asset = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    logAction('Remove Asset', `Asset '${asset?.name}' (${asset?.tag}) removed from system.`);
  };

  // Asset Allocations and Returns
  const allocateAsset = (assetId, targetId, targetType, expectedReturnDate, notes) => {
    // Check conflicts
    const activeAllocation = allocations.find(al => al.assetId === assetId && al.status === 'active');
    const asset = assets.find(a => a.id === assetId);

    if (activeAllocation) {
      const currentHolder = employees.find(e => e.id === activeAllocation.assignedTo)?.name 
        || departments.find(d => d.id === activeAllocation.assignedTo)?.name 
        || 'Another entity';
      return { success: false, holder: currentHolder, allocationId: activeAllocation.id };
    }

    const newAlloc = {
      id: `al-${Date.now()}`,
      assetId,
      assignedTo: targetId,
      type: targetType,
      assignedDate: new Date().toISOString().split('T')[0],
      expectedReturn: expectedReturnDate || null,
      actualReturn: null,
      status: 'active',
      notes
    };

    setAllocations(prev => [...prev, newAlloc]);
    // Set asset state to Allocated
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'Allocated' } : a));

    const targetName = targetType === 'employee' 
      ? employees.find(e => e.id === targetId)?.name 
      : departments.find(d => d.id === targetId)?.name;

    logAction('Allocate Asset', `Allocated asset '${asset?.name}' (${asset?.tag}) to ${targetType} '${targetName}'.`);
    addNotification('Asset Allocated', `Asset ${asset?.tag} assigned to ${targetName}.`, 'info');
    return { success: true };
  };

  const requestTransfer = (assetId, targetEmployeeId, notes) => {
    // Find active allocation to initiate transfer request
    const activeAlloc = allocations.find(al => al.assetId === assetId && al.status === 'active');
    if (!activeAlloc) return { success: false, message: 'Asset is not currently allocated.' };

    // Update allocation to state 'transfer_requested' and save target ID + notes
    setAllocations(prev => prev.map(al => al.id === activeAlloc.id 
      ? { ...al, status: 'transfer_requested', transferTarget: targetEmployeeId, transferNotes: notes } 
      : al
    ));

    const asset = assets.find(a => a.id === assetId);
    const targetName = employees.find(e => e.id === targetEmployeeId)?.name || 'Employee';

    logAction('Request Asset Transfer', `Transfer requested for asset '${asset?.name}' (${asset?.tag}) to '${targetName}'.`);
    addNotification('Transfer Requested', `Transfer request submitted for ${asset?.tag} to ${targetName}.`, 'warning');
    return { success: true };
  };

  const approveTransfer = (allocationId) => {
    const alloc = allocations.find(al => al.id === allocationId);
    if (!alloc || alloc.status !== 'transfer_requested') return { success: false, message: 'No active transfer request found.' };

    const targetEmployeeId = alloc.transferTarget;
    const targetName = employees.find(e => e.id === targetEmployeeId)?.name || 'Employee';
    const asset = assets.find(a => a.id === alloc.assetId);

    // Complete the current allocation by returning it, and create a brand new active allocation
    setAllocations(prev => {
      // 1. Close current
      const updated = prev.map(al => al.id === allocationId 
        ? { ...al, status: 'returned', actualReturn: new Date().toISOString().split('T')[0], returnNotes: 'Transferred ownership.' } 
        : al
      );
      // 2. Add new
      const newAlloc = {
        id: `al-${Date.now()}`,
        assetId: alloc.assetId,
        assignedTo: targetEmployeeId,
        type: 'employee',
        assignedDate: new Date().toISOString().split('T')[0],
        expectedReturn: null,
        actualReturn: null,
        status: 'active',
        notes: `Transferred from previous allocation. ${alloc.transferNotes || ''}`
      };
      return [...updated, newAlloc];
    });

    logAction('Approve Asset Transfer', `Approved transfer of asset '${asset?.name}' (${asset?.tag}) to '${targetName}'.`);
    addNotification('Transfer Approved', `Asset ${asset?.tag} has been successfully transferred to ${targetName}.`, 'success');
    return { success: true };
  };

  const rejectTransfer = (allocationId) => {
    setAllocations(prev => prev.map(al => al.id === allocationId 
      ? { ...al, status: 'active', transferTarget: undefined, transferNotes: undefined } 
      : al
    ));
    logAction('Reject Asset Transfer', `Rejected transfer request for allocation ${allocationId}.`);
  };

  const returnAsset = (assetId, checkInNotes, condition) => {
    const activeAlloc = allocations.find(al => al.assetId === assetId && (al.status === 'active' || al.status === 'transfer_requested'));
    if (!activeAlloc) return { success: false, message: 'Asset is not allocated.' };

    // Update allocation record
    setAllocations(prev => prev.map(al => al.id === activeAlloc.id 
      ? { ...al, status: 'returned', actualReturn: new Date().toISOString().split('T')[0], returnNotes: checkInNotes } 
      : al
    ));

    // Update asset details
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'Available', condition } : a));

    const asset = assets.find(a => a.id === assetId);
    logAction('Return Asset', `Returned asset '${asset?.name}' (${asset?.tag}). Condition: ${condition}. Notes: ${checkInNotes}`);
    addNotification('Asset Returned', `Asset ${asset?.tag} is now Available.`, 'success');
    return { success: true };
  };

  // Resource Booking
  const checkBookingOverlap = (resourceId, startStr, endStr, excludeId = null) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    return bookings
      .filter(b => b.resourceId === resourceId && b.status !== 'Cancelled' && b.id !== excludeId)
      .some(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return (start < bEnd && end > bStart); // Overlap formula
      });
  };

  const bookResource = (resourceId, start, end, notes) => {
    const overlap = checkBookingOverlap(resourceId, start, end);
    if (overlap) return { success: false, message: 'Double-booking conflict! The requested time slot overlaps with an existing booking.' };

    const newBooking = {
      id: `b-${Date.now()}`,
      resourceId,
      bookedBy: currentUser.id,
      start,
      end,
      status: 'Upcoming',
      notes
    };

    setBookings(prev => [newBooking, ...prev]);
    const resourceName = assets.find(a => a.id === resourceId)?.name || 'Resource';
    logAction('Book Shared Resource', `Booked resource '${resourceName}' from ${start.replace('T', ' ')} to ${end.replace('T', ' ')}.`);
    addNotification('Booking Confirmed', `Booking confirmed for ${resourceName}.`, 'success');
    return { success: true };
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
    const b = bookings.find(x => x.id === bookingId);
    const resourceName = assets.find(a => a.id === b?.resourceId)?.name || 'Resource';
    logAction('Cancel Resource Booking', `Cancelled booking for '${resourceName}'.`);
    addNotification('Booking Cancelled', `Your booking for ${resourceName} was cancelled.`, 'info');
  };

  const rescheduleBooking = (bookingId, start, end) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b) return { success: false, message: 'Booking not found.' };

    const overlap = checkBookingOverlap(b.resourceId, start, end, bookingId); // Exclude current bookingId!
    if (overlap) return { success: false, message: 'Overlap conflict! The rescheduled slot overlaps with an existing booking.' };

    setBookings(prev => prev.map(x => x.id === bookingId ? { ...x, start, end, status: 'Upcoming' } : x));
    const resourceName = assets.find(r => r.id === b.resourceId)?.name || 'Resource';
    logAction('Reschedule Booking', `Rescheduled booking for '${resourceName}' to start at ${start.replace('T', ' ')}.`);
    addNotification('Booking Rescheduled', `Rescheduled booking for ${resourceName}.`, 'success');
    return { success: true };
  };

  // Maintenance Management
  const raiseMaintenanceTicket = (assetId, description, priority) => {
    const newTicket = {
      id: `m-${Date.now()}`,
      assetId,
      description,
      priority,
      status: 'Pending',
      technician: null,
      raisedBy: currentUser.id,
      raisedDate: new Date().toISOString().split('T')[0],
      resolvedDate: null,
      notes: ''
    };

    setMaintenance(prev => [newTicket, ...prev]);
    const asset = assets.find(a => a.id === assetId);
    logAction('Raise Maintenance', `Maintenance ticket raised for '${asset?.name}' (${asset?.tag}). Issue: ${description}`);
    addNotification('Maintenance Ticket Filed', `Ticket submitted for ${asset?.tag}. Status: Pending approval.`, 'warning');
  };

  const updateMaintenanceStatus = (ticketId, status, additionalData = {}) => {
    setMaintenance(prev => prev.map(t => {
      if (t.id !== ticketId) return t;

      const updatedTicket = { ...t, status, ...additionalData };
      if (status === 'Resolved') {
        updatedTicket.resolvedDate = new Date().toISOString().split('T')[0];
      }
      return updatedTicket;
    }));

    const ticket = maintenance.find(t => t.id === ticketId);
    const asset = assets.find(a => a.id === ticket?.assetId);

    // Sync Asset status automatically
    if (status === 'Approved') {
      setAssets(prev => prev.map(a => a.id === ticket.assetId ? { ...a, status: 'Under Maintenance' } : a));
      logAction('Approve Repair Work', `Approved repair work for '${asset?.name}' (${asset?.tag}). Status set to Under Maintenance.`);
      addNotification('Maintenance Approved', `Repair approved for ${asset?.tag}. Under Maintenance.`, 'warning');
    } else if (status === 'Rejected') {
      logAction('Reject Repair Work', `Rejected maintenance ticket for '${asset?.name}' (${asset?.tag}).`);
      addNotification('Maintenance Rejected', `Repair ticket rejected for ${asset?.tag}.`, 'neutral');
    } else if (status === 'Resolved') {
      setAssets(prev => prev.map(a => a.id === ticket.assetId ? { ...a, status: 'Available' } : a));
      logAction('Resolve Maintenance', `Maintenance resolved for '${asset?.name}' (${asset?.tag}). Asset returned to Available.`);
      addNotification('Maintenance Resolved', `Asset ${asset?.tag} is now fully repaired and Available.`, 'success');
    } else {
      logAction('Update Repair Work', `Maintenance status for ticket ${ticketId} updated to ${status}.`);
    }
  };

  // Asset Auditing
  const createAuditCycle = (name, scopeType, scopeValue, dateRange, auditorIds) => {
    // Collect scoped assets
    const scopedAssets = assets.filter(a => {
      if (scopeType === 'department') {
        // Find if asset is allocated to this department or employee of this department
        const alloc = allocations.find(al => al.assetId === a.id && al.status === 'active');
        if (!alloc) return false;
        if (alloc.type === 'department' && alloc.assignedTo === scopeValue) return true;
        if (alloc.type === 'employee') {
          const emp = employees.find(e => e.id === alloc.assignedTo);
          return emp && emp.departmentId === scopeValue;
        }
        return false;
      } else if (scopeType === 'location') {
        return a.location.toLowerCase() === scopeValue.toLowerCase();
      }
      return true;
    });

    const assetCheckInit = {};
    scopedAssets.forEach(a => {
      assetCheckInit[a.id] = 'Unchecked';
    });

    const newAudit = {
      id: `au-${Date.now()}`,
      name,
      scopeType,
      scopeValue,
      startDate: dateRange.start || new Date().toISOString().split('T')[0],
      endDate: dateRange.end || '',
      auditors: auditorIds,
      status: 'open',
      checkedAssets: assetCheckInit,
      discrepancyReport: []
    };

    setAudits(prev => [newAudit, ...prev]);
    logAction('Create Audit Cycle', `Created audit cycle '${name}' targeting ${scopeType}: ${scopeValue}.`);
    addNotification('Audit Cycle Opened', `New audit '${name}' is now open. Auditors assigned.`, 'info');
  };

  const checkAuditAsset = (auditId, assetId, checkStatus) => {
    setAudits(prev => prev.map(au => {
      if (au.id !== auditId) return au;

      const newChecks = { ...au.checkedAssets, [assetId]: checkStatus };

      // Rebuild discrepancy list
      const discrepancies = [];
      Object.keys(newChecks).forEach(aId => {
        const status = newChecks[aId];
        if (status === 'Missing' || status === 'Damaged') {
          const asset = assets.find(x => x.id === aId);
          discrepancies.push({
            assetId: aId,
            assetTag: asset?.tag || 'N/A',
            name: asset?.name || 'Unknown',
            issue: `${status} during verification`
          });
        }
      });

      return {
        ...au,
        checkedAssets: newChecks,
        discrepancyReport: discrepancies
      };
    }));
  };

  const closeAuditCycle = (auditId) => {
    const audit = audits.find(au => au.id === auditId);
    if (!audit) return;

    setAudits(prev => prev.map(au => au.id === auditId ? { ...au, status: 'closed' } : au));

    // For any assets marked Missing, update status to Lost
    const missingAssetIds = Object.keys(audit.checkedAssets).filter(aId => audit.checkedAssets[aId] === 'Missing');
    if (missingAssetIds.length > 0) {
      setAssets(prev => prev.map(a => missingAssetIds.includes(a.id) ? { ...a, status: 'Lost' } : a));
    }

    logAction('Close Audit Cycle', `Closed audit cycle '${audit.name}'. ${missingAssetIds.length} assets updated to Lost status.`);
    addNotification('Audit Cycle Closed', `Audit '${audit.name}' completed. Discrepancy report archived.`, 'success');
  };

  // Mark all notifications as read
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper selectors
  const getAssetAllocationHistory = (assetId) => {
    return allocations
      .filter(al => al.assetId === assetId)
      .map(al => {
        const holderName = al.type === 'employee'
          ? employees.find(e => e.id === al.assignedTo)?.name
          : departments.find(d => d.id === al.assignedTo)?.name;
        return {
          ...al,
          holderName: holderName || 'Unknown'
        };
      })
      .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
  };

  const getAssetMaintenanceHistory = (assetId) => {
    return maintenance
      .filter(m => m.assetId === assetId)
      .map(m => {
        const technicianText = m.technician || 'Not assigned';
        return {
          ...m,
          technicianText
        };
      })
      .sort((a, b) => b.raisedDate.localeCompare(a.raisedDate));
  };

  return (
    <AppContext.Provider value={{
      // Data
      departments,
      employees,
      categories,
      assets,
      allocations,
      bookings,
      maintenance,
      audits,
      notifications,
      logs,
      currentUser,

      // Auth Functions
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
      quickSwitchRole,

      // Org Setup Functions
      createDepartment,
      editDepartment,
      createCategory,
      editCategory,
      updateEmployeeRoleAndDept,

      // Asset Functions
      registerAsset,
      editAssetDetails,
      deleteAsset,

      // Allocation Functions
      allocateAsset,
      requestTransfer,
      approveTransfer,
      rejectTransfer,
      returnAsset,

      // Booking Functions
      bookResource,
      cancelBooking,
      rescheduleBooking,
      checkBookingOverlap,

      // Maintenance Functions
      raiseMaintenanceTicket,
      updateMaintenanceStatus,

      // Audit Functions
      createAuditCycle,
      checkAuditAsset,
      closeAuditCycle,

      // Notifications/Log helper
      markNotificationsAsRead,
      logAction,
      
      // Selectors
      getAssetAllocationHistory,
      getAssetMaintenanceHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};
