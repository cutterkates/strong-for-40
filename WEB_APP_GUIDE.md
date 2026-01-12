# Strong for 40 - Web App Guide

## 📱 Multi-Platform App

**Good news:** This is a **universal app** that runs on:
- ✅ **Web browsers** (Chrome, Safari, Firefox, Edge)
- ✅ **iOS** (iPhone and iPad)
- ✅ **Android** (phones and tablets)

All from the **same codebase** using Expo!

---

## 🌐 Running as a Web App

### Quick Start

```bash
cd strong-for-40
npm install
npm run web
```

The app will open in your browser at `http://localhost:8081`

### Web-Specific Features

**Browser Compatibility:**
- ✅ Chrome (recommended)
- ✅ Safari
- ✅ Firefox
- ✅ Edge
- ✅ Mobile browsers

**Storage:**
- Uses `localStorage` for offline caching
- Syncs with Supabase when online
- Works offline for 24 hours

**PWA Support:**
Expo web apps can be installed as Progressive Web Apps:
1. Visit your deployed site
2. Click "Install" in browser menu
3. App appears on home screen like native app
4. Works offline

---

## 🚀 Deploying to Web

### Option 1: Vercel (Recommended)

**Free tier available, automatic HTTPS**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Build for web:**
```bash
npx expo export:web
```

3. **Deploy:**
```bash
cd web-build
vercel --prod
```

4. **Custom domain** (optional):
```bash
vercel domains add yourdomain.com
```

**Result:** Your app at `https://strong-for-40.vercel.app`

---

### Option 2: Netlify

**Also free tier with automatic HTTPS**

1. **Build:**
```bash
npx expo export:web
```

2. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

3. **Deploy:**
```bash
cd web-build
netlify deploy --prod
```

Or use Netlify's drag-and-drop: Just drag `web-build` folder to netlify.com

---

### Option 3: Static Hosting (Any Provider)

Works with: GitHub Pages, Cloudflare Pages, AWS S3, DigitalOcean, etc.

1. **Build:**
```bash
npx expo export:web
```

2. **Upload `web-build` folder** to any static host

3. **Configure:**
- Set `index.html` as entry point
- Enable SPA routing (redirect all to index.html)

---

## 🎨 Web-Specific Optimizations

### Responsive Design

The app is **mobile-first** but works on desktop:
- Tablets: 768px+ (iPad)
- Desktop: 1024px+ (laptop/desktop)
- Mobile: <768px (phones)

**Current behavior:**
- Desktop shows mobile layout centered
- All features work on all screen sizes
- Touch and mouse both supported

### Performance

**Bundle size:**
- ~2-3 MB initial load
- Code splitting enabled
- Lazy loading for routes

**Speed:**
- First load: 2-3 seconds
- Cached load: <1 second
- Offline: instant

---

## ✨ New Features Added (v1.2.1)

### Standards Screen (Habits)

**Can now:**
- ✅ Add new standards (was already there)
- ✅ **Delete standards** (NEW!)
- ✅ See all 7 default standards
- ✅ Check off completions
- ✅ View streaks and progress

**How to delete:**
1. Go to Standards tab
2. Each standard has a small red × button
3. Tap × → Confirm deletion
4. Standard is archived (data preserved)

**UI improvements:**
- Delete button (× icon) in top-right of each card
- Confirmation alert before deletion
- Uses `is_active = false` (soft delete, preserves history)

---

## 🖥️ Desktop vs Mobile Experience

### Desktop (Browser)

**Pros:**
- Larger screen for timeline view
- Keyboard shortcuts work
- Can open in multiple tabs
- Copy/paste works well

**Cons:**
- UI designed for mobile (portrait)
- No native notifications
- Requires open browser tab

**Recommended use:**
- Planning your day (timeline view)
- Bulk task creation
- Reviewing stats

### Mobile (Browser or App)

**Pros:**
- Optimized touch interface
- Native notifications (if PWA)
- Home screen icon
- Works offline

**Cons:**
- Smaller screen
- Virtual keyboard takes space

**Recommended use:**
- Quick check-ins
- On-the-go updates
- Habit tracking

---

## 🔧 Web-Specific Settings

### Environment Variables for Web

Create `.env.production`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Security note:**
- Anon key is safe to expose (has RLS protection)
- Never expose service_role key
- Use environment variables for production

### Build Configuration

Edit `app.json` for web:

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "name": "Strong for 40",
      "shortName": "S40",
      "description": "Life OS for productivity and strength",
      "themeColor": "#0F172A",
      "backgroundColor": "#0F172A"
    }
  }
}
```

---

## 📊 Platform Comparison

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Installation | None (URL) | App Store | Play Store |
| Offline | 24hrs cache | Full offline | Full offline |
| Notifications | Limited | Native | Native |
| Performance | Good | Excellent | Excellent |
| Updates | Instant | Review process | Review process |
| Storage | localStorage | AsyncStorage | AsyncStorage |
| Haptics | No | Yes | Yes |

---

## 🎯 Best Practices for Web

### 1. Use HTTPS
Always deploy with HTTPS:
- Vercel/Netlify provide this free
- Required for PWA features
- Protects user data

### 2. Enable PWA
Users can install as app:
- Add to home screen (mobile)
- Install from browser menu (desktop)
- Works offline

### 3. Test All Browsers
Check on:
- Chrome (most common)
- Safari (iOS users)
- Firefox
- Edge

### 4. Mobile-First
Design for mobile, enhance for desktop:
- Touch targets 44×44px minimum
- Responsive breakpoints
- Test on real devices

### 5. Performance
- Minimize bundle size
- Lazy load routes
- Cache API responses
- Use CDN for assets

---

## 🐛 Web-Specific Troubleshooting

### Issue: White screen on load

**Fix:**
```bash
rm -rf node_modules web-build
npm install
npx expo export:web
```

### Issue: Supabase not connecting

**Check:**
1. `.env` file exists
2. Variables start with `EXPO_PUBLIC_`
3. Restart dev server after env changes

### Issue: Offline not working

**Web storage is limited:**
- localStorage: ~10MB max
- Use Supabase for large data
- Cache only essential data

### Issue: Haptics not working

**Expected on web:**
- Haptic feedback is mobile-only
- Web falls back silently
- No impact on functionality

---

## 📱 Converting to Native Apps

### iOS App Store

1. **Build with EAS:**
```bash
eas build --platform ios
```

2. **Submit:**
```bash
eas submit --platform ios
```

3. **Review:** 1-3 days

### Android Play Store

1. **Build:**
```bash
eas build --platform android
```

2. **Submit:**
```bash
eas submit --platform android
```

3. **Review:** Hours to days

### Keep Web + Native

**Best approach:**
- Deploy web version (free, instant updates)
- Submit to app stores (better discoverability)
- Users can choose their preferred platform

---

## 🎁 What Users Get (All Platforms)

### Day 1 (Web or Mobile):
```
Sign up → Auto-configured with:
✅ 7 default standards
✅ 4 life areas
✅ Mon/Wed/Fri workout program
✅ Dark theme
✅ Ready to use immediately
```

### Standards Management:
```
View → Add → Delete
✅ See all standards
✅ Create custom standards
✅ Remove unwanted standards
✅ Track completions
✅ Build streaks
```

### Works Everywhere:
```
Web → iOS → Android
✅ Same data everywhere
✅ Real-time sync
✅ Offline support
✅ Consistent experience
```

---

## 🚀 Deployment Checklist

### Before Deployment:

- [ ] Update `.env` with production Supabase credentials
- [ ] Run `npx expo export:web` to build
- [ ] Test in production-like environment
- [ ] Verify all features work
- [ ] Test on multiple browsers
- [ ] Check mobile responsive view
- [ ] Enable HTTPS
- [ ] Configure custom domain (optional)

### After Deployment:

- [ ] Test signup flow
- [ ] Verify default standards appear
- [ ] Test delete functionality
- [ ] Check offline mode
- [ ] Monitor Supabase usage
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (PostHog)

---

## 💡 Pro Tips

**For best web experience:**

1. **Desktop:** Use Chrome with window width ~400-500px (mobile view)
2. **Mobile:** Install as PWA for app-like experience
3. **Offline:** Works for 24 hours without internet
4. **Updates:** Refresh browser to get latest version
5. **Sync:** Changes sync automatically when online

**Development:**
- Use `npm run web` for local testing
- Hot reload works in browser
- Chrome DevTools for debugging
- Test on real mobile devices

---

## 📚 Additional Resources

**Expo Web:**
- Docs: https://docs.expo.dev/workflow/web/
- PWA: https://docs.expo.dev/guides/progressive-web-apps/

**Deployment:**
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com/

**Supabase:**
- Auth: https://supabase.com/docs/guides/auth
- Database: https://supabase.com/docs/guides/database

---

**Summary:** This app works perfectly as a web app AND can be deployed to iOS/Android app stores. The same code runs everywhere! 🎉
