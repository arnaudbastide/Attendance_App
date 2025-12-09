// admin-dashboard/src/pages/EmployeesPage.js - Employee management page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  PersonAdd,
  Department,
  Work
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [departmentFilter, setDepartmentFilter] = useState('');

  const { user, hasRole } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee',
    managerId: '',
    isActive: true
  });

  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, searchTerm, departmentFilter]);

  useEffect(() => {
    loadDepartments();
    loadManagers();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        search: searchTerm,
        department: departmentFilter
      };

      const response = await authService.getUsers(params);
      if (response.success) {
        setEmployees(response.users);
        setTotalCount(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await authService.getDepartments();
      if (response.success) {
        setDepartments(response.departments);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await authService.getManagers();
      if (response.success) {
        setManagers(response.managers);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddEmployee = () => {
    setDialogMode('add');
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: 'employee',
      managerId: '',
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setDialogMode('edit');
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      role: employee.role || 'employee',
      managerId: employee.managerId || '',
      isActive: employee.isActive !== false
    });
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      if (dialogMode === 'add') {
        // For new employees, we need to register them
        const response = await authService.register({
          ...formData,
          password: 'temp123' // Temporary password
        });

        if (response.success) {
          toast.success('Employee added successfully');
          await loadEmployees();
        } else {
          toast.error(response.message || 'Failed to add employee');
        }
      } else {
        const response = await authService.updateUser(selectedEmployee.id, formData);

        if (response.success) {
          toast.success('Employee updated successfully');
          await loadEmployees();
        } else {
          toast.error(response.message || 'Failed to update employee');
        }
      }

      setDialogOpen(false);
    } catch (error) {
      toast.error('Operation failed');
      console.error('Error submitting form:', error);
    }
  };

  const handleDeactivateEmployee = async (employee) => {
    try {
      const response = await authService.deactivateUser(employee.id);
      if (response.success) {
        toast.success('Employee deactivated successfully');
        await loadEmployees();
      } else {
        toast.error(response.message || 'Failed to deactivate employee');
      }
    } catch (error) {
      toast.error('Failed to deactivate employee');
      console.error('Error deactivating employee:', error);
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'employee': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'default';
      case 'on_leave': return 'info';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'on_leave': return 'On Leave';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on search
  };

  const openMap = (location) => {
    if (!location) return;
    const latitude = location.latitude || (location.coords && location.coords.latitude);
    const longitude = location.longitude || (location.coords && location.coords.longitude);

    // Use looser check for falsy values like 0
    if (latitude != null && longitude != null) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    } else {
      console.log('Invalid coordinates for map:', location);
      toast.error('Invalid location coordinates');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employees</Typography>
        {hasRole(['admin', 'manager']) && (
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleAddEmployee}
          >
            Add Employee
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search employees..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  label="Department"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="body2" color="textSecondary">
              Total: {totalCount} employees
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {employee.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {employee.department || '-'}
                    </TableCell>
                    <TableCell>
                      {employee.position || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(employee.currentStatus)}
                        size="small"
                        color={getStatusColor(employee.currentStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {employee.totalHoursToday || '0h 0m'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {employee.lastLocation ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => openMap(employee.lastLocation)}
                            color="primary"
                            title="View on Map"
                          >
                            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z" />
                            </svg>
                          </IconButton>
                          <Typography variant="caption" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {employee.lastLocation.address || "View Map"}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {hasRole(['admin', 'manager']) && (
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, employee)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Employee' : 'Edit Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={dialogMode === 'edit'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  {hasRole(['admin']) && (
                    <>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>
            {formData.role === 'employee' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    label="Manager"
                  >
                    <MenuItem value="">No Manager</MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                  />
                }
                label="Active Account"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'add' ? 'Add Employee' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditEmployee(selectedEmployee)}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {hasRole(['admin']) && (
          <MenuItem onClick={() => handleDeactivateEmployee(selectedEmployee)}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            {selectedEmployee?.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}