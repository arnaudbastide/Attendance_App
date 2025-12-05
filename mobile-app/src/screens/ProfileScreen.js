// mobile-app/src/screens/ProfileScreen.js - User profile screen
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Surface,
  Avatar,
  Divider,
  List,
  ActivityIndicator
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);

    try {
      const result = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        position: formData.position.trim()
      });

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by the auth context
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={user.name?.charAt(0)?.toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{user.role?.toUpperCase()}</Text>
          </View>
        </View>
      </Surface>

      {/* Profile Information */}
      <Card style={styles.profileCard}>
        <Card.Title 
          title="Profile Information" 
          right={() => (
            <Button
              mode="text"
              onPress={() => setIsEditing(!isEditing)}
              textColor="#6200ee"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        />
        <Card.Content>
          <List.Item
            title="Full Name"
            description={isEditing ? (
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={styles.input}
                disabled={saving}
              />
            ) : (
              user.name
            )}
            left={props => <List.Icon {...props} icon="account" />}
          />

          <List.Item
            title="Email Address"
            description={isEditing ? (
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={saving}
              />
            ) : (
              user.email
            )}
            left={props => <List.Icon {...props} icon="email" />}
          />

          <List.Item
            title="Phone Number"
            description={isEditing ? (
              <TextInput
                mode="outlined"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                style={styles.input}
                keyboardType="phone-pad"
                disabled={saving}
              />
            ) : (
              user.phone || 'Not provided'
            )}
            left={props => <List.Icon {...props} icon="phone" />}
          />

          <List.Item
            title="Department"
            description={isEditing ? (
              <TextInput
                mode="outlined"
                value={formData.department}
                onChangeText={(text) => handleInputChange('department', text)}
                style={styles.input}
                disabled={saving}
              />
            ) : (
              user.department || 'Not specified'
            )}
            left={props => <List.Icon {...props} icon="office-building" />}
          />

          <List.Item
            title="Position"
            description={isEditing ? (
              <TextInput
                mode="outlined"
                value={formData.position}
                onChangeText={(text) => handleInputChange('position', text)}
                style={styles.input}
                disabled={saving}
              />
            ) : (
              user.position || 'Not specified'
            )}
            left={props => <List.Icon {...props} icon="briefcase" />}
          />

          {isEditing && (
            <View style={styles.saveButtonContainer}>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              >
                Save Changes
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Account Information */}
      <Card style={styles.accountCard}>
        <Card.Title title="Account Information" />
        <Card.Content>
          <List.Item
            title="Account Status"
            description={user.isActive ? 'Active' : 'Inactive'}
            left={props => (
              <List.Icon 
                {...props} 
                icon={user.isActive ? "check-circle" : "close-circle"}
                color={user.isActive ? "#4CAF50" : "#f44336"}
              />
            )}
          />

          <List.Item
            title="Last Login"
            description={formatDate(user.lastLogin)}
            left={props => <List.Icon {...props} icon="clock" />}
          />

          <List.Item
            title="Member Since"
            description={formatDate(user.createdAt)}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.actionsCard}>
        <Card.Title title="Actions" />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            textColor="#f44336"
          >
            Sign Out
          </Button>
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
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 20,
    backgroundColor: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
  profileCard: {
    margin: 10,
    marginTop: 20,
  },
  input: {
    marginTop: 5,
    backgroundColor: '#ffffff',
  },
  saveButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    minWidth: 200,
  },
  accountCard: {
    margin: 10,
  },
  actionsCard: {
    margin: 10,
    marginBottom: 20,
  },
  logoutButton: {
    borderColor: '#f44336',
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
});