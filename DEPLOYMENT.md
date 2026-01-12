# Deployment Guide - Strong for 40

This guide covers deploying your app to production for iOS and Android.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install with `npm install -g eas-cli`
3. **Apple Developer Account** (for iOS): $99/year
4. **Google Play Developer Account** (for Android): $25 one-time
5. **Supabase Production Project**: Separate from development

## Step 1: Configure EAS

### Initialize EAS

```bash
cd strong-for-40
eas login
eas build:configure
```

This creates `eas.json` in your project root.

### Update `eas.json`

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-preview-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-preview-key"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-production-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-key"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 2: Set Up Production Supabase

### Create Production Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (name: `strong-for-40-prod`)
3. Choose a strong password
4. Select production region (closest to your users)
5. Wait for provisioning

### Run Migration

1. Go to SQL Editor in production project
2. Run `supabase-migration.sql`
3. Verify all tables created

### Update Environment Variables

Add production credentials to `eas.json` (see above).

## Step 3: Update App Configuration

### Update `app.json`

```json
{
  "expo": {
    "name": "Strong for 40",
    "slug": "strong-for-40",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.strongfor40",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.yourcompany.strongfor40",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-from-eas"
      }
    }
  }
}
```

### Create App Icons

You need the following assets:

- `assets/icon.png` - 1024x1024 app icon
- `assets/splash.png` - 1284x2778 splash screen
- `assets/adaptive-icon.png` - 1024x1024 Android adaptive icon
- `assets/favicon.png` - 48x48 web favicon

Use a tool like [Figma](https://figma.com) or [Canva](https://canva.com) to create these.

## Step 4: Build for iOS

### Prerequisites

- Apple Developer Account
- iOS Distribution Certificate
- Provisioning Profile

### Build Command

```bash
eas build --platform ios --profile production
```

EAS will:
1. Ask for Apple credentials (first time only)
2. Generate certificates automatically
3. Build your app in the cloud
4. Provide download link when complete

### Download IPA

```bash
eas build:list
```

Find your build and download the `.ipa` file.

## Step 5: Build for Android

```bash
eas build --platform android --profile production
```

EAS will:
1. Build your app in the cloud
2. Generate signed APK/AAB
3. Provide download link

### Download APK/AAB

```bash
eas build:list
```

Download the `.aab` (for Play Store) or `.apk` (for direct distribution).

## Step 6: Submit to App Stores

### iOS - App Store Connect

1. **Create App in App Store Connect**:
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Fill in app information
   - Bundle ID: `com.yourcompany.strongfor40`

2. **Upload Build**:
   ```bash
   eas submit --platform ios --profile production
   ```
   
   Or manually upload the IPA using Xcode's Application Loader.

3. **Configure App Store Listing**:
   - Screenshots (required for iPhone and iPad)
   - App description
   - Keywords
   - Privacy policy URL
   - Support URL

4. **Submit for Review**:
   - Click "Submit for Review"
   - Answer questionnaire
   - Wait 1-3 days for approval

### Android - Google Play Console

1. **Create App in Play Console**:
   - Go to [play.google.com/console](https://play.google.com/console)
   - Click "Create app"
   - Fill in app details
   - Application ID: `com.yourcompany.strongfor40`

2. **Upload Build**:
   ```bash
   eas submit --platform android --profile production
   ```

3. **Configure Store Listing**:
   - Screenshots (phone, tablet, TV)
   - App description (short and long)
   - Privacy policy URL
   - Content rating questionnaire

4. **Set Up Release**:
   - Create production release
   - Upload AAB
   - Add release notes
   - Review and rollout

## Step 7: Over-the-Air (OTA) Updates

EAS Update allows you to push JavaScript/asset updates without app store approval.

### Configure Updates

Add to `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
```

### Publish Update

```bash
eas update --branch production --message "Bug fixes and improvements"
```

Users will get the update next time they open the app.

## Step 8: Monitoring & Analytics

### Sentry (Error Tracking)

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

Add to `app/_layout.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  enableInExpoDevelopment: false,
});
```

### PostHog (Analytics)

```bash
npm install posthog-react-native
```

Add tracking to key screens:

```typescript
import posthog from 'posthog-react-native';

posthog.capture('workout_completed', {
  workout_name: 'Workout A',
  exercises: 7,
});
```

## Production Checklist

Before launching:

- [ ] Run migration on production Supabase
- [ ] Update all production environment variables
- [ ] Create all required app icons and screenshots
- [ ] Test on physical devices (iOS and Android)
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (PostHog or similar)
- [ ] Write privacy policy
- [ ] Write terms of service
- [ ] Create support email/website
- [ ] Test offline functionality
- [ ] Verify RLS policies in Supabase
- [ ] Set up database backups
- [ ] Configure rate limiting if needed
- [ ] Test payment/subscriptions (if applicable)
- [ ] Prepare App Store screenshots and descriptions
- [ ] Beta test with 10-20 users
- [ ] Fix critical bugs from beta
- [ ] Submit to app stores

## Maintenance

### Weekly Tasks

- Monitor Sentry for errors
- Check Supabase usage/costs
- Review user analytics
- Respond to user feedback

### Monthly Tasks

- Review and optimize database queries
- Update dependencies
- Check for security updates
- Analyze user retention metrics

### As Needed

- Push OTA updates for bug fixes
- Submit new versions for major features
- Update app store screenshots/descriptions
- Add new workout programs in database

## Costs Estimate

- **Expo**: Free (EAS builds included in free tier)
- **Supabase**: $0-25/month (free tier → pro tier)
- **Apple Developer**: $99/year
- **Google Play**: $25 one-time
- **Sentry**: Free tier available
- **Domain**: $10-15/year (for privacy policy)

**Total first year**: ~$150-200
**Ongoing yearly**: ~$50-400 (depending on usage)

## Support & Help

- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **EAS Build**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **App Store Guidelines**: [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Play Store Guidelines**: [play.google.com/console/about/guides](https://play.google.com/console/about/guides/)

---

Good luck with your launch! 🚀
