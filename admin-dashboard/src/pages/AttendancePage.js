// admin-dashboard/src/pages/AttendancePage.js - Attendance management page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Edit,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { hasRole } = useAuth();

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        startDate: dateRange.startDate || '2020-01-01',
        endDate: dateRange.endDate || '2030-12-31'
      };

      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await authService.getTeamAttendance(params);
      if (response.success) {
        setAttendanceData(response.attendances);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load attendance data';
      toast.error(errorMsg);
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
    loadAttendanceData();
  };

  const handleExport = async () => {
    try {
      const params = {
        startDate: dateRange.startDate || '2020-01-01',
        endDate: dateRange.endDate || '2030-12-31',
        format: 'csv'
      };

      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await authService.exportAttendanceReport(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Attendance report exported successfully');
    } catch (error) {
      toast.error('Failed to export attendance report');
      console.error('Error exporting attendance report:', error);
    }
  };

  const handleViewDetails = (attendance) => {
    setSelectedAttendance(attendance);
    setSelectedEmployee(attendance.user);
    setDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'early_leave': return 'warning';
      case 'on_leave': return 'info';
      default: return 'default';
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = !searchTerm ||
      record.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Attendance Management</Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="early_leave">Early Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                variant="outlined"
                size="small"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                variant="outlined"
                size="small"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                variant="contained"
                onClick={handleFilterChange}
                fullWidth
                size="small"
              >
                <FilterList />
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Clock In</TableCell>
                  <TableCell>Clock Out</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {record.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {record.user.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {record.user.department || 'No Department'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {record.clockIn ? format(new Date(record.clockIn), 'HH:mm') : '--:--'}
                    </TableCell>
                    <TableCell>
                      {record.clockOut ? format(new Date(record.clockOut), 'HH:mm') : '--:--'}
                    </TableCell>
                    <TableCell>
                      {formatDuration(record.totalHours)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(record.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleViewDetails(record)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredAttendance.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No attendance records found
              </Typography>
            </Box>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAttendance.length}
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

      {/* Attendance Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Attendance Details
        </DialogTitle>
        <DialogContent>
          {selectedAttendance && selectedEmployee && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedEmployee.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedEmployee.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="h6">
                  {format(new Date(selectedAttendance.date), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedAttendance.status.toUpperCase()}
                  color={getStatusColor(selectedAttendance.status)}
                  sx={{ mt: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Clock In
                </Typography>
                <Typography variant="h6">
                  {selectedAttendance.clockIn ? format(new Date(selectedAttendance.clockIn), 'HH:mm:ss') : '--:--:--'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Clock Out
                </Typography>
                <Typography variant="h6">
                  {selectedAttendance.clockOut ? format(new Date(selectedAttendance.clockOut), 'HH:mm:ss') : '--:--:--'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Hours
                </Typography>
                <Typography variant="h6">
                  {formatDuration(selectedAttendance.totalHours)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Overtime Hours
                </Typography>
                <Typography variant="h6">
                  {formatDuration(selectedAttendance.overtimeHours || 0)}
                </Typography>
              </Grid>

              {selectedAttendance.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedAttendance.notes}
                  </Typography>
                </Grid>
              )}

              {selectedAttendance.breaks && selectedAttendance.breaks.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Breaks
                  </Typography>
                  {selectedAttendance.breaks.map((breakItem, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {breakItem.breakType}: {formatDuration(breakItem.totalBreakTime || 0)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(breakItem.breakStart), 'HH:mm')} -
                        {breakItem.breakEnd ? format(new Date(breakItem.breakEnd), 'HH:mm') : 'Active'}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}