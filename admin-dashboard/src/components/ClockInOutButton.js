// admin-dashboard/src/components/ClockInOutButton.js - Clock In/Out component
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Chip,
    Alert
} from '@mui/material';
import {
    AccessTime,
    Login as ClockInIcon,
    Logout as ClockOutIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ClockInOutButton() {
    const [status, setStatus] = useState('not_clocked_in');
    const [attendance, setAttendance] = useState(null);
    const [currentHours, setCurrentHours] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStatus();
        // Update current hours every minute if clocked in
        const interval = setInterval(() => {
            if (status === 'clocked_in') {
                fetchStatus();
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [status]);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/attendance/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStatus(response.data.status);
                setAttendance(response.data.attendance);
                setCurrentHours(response.data.currentHours);
            }
        } catch (err) {
            console.error('Error fetching status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockIn = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/attendance/clock-in`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess('Clocked in successfully!');
                fetchStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to clock in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockOut = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/attendance/clock-out`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess(`Clocked out successfully! Total hours: ${response.data.totalHours}h`);
                fetchStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to clock out');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'clocked_in': return 'success';
            case 'clocked_out': return 'default';
            default: return 'warning';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'clocked_in': return 'Clocked In';
            case 'clocked_out': return 'Clocked Out';
            default: return 'Not Clocked In';
        }
    };

    if (isLoading && !attendance) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="large" />
                        <Typography variant="h6">Attendance</Typography>
                    </Box>
                    <Chip
                        label={getStatusText()}
                        color={getStatusColor()}
                        sx={{ fontWeight: 600 }}
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {status === 'clocked_in' && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {currentHours}h
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Hours worked today
                        </Typography>
                    </Box>
                )}

                {status === 'clocked_out' && attendance && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {attendance.totalHours}h
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total hours worked today
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {status !== 'clocked_in' && (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleClockIn}
                            disabled={isLoading || status === 'clocked_out'}
                            startIcon={<ClockInIcon />}
                            sx={{
                                bgcolor: 'white',
                                color: '#667eea',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                },
                                '&:disabled': {
                                    bgcolor: 'rgba(255,255,255,0.3)',
                                    color: 'rgba(255,255,255,0.7)'
                                }
                            }}
                        >
                            Clock In
                        </Button>
                    )}

                    {status === 'clocked_in' && (
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleClockOut}
                            disabled={isLoading}
                            startIcon={<ClockOutIcon />}
                            sx={{
                                bgcolor: 'white',
                                color: '#764ba2',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                }
                            }}
                        >
                            Clock Out
                        </Button>
                    )}
                </Box>

                {attendance && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Clock In: {new Date(attendance.clockIn).toLocaleTimeString()}
                        </Typography>
                        {attendance.clockOut && (
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                                Clock Out: {new Date(attendance.clockOut).toLocaleTimeString()}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
