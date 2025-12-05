// mobile-app/src/screens/DashboardScreen.js - Main dashboard screen
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Avatar,
  Surface,
  Divider,
  IconButton
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { authService } from '../services/authService';
import moment from 'moment';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { getCurrentLocation, isLoading: locationLoading } = useLocation();
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await authService.getDashboardStats();
      if (response.success) {
        setTodayStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      let location = null;
      
      // Try to get location
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.log('Location not available, continuing without it');
      }

      const response = await authService.clockIn(location);
      
      if (response.success) {
        setAttendanceStatus('clocked-in');
        Alert.alert('Success', 'Clocked in successfully!');
        await loadDashboardData();
      } else {
        Alert.alert('Error', response.message || 'Failed to clock in');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clock in. Please try again.');
      console.error('Clock in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      let location = null;
      
      // Try to get location
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.log('Location not available, continuing without it');
      }

      const response = await authService.clockOut(location);
      
      if (response.success) {
        setAttendanceStatus('clocked-out');
        Alert.alert('Success', 'Clocked out successfully!');
        await loadDashboardData();
      } else {
        Alert.alert('Error', response.message || 'Failed to clock out');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clock out. Please try again.');
      console.error('Clock out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date) => {
    return moment(date).format('HH:mm');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={50}
            label={user?.name?.charAt(0)?.toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </Surface>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleClockIn}
              disabled={isLoading || attendanceStatus === 'clocked-in'}
              loading={isLoading && attendanceStatus !== 'clocked-out'}
              style={[styles.actionButton, styles.clockInButton]}
              icon="login"
            >
              Clock In
            </Button>
            
            <Button
              mode="contained"
              onPress={handleClockOut}
              disabled={isLoading || attendanceStatus === 'clocked-out'}
              loading={isLoading && attendanceStatus === 'clocked-out'}
              style={[styles.actionButton, styles.clockOutButton]}
              icon="logout"
            >
              Clock Out
            </Button>
          </View>

          {locationLoading && (
            <View style={styles.locationLoading}>
              <ActivityIndicator size="small" />
              <Text style={styles.locationText}>Getting location...</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Today's Summary */}
      <Card style={styles.summaryCard}>
        <Card.Title title="Today's Summary" />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayStats?.presentToday || 0}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayStats?.absentToday || 0}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {todayStats?.pendingLeaves || 0}
              </Text>
              <Text style={styles.statLabel}>Leave Requests</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Current Status */}
      <Card style={styles.statusCard}>
        <Card.Title title="Your Status" />
        <Card.Content>
          <View style={styles.statusRow}>
            <IconButton
              icon={attendanceStatus === 'clocked-in' ? 'check-circle' : 'clock'}
              size={24}
              color={attendanceStatus === 'clocked-in' ? 'green' : 'orange'}
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {attendanceStatus === 'clocked-in' ? 'Clocked In' : 'Not Clocked In'}
              </Text>
              <Text style={styles.statusTime}>
                {attendanceStatus === 'clocked-in' 
                  ? `Since ${formatTime(new Date())}` 
                  : 'Tap Clock In to start your day'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <Card style={styles.statsCard}>
        <Card.Title title="This Month" />
        <Card.Content>
          <View style={styles.monthlyStats}>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>
                {todayStats?.totalHoursThisMonth || '0.00'}h
              </Text>
              <Text style={styles.monthlyStatLabel}>Total Hours</Text>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>
                {todayStats?.avgHoursPerDay || '0.00'}h
              </Text>
              <Text style={styles.monthlyStatLabel}>Avg/Day</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    marginBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
    backgroundColor: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 2,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userRole: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
  },
  quickActionsCard: {
    margin: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 0.48,
  },
  clockInButton: {
    backgroundColor: '#4CAF50',
  },
  clockOutButton: {
    backgroundColor: '#f44336',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  locationText: {
    marginLeft: 10,
    color: '#666',
  },
  summaryCard: {
    margin: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    margin: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    marginLeft: 10,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusTime: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    margin: 10,
    marginBottom: 20,
  },
  monthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  monthlyStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  monthlyStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  verticalDivider: {
    height: 40,
    width: 1,
    backgroundColor: '#e0e0e0',
  },
});