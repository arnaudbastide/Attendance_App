// mobile-app/src/screens/AttendanceHistoryScreen.js - Attendance history screen
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Surface,
  Chip,
  Divider
} from 'react-native-paper';
import { authService } from '../services/authService';
import moment from 'moment';

export default function AttendanceHistoryScreen() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const currentPage = refresh ? 1 : page;
      const response = await authService.getMyAttendance({
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        if (refresh) {
          setAttendanceData(response.attendances);
          setPage(1);
        } else {
          setAttendanceData(prev => [...prev, ...response.attendances]);
        }
        setHasMore(response.attendances.length === 10);
        setPage(currentPage + 1);
      } else {
        Alert.alert('Error', 'Failed to load attendance history');
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAttendanceHistory(true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore && !refreshing) {
      loadAttendanceHistory();
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#f44336';
      case 'late': return '#ff9800';
      case 'early_leave': return '#ff5722';
      default: return '#9e9e9e';
    }
  };

  const renderAttendanceItem = ({ item }) => (
    <Card style={styles.attendanceCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>
            {moment(item.date).format('MMMM D, YYYY')}
          </Text>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Clock In</Text>
            <Text style={styles.timeValue}>
              {item.clockIn ? moment(item.clockIn).format('HH:mm') : '--:--'}
            </Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Clock Out</Text>
            <Text style={styles.timeValue}>
              {item.clockOut ? moment(item.clockOut).format('HH:mm') : '--:--'}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Total Hours</Text>
            <Text style={styles.timeValue}>
              {formatDuration(item.totalHours)}
            </Text>
          </View>
        </View>

        {item.breaks && item.breaks.length > 0 && (
          <View style={styles.breaksSection}>
            <Text style={styles.breaksTitle}>Breaks</Text>
            {item.breaks.map((breakItem, index) => (
              <View key={index} style={styles.breakItem}>
                <Text style={styles.breakText}>
                  {breakItem.breakType}: {formatDuration(breakItem.totalBreakTime || 0)}
                </Text>
                <Text style={styles.breakTime}>
                  {moment(breakItem.breakStart).format('HH:mm')} - 
                  {breakItem.breakEnd ? moment(breakItem.breakEnd).format('HH:mm') : 'Active'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading && attendanceData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading attendance history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <Text style={styles.headerSubtitle}>
          Your work hours and attendance records
        </Text>
      </Surface>

      <FlatList
        data={attendanceData}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading && attendanceData.length > 0 ? (
            <ActivityIndicator style={styles.loadMoreIndicator} />
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        )}
      />
    </View>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  listContent: {
    padding: 10,
  },
  attendanceCard: {
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    height: 24,
  },
  divider: {
    marginVertical: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  breaksSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  breaksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  breakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakText: {
    fontSize: 14,
    color: '#333',
  },
  breakTime: {
    fontSize: 12,
    color: '#666',
  },
  notesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  loadMoreIndicator: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});