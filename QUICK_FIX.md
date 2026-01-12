# Quick Fix - Corrected Build Commands

## ✅ The Error You Got

```
expo export --platform web can only be used with Webpack
```

This happens because newer Expo versions changed the export command.

---

## 🔧 Fixed Commands

### Build Locally (Corrected)

```bash
cd strong-for-40

# Install dependencies
npm install

# Build for web (CORRECTED COMMAND)
npm run build:web

# This runs: expo export --platform web
# Output goes to: dist/ folder (not dist/)
```

### Verify Build Worked

```bash
ls dist/index.html
# Should show the file
```

### Test Locally

```bash
npx serve dist
```

Visit `http://localhost:3000` - should see your app!

---

## 🚀 Deploy to Vercel

### Option 1: Deploy dist Folder (Easiest)

```bash
cd dist
npx vercel --prod
```

Follow prompts, then add environment variables in Vercel dashboard.

### Option 2: Deploy from GitHub

Push the updated code to GitHub, then in Vercel settings use:

```
Framework Preset: Other
Build Command: npm run build:web
Output Directory: dist
Install Command: npm install
```

The `vercel.json` file will auto-configure this!

---

## 📦 What Changed

**package.json:**
```json
"scripts": {
  "build:web": "expo export --platform web"  // ← Changed
}
```

**vercel.json:**
```json
{
  "outputDirectory": "dist"  // ← Changed from dist
}
```

**Output folder:**
- ❌ Old: `dist/`
- ✅ New: `dist/`

---

## ⚡ Quick Deploy Steps

```bash
# 1. Extract
tar -xzf strong-for-40.tar.gz
cd strong-for-40

# 2. Install & Build
npm install
npm run build:web

# 3. Verify
ls dist/index.html

# 4. Deploy
cd dist
npx vercel --prod

# 5. Add environment variables in Vercel dashboard
# EXPO_PUBLIC_SUPABASE_URL
# EXPO_PUBLIC_SUPABASE_ANON_KEY

# 6. Redeploy if needed
npx vercel --prod
```

---

## ✅ Checklist

- [ ] Extract archive
- [ ] Run `npm install`
- [ ] Run `npm run build:web`
- [ ] Check `dist/index.html` exists
- [ ] Test with `npx serve dist`
- [ ] Deploy `dist` folder to Vercel
- [ ] Add environment variables
- [ ] Visit URL and test

---

**That's it!** The corrected commands should work now.

Let me know if you hit any other errors!
