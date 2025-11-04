# naor amar - Barber Shop App

## App Configuration

### Business Details
- **Business**: naor amar
- **Owner**: naor amar
- **Email**: naor895@gmail.com
- **Phone**: 0532706369
- **Address**: היובל 1

### App Info
- **App Name**: NAOR AMAR
- **Bundle ID**: com.naoramar.app
- **Firebase Project**: 17391cbc
- **Language**: he
- **Workers**: 1

### Services
- תספורת מלאה

### Messaging Setup
- **SMS4Free**: ✅ Enabled
- **WhatsApp**: ❌ Disabled

## Quick Setup

1. **Firebase Setup**
   ```bash
   # Create Firebase project: 17391cbc
   # Add your google-services.json and GoogleService-Info.plist
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Build & Deploy**
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

## Environment Variables
Check `.env.example` for all required environment variables including:
- Firebase configuration
- SMS4Free credentials (if enabled)  
- WhatsApp API credentials (if enabled)

## Contact
naor amar - naor895@gmail.com
