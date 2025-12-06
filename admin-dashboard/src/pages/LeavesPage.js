// admin-dashboard/src/pages/LeavesPage.js - Leave management page
import React, { useState, useEffect } from 'react';
import {
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Box
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Download
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('pending');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  const { hasRole } = useAuth();

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  const loadLeaves = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter
      };

      const response = await authService.getPendingLeaves(params);
      if (response.success) {
        setLeaves(response.leaves);
      }
    } catch (error) {
      toast.error('Failed to load leave requests');
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setDialogOpen(true);
  };

  const handleApprovalDialog = (leave, action) => {
    setSelectedLeave(leave);
    setApprovalAction(action);
    setApprovalComments('');
    setApprovalDialogOpen(true);
  };

  const handleApproveLeave = async () => {
    if (!selectedLeave) return;

    try {
      const response = await authService.approveLeave(
        selectedLeave.id,
        approvalAction,
        approvalComments
      );

      if (response.success) {
        toast.success(`Leave request ${approvalAction} successfully`);
        await loadLeaves();
        setApprovalDialogOpen(false);
        setDialogOpen(false);
      } else {
        toast.error(response.message || 'Failed to process leave request');
      }
    } catch (error) {
      toast.error('Failed to process leave request');
      console.error('Error processing leave:', error);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        format: 'csv'
      };

      const response = await authService.exportLeaveReport(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Leave report exported successfully');
    } catch (error) {
      toast.error('Failed to export leave report');
      console.error('Error exporting leave report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getLeaveTypeIcon = (type) => {
    switch (type) {
      case 'annual': return '🏖️';
      case 'sick': return '🏥';
      case 'personal': return '👤';
      case 'maternity': return '👶';
      case 'paternity': return '👶';
      case 'bereavement': return '🕯️';
      case 'unpaid': return '💰';
      default: return '📅';
    }
  };

  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

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
        <Typography variant="h4">Leave Management</Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Status Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="h6">Filter by Status:</Typography>
            </Grid>
            <Grid item>
              <Chip
                label="Pending"
                color="warning"
                variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('pending')}
                sx={{ mr: 1 }}
              />
              <Chip
                label="Approved"
                color="success"
                variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('approved')}
                sx={{ mr: 1 }}
              />
              <Chip
                label="Rejected"
                color="error"
                variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('rejected')}
                sx={{ mr: 1 }}
              />
              <Chip
                label="All"
                variant={statusFilter === '' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('')}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {statusFilter ? `${statusFilter.toUpperCase()} Leave Requests` : 'All Leave Requests'}
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {leave.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {leave.user.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {leave.user.department || 'No Department'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {getLeaveTypeIcon(leave.leaveType)}
                        </Typography>
                        <Typography variant="body2">
                          {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(leave.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.requestedAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleViewDetails(leave)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <Visibility />
                      </IconButton>

                      {leave.status === 'pending' && hasRole(['admin', 'manager']) && (
                        <>
                          <IconButton
                            onClick={() => handleApprovalDialog(leave, 'approved')}
                            size="small"
                            color="success"
                            sx={{ mr: 1 }}
                          >
                            <CheckCircle />
                          </IconButton>
                          <IconButton
                            onClick={() => handleApprovalDialog(leave, 'rejected')}
                            size="small"
                            color="error"
                          >
                            <Cancel />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {leaves.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No leave requests found
              </Typography>
            </Box>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={leaves.length}
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

      {/* Leave Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Leave Request Details
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ mr: 2 }}>
                    {selectedLeave.user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedLeave.user.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedLeave.user.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedLeave.user.department || 'No Department'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Leave Type
                </Typography>
                <Typography variant="h6">
                  {getLeaveTypeIcon(selectedLeave.leaveType)} {selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLeave.status.toUpperCase()}
                  color={getStatusColor(selectedLeave.status)}
                  sx={{ mt: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Start Date
                </Typography>
                <Typography variant="h6">
                  {format(new Date(selectedLeave.startDate), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  End Date
                </Typography>
                <Typography variant="h6">
                  {format(new Date(selectedLeave.endDate), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Days
                </Typography>
                <Typography variant="h6">
                  {selectedLeave.totalDays} day{selectedLeave.totalDays !== 1 ? 's' : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Requested Date
                </Typography>
                <Typography variant="h6">
                  {format(new Date(selectedLeave.requestedAt), 'MMMM d, yyyy HH:mm')}
                </Typography>
              </Grid>

              {selectedLeave.approvedAt && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {selectedLeave.status === 'approved' ? 'Approved' : 'Processed'} Date
                  </Typography>
                  <Typography variant="h6">
                    {format(new Date(selectedLeave.approvedAt), 'MMMM d, yyyy HH:mm')}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Reason
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {selectedLeave.reason}
                </Typography>
              </Grid>

              {selectedLeave.comments && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Comments
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedLeave.comments}
                  </Typography>
                </Grid>
              )}

              {selectedLeave.attachment && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Attachment
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedLeave.attachment}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedLeave?.status === 'pending' && hasRole(['admin', 'manager']) && (
            <>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  handleApprovalDialog(selectedLeave, 'rejected');
                }}
                color="error"
                variant="outlined"
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  handleApprovalDialog(selectedLeave, 'approved');
                }}
                color="success"
                variant="contained"
              >
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder={`Provide reason for ${approvalAction}...`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApproveLeave}
            color={approvalAction === 'approved' ? 'success' : 'error'}
            variant="contained"
          >
            {approvalAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}