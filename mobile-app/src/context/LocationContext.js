// mobile-app/src/context/LocationContext.js - Location tracking context
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext({});

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return false;
      }
      
      return true;
    } catch (error) {
      setLocationError('Error requesting location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setLocationError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      };

      // Get address if possible
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (address) {
          locationData.address = `${address.name || ''} ${address.street || ''}, ${address.city || ''}`;
        }
      } catch (reverseError) {
        console.log('Could not get address:', reverseError);
      }

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      setLocationError(error.message || 'Error getting location');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      // This would be used for continuous tracking if needed
      // For now, we'll just get the current location
      return await getCurrentLocation();
    } catch (error) {
      setLocationError(error.message || 'Error starting location tracking');
      throw error;
    }
  };

  const value = {
    currentLocation,
    locationError,
    isLoading,
    getCurrentLocation,
    startLocationTracking,
    requestLocationPermission
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};