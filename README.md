# gal shemesh - Barber Shop App

## App Configuration

### Business Details
- **Business**: gal shemesh
- **Owner**: gal shemesh
- **Email**: Galshemesh76@gmail.com
- **Phone**: 0522210281
- **Address**: החמישה 21 פתח תקווה

### App Info
- **App Name**: Gal Shemesh
- **Bundle ID**: com.galshemesh.app
- **Firebase Project**: 1dd0ee39
- **Language**: he
- **Workers**: 1

### Services
- תספורת וסידור זקן
- ת

### Messaging Setup
- **SMS4Free**: ✅ Enabled
- **WhatsApp**: ❌ Disabled

## Quick Setup

1. **Firebase Setup**
   ```bash
   # Create Firebase project: 1dd0ee39
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
gal shemesh - Galshemesh76@gmail.com
