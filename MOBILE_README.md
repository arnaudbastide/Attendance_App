# Mobile App Setup Guide

The mobile app is built with **React Native (Expo)**.

## Prerequisites
- Node.js installed (you have this).
- A smartphone with **Expo Go** app installed (Android/iOS) OR an Android Emulator/iOS Simulator.
- Your computer and phone must be on the **same Wi-Fi network**.

## Configuration
I have already updated `mobile-app/src/services/authService.js` to use your computer's local IP address:
```javascript
const API_BASE_URL = 'http://192.168.1.10:5000/api';
```
*If your IP address changes (e.g., you switch networks), you will need to update this file.*

## How to Run
1. Open a terminal in the `mobile-app` directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies (first time only):
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npx expo start
   ```

4. **Testing on Phone**:
   - Scan the QR code shown in the terminal with your phone's Camera (iOS) or Expo Go app (Android).
   - The app will load on your device.

5. **Testing on Emulator**:
   - Press `a` in the terminal to open on Android Emulator.
   - Press `i` in the terminal to open on iOS Simulator (Mac only).

## Troubleshooting
- **No QR Code?**: If the QR code doesn't appear, you can enter the URL manually in the Expo Go app.
  - URL: `exp://192.168.1.10:8081`
- **Connection Issues?**: If LAN connection fails (common on Windows due to Firewall), try Tunnel Mode:
  1. Stop the current server (`Ctrl + C`).
  2. Run: `npx expo start --tunnel`
  3. Scan the new QR code or enter the new URL (it will start with `exp://u.expo.dev...`).
- **"Network request failed"**: Check if your phone and PC are on the same Wi-Fi. Check if Windows Firewall is blocking Node.js (Allow Access if prompted).
- **Backend Connection**: Ensure the backend server is running (`node server.js` in `backend` folder).

## Advanced: Fixing Windows Firewall (Best Solution)
If you have Admin rights, run this in a **PowerShell (Run as Administrator)** window to fix the connection permanently:
```powershell
New-NetFirewallRule -DisplayName "Node Backend 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Expo Server 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
```
After running this, you can use the standard `npx expo start` command without tunnels.
