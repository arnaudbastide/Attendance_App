// admin-dashboard/src/pages/DashboardPage.js - Dashboard page with analytics
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  People,
  AccessTime,
  BeachAccess,
  TrendingUp,
  EventAvailable,
  EventBusy
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ClockInOutButton from '../components/ClockInOutButton';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const { subscribeToAttendanceUpdates } = useSocket();

  useEffect(() => {
    loadDashboardData();

    const unsubscribe = subscribeToAttendanceUpdates((newItem) => {
      setRecentActivity(prev => [newItem, ...prev].slice(0, 10));
      // Optionally reload all stats to keep counters in sync
      loadDashboardData();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToAttendanceUpdates]);

  const loadDashboardData = async () => {
    try {
      const response = await authService.getDashboardStats();
      if (response.success) {
        setDashboardData(response.stats);
        setRecentActivity(response.recentActivities || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const attendanceData = [
    { name: 'Present', value: dashboardData?.presentToday || 0, color: '#4caf50' },
    { name: 'Absent', value: dashboardData?.absentToday || 0, color: '#f44336' },
  ];

  const monthlyData = dashboardData?.monthlyChartData || [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Clock In/Out Button */}
      <Box sx={{ mb: 3 }}>
        <ClockInOutButton />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {hasRole(['admin', 'manager']) && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Employees"
              value={dashboardData?.totalEmployees || 0}
              icon={<People fontSize="large" />}
              color="primary"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present Today"
            value={dashboardData?.presentToday || 0}
            icon={<EventAvailable fontSize="large" />}
            color="success"
            subtitle={`${dashboardData?.attendanceRate || 0}% attendance rate`}
          />
        </Grid>

        {hasRole(['admin', 'manager']) && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Absent Today"
              value={dashboardData?.absentToday || 0}
              icon={<EventBusy fontSize="large" />}
              color="error"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Leave Requests"
            value={dashboardData?.pendingLeaves || 0}
            icon={<BeachAccess fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Hours Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6200ee" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Attendance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
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

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {recentActivity.length === 0 ? (
                <Typography color="textSecondary">
                  No recent activity
                </Typography>
              ) : (
                <List>
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            {activity.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${activity.user?.name} - ${activity.status}`}
                          secondary={format(new Date(activity.clockIn || activity.requestedAt), 'MMM d, yyyy HH:mm')}
                        />
                      </ListItem>
                      {index < recentActivity.slice(0, 5).length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Total Hours This Month
                </Typography>
                <Typography variant="h5" color="primary">
                  {dashboardData?.totalHoursThisMonth || 0}h
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Average Hours Per Day
                </Typography>
                <Typography variant="h5" color="secondary">
                  {dashboardData?.avgHoursPerDay || 0}h
                </Typography>
              </Box>

              {hasRole(['admin', 'manager']) && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Attendance Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(dashboardData?.attendanceRate || 0)}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {dashboardData?.attendanceRate || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}