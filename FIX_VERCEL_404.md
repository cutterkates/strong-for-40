# Fix Vercel 404 Error - Step by Step

## 🚨 You're Getting: 404: NOT_FOUND

This means Vercel deployed but can't find the files. Here's how to fix it:

---

## ✅ Solution 1: Deploy Pre-Built Folder (Fastest)

This bypasses all build issues by deploying already-built files.

### Step 1: Build Locally

```bash
cd strong-for-40
npm install
npm run build:web
```

**Verify the build worked:**
```bash
ls dist/
# Should see: index.html, static/, manifest.json, etc.
```

**If you see these files, the build worked!**

### Step 2: Test Locally First

```bash
npx serve dist
```

Visit `http://localhost:3000` - does the app work? If yes, continue!

### Step 3: Deploy ONLY the dist Folder

**Option A: Vercel CLI**
```bash
cd dist
vercel --prod
```

Follow prompts:
- Project name: `strong-for-40`
- Accept defaults

**Option B: Vercel Website**
1. Go to vercel.com
2. Click "Add New..." → "Project"
3. **DRAG ONLY the `dist` folder** (not the whole project!)
4. Deploy

### Step 4: Add Environment Variables

In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   ```
   EXPO_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
   ```
3. Click "Redeploy"

**This should work!** If not, continue to Solution 2.

---

## ✅ Solution 2: Fix Build Settings in Vercel

If you deployed from GitHub, fix the build configuration:

### Step 1: Update Vercel Settings

1. Go to vercel.com → Your project
2. Click **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Click **Edit**

### Step 2: Set These EXACT Values

```
Framework Preset: Other
Root Directory: ./
Build Command: npm run build:web
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x
```

**IMPORTANT:** 
- Check "Override" for Build Command ✅
- Check "Override" for Output Directory ✅

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** (with latest commit)
3. Wait 2-3 minutes

---

## ✅ Solution 3: Add vercel.json Config File

If above doesn't work, add config file to your project:

### Step 1: Create vercel.json

In your project root, create `vercel.json`:

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Push to GitHub

```bash
git add vercel.json
git commit -m "Add Vercel config"
git push
```

Vercel will auto-redeploy with correct settings.

---

## ✅ Solution 4: Start Fresh (Nuclear Option)

If nothing works, create a new deployment:

### Step 1: Delete Current Project

1. Go to vercel.com → Your project
2. Settings → General → Delete Project
3. Confirm

### Step 2: Build Locally

```bash
cd strong-for-40
rm -rf dist node_modules
npm install
npm run build:web
```

### Step 3: Deploy Fresh

```bash
cd dist
vercel --prod
```

When prompted:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** strong-for-40-new
- **Directory?** ./

### Step 4: Add Environment Variables

```bash
vercel env add EXPO_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL

vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key

vercel --prod
```

---

## 🔍 Diagnostic: What's Wrong?

### Check #1: Did the Build Run?

Look at your Vercel deployment logs:
1. Go to Deployments tab
2. Click latest deployment
3. Click "Building" or "View Function Logs"

**Look for:**
```
✓ Compiled successfully
Creating an optimized production build...
```

**If you see:**
```
✗ Failed to compile
```
→ Build failed. Check error messages.

### Check #2: Is dist Empty?

In deployment logs, look for:
```
Build Completed in dist
```

**If dist is empty:**
→ Build command didn't run correctly

### Check #3: Are Environment Variables Set?

1. Settings → Environment Variables
2. Should see:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**If missing:**
→ Add them and redeploy

---

## 📋 Checklist Before Deployment

### Local Build Works?
```bash
cd strong-for-40
npm install
npm run build:web
ls dist/index.html  # Should exist
npx serve dist      # Should open app
```

### Vercel Settings Correct?
```
✓ Build Command: npm run build:web
✓ Output Directory: dist
✓ Framework: Other (or blank)
✓ Node version: 18.x
```

### Environment Variables Set?
```
✓ EXPO_PUBLIC_SUPABASE_URL
✓ EXPO_PUBLIC_SUPABASE_ANON_KEY
✓ Applied to: Production
```

### Files in Project?
```
✓ package.json exists
✓ app/ folder exists
✓ lib/ folder exists
✓ vercel.json exists (optional but helpful)
```

---

## 🎯 Recommended Approach

**Try this order:**

1. **Deploy pre-built folder** (Solution 1)
   - Fastest and most reliable
   - Bypasses all build issues
   - 5 minutes

2. **Fix Vercel settings** (Solution 2)
   - If deploying from GitHub
   - 5 minutes

3. **Add vercel.json** (Solution 3)
   - If settings UI doesn't stick
   - 2 minutes

4. **Start fresh** (Solution 4)
   - Last resort
   - 10 minutes

---

## 🆘 Still Not Working?

### Send Me:

1. **Deployment URL** (the one showing 404)
2. **Build logs** (from Vercel deployment page)
3. **Screenshot of Vercel Build Settings**

### Common Gotchas:

❌ **Deployed wrong folder**
→ Must deploy `dist`, not `strong-for-40`

❌ **Build command wrong**
→ Must be `npm run build:web`, not `npm run build`

❌ **Output directory wrong**
→ Must be `dist`, not `build` or `dist`

❌ **Framework set wrong**
→ Must be `Other` or blank, not Next.js

❌ **No index.html**
→ Build failed, check logs

---

## ✅ Success Looks Like:

When it works, you'll see:
1. Vercel URL loads (not 404)
2. Login screen appears
3. Can sign up
4. See standards after signup

**Then you're done!** 🎉

---

## 💡 Pro Tip: Use Netlify Instead?

If Vercel keeps failing, try Netlify (works the same way):

```bash
cd strong-for-40
npm run build:web
cd dist
npm install -g netlify-cli
netlify deploy --prod
```

Or just drag `dist` folder to netlify.com

---

**Which solution should we try first?** I recommend **Solution 1** (deploy pre-built folder) - it's the most reliable!
