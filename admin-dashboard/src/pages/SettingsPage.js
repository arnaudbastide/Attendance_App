// admin-dashboard/src/pages/SettingsPage.js - System settings page
import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save,
  Security,
  Notifications,
  Business,
  AccessTime,
  Email
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { hasRole } = useAuth();

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Roc4Tech',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    
    // Attendance Settings
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateThreshold: 15, // minutes
    earlyLeaveThreshold: 15, // minutes
    overtimeThreshold: 8, // hours
    
    // Leave Settings
    annualLeaveDays: 21,
    sickLeaveDays: 10,
    personalLeaveDays: 5,
    leaveApprovalRequired: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    dailyReportEmail: true,
    weeklyReportEmail: false,
    
    // Security Settings
    passwordExpiryDays: 90,
    sessionTimeout: 30, // minutes
    twoFactorAuth: false,
    ipRestriction: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSave = async (section) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const SettingSection = ({ title, icon, children }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  if (!hasRole(['admin'])) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="error">
          You don't have permission to access this page
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Configure your attendance management system settings
      </Typography>

      {/* General Settings */}
      <SettingSection title="General Settings" icon={<Business />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={settings.companyName}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                name="timezone"
                value={settings.timezone}
                onChange={handleInputChange}
                label="Timezone"
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="EST">EST</MenuItem>
                <MenuItem value="PST">PST</MenuItem>
                <MenuItem value="GMT">GMT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Date Format</InputLabel>
              <Select
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleInputChange}
                label="Date Format"
              >
                <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Format</InputLabel>
              <Select
                name="timeFormat"
                value={settings.timeFormat}
                onChange={handleInputChange}
                label="Time Format"
              >
                <MenuItem value="12h">12 Hour</MenuItem>
                <MenuItem value="24h">24 Hour</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSave('General')}
            disabled={loading}
          >
            Save General Settings
          </Button>
        </Box>
      </SettingSection>

      {/* Attendance Settings */}
      <SettingSection title="Attendance Settings" icon={<AccessTime />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Work Start Time"
              name="workStartTime"
              type="time"
              value={settings.workStartTime}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Work End Time"
              name="workEndTime"
              type="time"
              value={settings.workEndTime}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Late Threshold (minutes)"
              name="lateThreshold"
              type="number"
              value={settings.lateThreshold}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Early Leave Threshold (minutes)"
              name="earlyLeaveThreshold"
              type="number"
              value={settings.earlyLeaveThreshold}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Overtime Threshold (hours)"
              name="overtimeThreshold"
              type="number"
              value={settings.overtimeThreshold}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
        </Grid>
        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSave('Attendance')}
            disabled={loading}
          >
            Save Attendance Settings
          </Button>
        </Box>
      </SettingSection>

      {/* Leave Settings */}
      <SettingSection title="Leave Settings" icon={<AccessTime />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Annual Leave Days"
              name="annualLeaveDays"
              type="number"
              value={settings.annualLeaveDays}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sick Leave Days"
              name="sickLeaveDays"
              type="number"
              value={settings.sickLeaveDays}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Personal Leave Days"
              name="personalLeaveDays"
              type="number"
              value={settings.personalLeaveDays}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="leaveApprovalRequired"
                  checked={settings.leaveApprovalRequired}
                  onChange={handleSwitchChange}
                />
              }
              label="Leave Approval Required"
            />
          </Grid>
        </Grid>
        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSave('Leave')}
            disabled={loading}
          >
            Save Leave Settings
          </Button>
        </Box>
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title="Notification Settings" icon={<Notifications />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleSwitchChange}
                />
              }
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={handleSwitchChange}
                />
              }
              label="Push Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="dailyReportEmail"
                  checked={settings.dailyReportEmail}
                  onChange={handleSwitchChange}
                />
              }
              label="Daily Report Email"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="weeklyReportEmail"
                  checked={settings.weeklyReportEmail}
                  onChange={handleSwitchChange}
                />
              }
              label="Weekly Report Email"
            />
          </Grid>
        </Grid>
        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSave('Notification')}
            disabled={loading}
          >
            Save Notification Settings
          </Button>
        </Box>
      </SettingSection>

      {/* Security Settings */}
      <SettingSection title="Security Settings" icon={<Security />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Password Expiry Days"
              name="passwordExpiryDays"
              type="number"
              value={settings.passwordExpiryDays}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Session Timeout (minutes)"
              name="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onChange={handleSwitchChange}
                />
              }
              label="Two-Factor Authentication"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  name="ipRestriction"
                  checked={settings.ipRestriction}
                  onChange={handleSwitchChange}
                />
              }
              label="IP Address Restriction"
            />
          </Grid>
        </Grid>
        <Box mt={3} textAlign="right">
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={() => handleSave('Security')}
            disabled={loading}
          >
            Save Security Settings
          </Button>
        </Box>
      </SettingSection>
    </Box>
  );
}