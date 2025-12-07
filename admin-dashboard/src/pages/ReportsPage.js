// admin-dashboard/src/pages/ReportsPage.js - Reports and analytics page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Chip,
  Avatar
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  GridOn,
  TrendingUp,
  People,
  AccessTime
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [departmentFilter, setDepartmentFilter] = useState('');

  const { hasRole } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await authService.getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      let response;
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      if (departmentFilter) params.department = departmentFilter;

      if (reportType === 'attendance') {
        response = await authService.getAttendanceReport(params);
      } else if (reportType === 'leaves') {
        response = await authService.getLeaveReport(params);
      }

      if (response.success) {
        setReportData(response.report || response);
        if (response.chartData) setChartData(response.chartData);
        if (response.departmentStats) setDeptData(response.departmentStats);
      }
    } catch (error) {
      toast.error('Failed to load report');
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: format
      };

      if (departmentFilter) params.department = departmentFilter;

      let response;
      if (reportType === 'attendance') {
        response = await authService.exportAttendanceReport(params);
      } else if (reportType === 'leaves') {
        response = await authService.exportLeaveReport(params);
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully`);
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    }
  };

  // Dynamic chart data
  const attendanceChartData = chartData;
  const departmentChartData = deptData;

  const leaveTypeChartData = [
    { name: 'Annual', value: 40 },
    { name: 'Sick', value: 25 },
    { name: 'Personal', value: 15 },
    { name: 'Maternity', value: 10 },
    { name: 'Other', value: 10 }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<GridOn />}
            onClick={() => handleExport('csv')}
            sx={{ mr: 1 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Report Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="attendance">Attendance Report</MenuItem>
                  <MenuItem value="leaves">Leave Report</MenuItem>
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

            {hasRole(['admin', 'manager']) && (
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
            )}

            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={loadReport}
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#4caf50" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke="#f44336" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats?.totalEmployees || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </Box>
                <People fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4" color="success">
                    {stats?.attendanceRate || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today
                  </Typography>
                </Box>
                <TrendingUp fontSize="large" color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Hours
                  </Typography>
                  <Typography variant="h4" color="info">
                    {stats?.totalHoursThisMonth || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This month
                  </Typography>
                </Box>
                <AccessTime fontSize="large" color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Leave Requests
                  </Typography>
                  <Typography variant="h4" color="warning">
                    {stats?.pendingLeaves || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending approval
                  </Typography>
                </Box>
                <TrendingUp fontSize="large" color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Report Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {reportType === 'attendance' ? 'Attendance Report' : 'Leave Report'}
          </Typography>

          {reportData && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="center">{reportType === 'attendance' ? 'Present Days' : 'Leave Days'}</TableCell>
                    <TableCell align="center">{reportType === 'attendance' ? 'Absent Days' : 'Leave Type'}</TableCell>
                    <TableCell align="center">{reportType === 'attendance' ? 'Total Hours' : 'Status'}</TableCell>
                    <TableCell align="center">{reportType === 'attendance' ? 'Attendance Rate' : 'Period'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.slice(0, 10).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {record.employee?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body2">
                            {record.employee || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.department || 'No Department'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {reportType === 'attendance' ? record.presentDays : record.totalDays}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {reportType === 'attendance' ? (
                          <Typography variant="body2">{record.absentDays}</Typography>
                        ) : (
                          <Chip
                            label={record.leaveType || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {reportType === 'attendance' ? (
                          <Typography variant="body2">{record.totalHours}h</Typography>
                        ) : (
                          <Chip
                            label={record.status || 'N/A'}
                            size="small"
                            color={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'warning'}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {reportType === 'attendance' ? `${record.attendanceRate}%` : `${record.startDate || ''} - ${record.endDate || ''}`}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!reportData && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                Click "Generate Report" to view detailed report
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}