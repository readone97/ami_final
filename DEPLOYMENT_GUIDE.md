# Deployment Guide - Amigo Exchange

This guide covers deploying the Amigo Exchange application to GitHub and Netlify with proper environment variable configuration.

## 🚀 GitHub Setup

### 1. Initialize Git Repository
```bash
cd ami_final
git init
git add .
git commit -m "Initial commit: Amigo Exchange with admin authentication"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `amigo-exchange` (or your preferred name)
3. Don't initialize with README, .gitignore, or license (we already have these)

### 3. Connect Local Repository to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/amigo-exchange.git
git branch -M main
git push -u origin main
```

## 🌐 Netlify Deployment

### 1. Connect Repository to Netlify
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your `amigo-exchange` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18.x (or latest)

### 2. Set Environment Variables in Netlify
1. Go to your site dashboard in Netlify
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add variable** and add:

```
NEXT_PUBLIC_ADMIN_EMAIL = pillartool@gmail.com
NEXT_PUBLIC_ADMIN_PASSWORD = pillartool@97
```

### 3. Deploy
1. Click **Deploy site**
2. Netlify will automatically build and deploy your application
3. Your site will be available at `https://your-site-name.netlify.app`

## 🔐 Environment Variables Security

### Important Security Notes:
- ✅ `.env.local` is in `.gitignore` - won't be committed to GitHub
- ✅ Environment variables are set in Netlify dashboard
- ✅ Only `NEXT_PUBLIC_` prefixed variables are accessible in client-side code
- ⚠️ **Never commit actual credentials to GitHub**

### Environment Variables Used:
```env
NEXT_PUBLIC_ADMIN_EMAIL=pillartool@gmail.com
NEXT_PUBLIC_ADMIN_PASSWORD=pillartool@97
```

## 📁 Project Structure
```
ami_final/
├── .env.local              # Local environment (ignored by git)
├── .gitignore              # Git ignore rules
├── DEPLOYMENT_GUIDE.md     # This guide
├── app/
│   └── admin/              # Admin authentication system
│       ├── login/          # Admin login page
│       └── dashboard/      # Protected admin dashboard
└── context/
    └── admin-auth-context.tsx  # Admin authentication logic
```

## 🔧 Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌍 Production URLs
- **Main App**: `https://your-site-name.netlify.app`
- **Admin Login**: `https://your-site-name.netlify.app/admin`
- **Admin Dashboard**: `https://your-site-name.netlify.app/admin/dashboard`

## 🛠️ Troubleshooting

### Environment Variables Not Loading
1. Ensure variables are prefixed with `NEXT_PUBLIC_`
2. Restart the development server after adding variables
3. Check Netlify environment variables are set correctly

### Build Failures
1. Check Node.js version compatibility
2. Ensure all dependencies are in `package.json`
3. Check build logs in Netlify dashboard

### Admin Login Issues
1. Verify environment variables are set correctly
2. Check browser console for errors
3. Ensure credentials match exactly (case-sensitive)

## 📞 Support
If you encounter any issues during deployment, check:
1. Netlify build logs
2. Browser console for client-side errors
3. Environment variable configuration
4. GitHub repository permissions

---

**Note**: This deployment guide assumes you're using the standard Next.js build process. The admin authentication system is fully configured and ready for production deployment.
