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
          // Robust de-duplication
          const parts = [
            address.name,
            address.street,
            address.city,
            address.region,
            address.country
          ].filter(Boolean);

          // Use a Set to remove exact duplicates first
          let uniqueParts = [...new Set(parts)];

          // Further cleaning: Remove a part if it is contained within another part 
          // (e.g., "Retauly" in "Retauly, Rieupeyroux" or "Main St" in "123 Main St")
          // BUT be careful: "Paris" is in "Paris Street", but we want both if it's "Paris Street, Paris".
          // The issue "Retauly Retauly" suggests 'name' and 'street' are identical or close.

          const finalParts = [];
          if (address.name) finalParts.push(address.name);
          if (address.street && address.street !== address.name && !address.name.includes(address.street)) {
            finalParts.push(address.street);
          }
          if (address.city && address.city !== address.street && address.city !== address.name) {
            finalParts.push(address.city);
          }

          // Fallback if specific logic missed something or for simple joining
          locationData.address = finalParts.join(', ');

          // If the manual construction is empty or looks weird, fall back to a standard formatter if available,
          // but for now, let's try a cleaner filter.

          // Refined logic based on user report:
          const displayParts = [];

          // 1. Name (often specific place or street number+name)
          if (address.name) displayParts.push(address.name);

          // 2. Street (only if it's not the same as Name and not contained in Name)
          // e.g. Name="123 Main St", Street="Main St" -> Skip Street
          if (address.street && address.street !== address.name) {
            if (!address.name || !address.name.includes(address.street)) {
              displayParts.push(address.street);
            }
          }

          // 3. City
          if (address.city) displayParts.push(address.city);

          locationData.address = displayParts.join(', ');
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