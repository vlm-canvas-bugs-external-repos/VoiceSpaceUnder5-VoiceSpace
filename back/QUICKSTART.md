# QUICKSTART

## Changes Made

1. **Removed `package-lock.json`**: 
   - Before running any installations, the `package-lock.json` file was deleted to resolve dependency issues.

2. **Updated `.env.development`**:
   - Changed the Socket.IO URLs from HTTPS to HTTP to match the server setup:
     ```plaintext
     REACT_APP_SOCKET_URL=http://localhost:8080
     REACT_APP_SOCKET_URL_BACKUP=http://localhost:8080
     REACT_APP_IS_DEV=true
     ```

## Steps to Run the Project

1. **Open Terminal Tab 1 (Backend)**:
   - Navigate to the `back` directory:
     ```bash
     cd VoiceSpaceUnder5-VoiceSpace/back
     ```
   - Use Node.js version 14:
     ```bash
     nvm use 14
     ```
   - Install backend dependencies:
     ```bash
     npm install
     ```
   - Start the backend server:
     ```bash
     npm run start:dev
     ```

2. **Open Terminal Tab 2 (Frontend)**:
   - Navigate to the `front` directory:
     ```bash
     cd VoiceSpaceUnder5-VoiceSpace/front
     ```
   - Use Node.js version 14:
     ```bash
     nvm use 14
     ```
   - Install frontend dependencies:
     ```bash
     npm install
     ```
   - Start the frontend server:
     ```bash
     npm run start
     ```

3. **Access the Application**:
   - Open your web browser and go to:
     ```plaintext
     http://localhost:3000
     ```

