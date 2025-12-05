// mobile-app/src/screens/LeaveRequestScreen.js - Leave request management screen
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
  TextInput,
  Surface,
  Chip,
  Divider,
  Modal,
  Portal,
  FAB,
  ActivityIndicator
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { authService } from '../services/authService';
import moment from 'moment';

const LEAVE_TYPES = [
  { key: 'annual', label: 'Annual Leave', icon: 'beach' },
  { key: 'sick', label: 'Sick Leave', icon: 'hospital' },
  { key: 'personal', label: 'Personal Leave', icon: 'account' },
  { key: 'maternity', label: 'Maternity Leave', icon: 'baby' },
  { key: 'paternity', label: 'Paternity Leave', icon: 'baby' },
  { key: 'bereavement', label: 'Bereavement', icon: 'candle' },
  { key: 'unpaid', label: 'Unpaid Leave', icon: 'cash-remove' }
];

export default function LeaveRequestScreen() {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [selectedLeaveType, setSelectedLeaveType] = useState('annual');
  const [selectedDates, setSelectedDates] = useState({});
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      const [leavesResponse, balanceResponse] = await Promise.all([
        authService.getMyLeaves(),
        authService.getLeaveBalance()
      ]);

      if (leavesResponse.success) {
        setLeaves(leavesResponse.leaves);
      }
      
      if (balanceResponse.success) {
        setLeaveBalance(balanceResponse.leaveBalance);
      }
    } catch (error) {
      console.error('Error loading leave data:', error);
      Alert.alert('Error', 'Failed to load leave data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaveData();
    setRefreshing(false);
  };

  const handleDayPress = (day) => {
    const newSelectedDates = { ...selectedDates };
    
    if (newSelectedDates[day.dateString]) {
      delete newSelectedDates[day.dateString];
    } else {
      newSelectedDates[day.dateString] = {
        selected: true,
        selectedColor: '#6200ee'
      };
    }
    
    setSelectedDates(newSelectedDates);
  };

  const calculateTotalDays = () => {
    const dates = Object.keys(selectedDates);
    if (dates.length === 0) return 0;
    
    const startDate = moment.min(dates.map(d => moment(d)));
    const endDate = moment.max(dates.map(d => moment(d)));
    
    return endDate.diff(startDate, 'days') + 1;
  };

  const handleSubmitLeaveRequest = async () => {
    const dates = Object.keys(selectedDates);
    if (dates.length === 0) {
      Alert.alert('Error', 'Please select at least one date');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your leave');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDate = moment.min(dates.map(d => moment(d))).format('YYYY-MM-DD');
      const endDate = moment.max(dates.map(d => moment(d))).format('YYYY-MM-DD');
      const totalDays = calculateTotalDays();

      const response = await authService.createLeaveRequest({
        leaveType: selectedLeaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason.trim()
      });

      if (response.success) {
        Alert.alert('Success', 'Leave request submitted successfully');
        setModalVisible(false);
        setSelectedDates({});
        setReason('');
        await loadLeaveData();
      } else {
        Alert.alert('Error', response.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      Alert.alert('Error', 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    Alert.alert(
      'Cancel Leave Request',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const response = await authService.cancelLeave(leaveId);
              if (response.success) {
                Alert.alert('Success', 'Leave request cancelled successfully');
                await loadLeaveData();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel leave request');
              }
            } catch (error) {
              console.error('Error cancelling leave:', error);
              Alert.alert('Error', 'Failed to cancel leave request');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'cancelled': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getLeaveTypeIcon = (type) => {
    const leaveType = LEAVE_TYPES.find(t => t.key === type);
    return leaveType ? leaveType.icon : 'calendar';
  };

  const renderLeaveItem = ({ item }) => (
    <Card style={styles.leaveCard}>
      <Card.Content>
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeContainer}>
            <IconButton
              icon={getLeaveTypeIcon(item.leaveType)}
              size={20}
              style={styles.leaveTypeIcon}
            />
            <Text style={styles.leaveType}>
              {LEAVE_TYPES.find(t => t.key === item.leaveType)?.label || item.leaveType}
            </Text>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>
              {moment(item.startDate).format('MMM D, YYYY')}
            </Text>
          </View>
          
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>
              {moment(item.endDate).format('MMM D, YYYY')}
            </Text>
          </View>

          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Total Days</Text>
            <Text style={styles.dateValue}>
              {item.totalDays}
            </Text>
          </View>
        </View>

        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionsSection}>
            <Button
              mode="outlined"
              onPress={() => handleCancelLeave(item.id)}
              style={styles.cancelButton}
              textColor="#f44336"
            >
              Cancel Request
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading leave data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>Leave Management</Text>
        {leaveBalance && (
          <Text style={styles.headerSubtitle}>
            Annual Leave: {leaveBalance.remainingDays} of {leaveBalance.totalAnnualLeave} days remaining
          </Text>
        )}
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leave requests found</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first leave request
            </Text>
          </View>
        ) : (
          leaves.map((leave) => (
            <View key={leave.id}>
              {renderLeaveItem({ item: leave })}
            </View>
          ))
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>New Leave Request</Text>
            
            {/* Leave Type Selection */}
            <Text style={styles.sectionTitle}>Leave Type</Text>
            <View style={styles.leaveTypeGrid}>
              {LEAVE_TYPES.map((type) => (
                <Chip
                  key={type.key}
                  mode={selectedLeaveType === type.key ? 'flat' : 'outlined'}
                  selected={selectedLeaveType === type.key}
                  onPress={() => setSelectedLeaveType(type.key)}
                  style={styles.leaveTypeChip}
                  icon={type.icon}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select Dates</Text>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={selectedDates}
              markingType={'multi-dot'}
              theme={{
                selectedDayBackgroundColor: '#6200ee',
                todayTextColor: '#6200ee',
              }}
            />
            
            {Object.keys(selectedDates).length > 0 && (
              <Text style={styles.selectedDays}>
                Selected: {Object.keys(selectedDates).length} day(s)
              </Text>
            )}

            {/* Reason */}
            <Text style={styles.sectionTitle}>Reason</Text>
            <TextInput
              mode="outlined"
              placeholder="Please provide a reason for your leave request"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              style={styles.reasonInput}
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitLeaveRequest}
                loading={isSubmitting}
                disabled={isSubmitting || Object.keys(selectedDates).length === 0 || !reason.trim()}
                style={styles.modalButton}
              >
                Submit Request
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  scrollContent: {
    padding: 10,
    paddingBottom: 80,
  },
  leaveCard: {
    marginBottom: 10,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveTypeIcon: {
    margin: 0,
    marginRight: 8,
  },
  leaveType: {
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reasonSection: {
    marginTop: 10,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsSection: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  cancelButton: {
    borderColor: '#f44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  leaveTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaveTypeChip: {
    margin: 4,
  },
  selectedDays: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  reasonInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 0.48,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});