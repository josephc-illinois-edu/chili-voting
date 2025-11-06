# Deployment Guide - Chili Voting App to Vercel

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. **Repository name**: `chili-voting` (or any name you prefer)
3. **Description**: "Chili Cook-Off Voting System for UIF 2025"
4. **Visibility**: Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
cd "C:\Users\josephc\Documents\chili-voting"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/chili-voting.git

# Push code
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

If prompted for credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Get one at: https://github.com/settings/tokens
  - Select: `repo` scope
  - Copy the token and use it as password

## Step 3: Deploy to Vercel

### Option A: Using Vercel Website (Recommended)

1. Go to https://vercel.com
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Click **"Import Project"** or **"Add New Project"**
5. Click **"Import Git Repository"**
6. Find your `chili-voting` repository and click **"Import"**

### Project Configuration

Vercel will auto-detect Next.js. Keep these defaults:
- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: Leave empty (auto-detected)

### Add Environment Variables

Click **"Environment Variables"** and add these:

| Name | Value | Where to Find It |
|------|-------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `chili2025!` | Or choose your own password |
| `NEXT_PUBLIC_EVENT_NAME` | `UIF Chili Cook-Off 2025` | Optional: Your event name |
| `NEXT_PUBLIC_EVENT_DATE` | `November 19, 2025` | Optional: Your event date |
| `NEXT_PUBLIC_EVENT_TIME` | `11:00 AM – 1:30 PM` | Optional: Your event time |

**Important Notes:**
- Get Supabase credentials from: https://app.supabase.com → Your Project → Settings → API
- Copy the **Project URL** and **anon/public key**
- The anon key is safe to expose publicly (it's already in your `.env.local`)

### Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see "🎉 Congratulations! Your project has been successfully deployed."
4. Click **"Visit"** to see your live site!

## Step 4: Get Your Live URL

Your app will be live at: `https://your-project-name.vercel.app`

Example: `https://chili-voting.vercel.app`

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Test the voting flow:
   - Create a chili entry in admin panel
   - Vote for it
   - Check results page
   - Try the QR code generation

## Step 6: Add Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `chili.yourdomain.com`)
4. Follow DNS configuration instructions
5. SSL certificate auto-generates (free!)

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Double-check you added all environment variables in Vercel
- Go to: Project Settings → Environment Variables

**Error: Build timeout**
- Solution: Usually resolves on retry. Click "Redeploy" button.

### App Works Locally But Not on Vercel

**Issue: Supabase connection fails**
- Check environment variables are set correctly
- Verify Supabase URL doesn't have trailing slash
- Make sure RLS policies are set up (check TESTING_GUIDE.md)

**Issue: Admin password doesn't work**
- Verify `NEXT_PUBLIC_ADMIN_PASSWORD` is set in Vercel
- Try redeploying after adding the variable

### QR Codes Don't Work

**Issue: QR codes link to localhost**
- QR codes are generated with the current domain
- In production, they'll automatically use your Vercel URL
- Regenerate QR codes after deployment

## Redeploying Updates

Whenever you make changes:

```bash
# Commit changes
git add .
git commit -m "Description of changes"
git push

# Vercel auto-deploys on push!
```

Vercel automatically deploys every time you push to GitHub. No manual steps needed!

## Monitoring Your Deployment

- **Logs**: Vercel Dashboard → Your Project → Deployments → Click deployment → Logs
- **Analytics**: Available in Vercel dashboard (free tier included)
- **Errors**: Check Runtime Logs if something breaks

## Production Checklist

Before your event:
- [ ] Test all features on production URL
- [ ] Create test chili entries
- [ ] Vote from mobile device
- [ ] Verify QR codes work
- [ ] Check results page updates
- [ ] Test admin panel access
- [ ] Print QR code tent cards with production URL
- [ ] Test on different devices (iPhone, Android, tablets)
- [ ] Share production URL with event organizers
- [ ] Set up display screen for live results

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Create an issue in your repository

## Cost

Everything is FREE:
- Vercel: 100GB bandwidth, unlimited projects
- Supabase: 500MB database, 50K API requests/month
- GitHub: Unlimited public/private repos

Your chili event will easily fit within free tiers! 🎉
