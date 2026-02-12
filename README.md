# 🚀 New Beginning Outreach - Intake Portal

A production-ready, **beginner-friendly** client intake and tracking system built with Next.js, Tailwind CSS v4, and Supabase.

**Perfect for**: Social services agencies, employment programs, case management, and client tracking.

---

## ⚡ Quick Start (Recommended for Beginners)

**Just run one command and follow the prompts:**

```bash
npm run setup
```

The interactive wizard will:

- ✅ Check your system requirements
- ✅ Install all dependencies automatically
- ✅ Configure your environment
- ✅ Guide you through database setup (if needed)
- ✅ Start the application for you

**That's it!** No technical knowledge required.

---

## 🎮 Two Modes Available

### 1. **Demo Mode** (Recommended for First-Time Users)

- Works **completely offline**
- No database setup required
- Perfect for testing and learning
- Data is temporary (resets on restart)

### 2. **Production Mode** (For Real Deployment)

- Requires free Supabase account
- Data persists in cloud database
- Full authentication and security
- Requires internet connection

The setup wizard will ask which mode you prefer!

---

## 📋 System Requirements

- **Node.js 20+** (Download from [nodejs.org](https://nodejs.org/))
- **2GB RAM** minimum (4GB recommended)
- **Modern browser** (Chrome, Edge, Safari, or Firefox)

**Don't have Node.js?** The setup wizard will tell you!

---

## 🛠️ Manual Installation (Advanced Users)

If you prefer to set up manually:

### 1. Clone the Repository

```bash
git clone https://github.com/KFussell-71/intake-system.git
cd intake-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

**For Demo Mode:**

```bash
echo "NEXT_PUBLIC_ALLOW_MOCK_AUTH=true" > .env.local
echo "NODE_ENV=development" >> .env.local
```

**For Production Mode:**

```bash
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials
```

### 4. Database Setup (Production Mode Only)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (free tier available)
3. Go to SQL Editor
4. Copy contents of `schema.sql` and run it

### 5. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Default Login Credentials (Demo Mode)

```
Email: staff@newbeginning.org
Password: password
```

**Production Mode:** Create your own account on first run.

---

## 📱 Features

### Core Functionality

- ✅ **Client Intake Forms** - Comprehensive data collection
- ✅ **Medical & Psychosocial** - Health history tracking
- ✅ **Employment & Vocational** - Job search and placement
- ✅ **Clinical Observations** - Counselor notes and assessments
- ✅ **Barrier Tracking** - Identify and mitigate employment barriers
- ✅ **Consent Management** - Digital signatures and ROI documents

### AI-Powered Features

- 🤖 **AI Drafting Assistant** - Generate professional narratives
- 🤖 **AI Success Suggestions** - Personalized recommendations
- 🤖 **AI Integrity Review** - Automated compliance checking
- 🤖 **Defensibility Score** - Clinical documentation quality metrics

### Reporting & Analytics

- 📊 **PDF Report Generation** - Professional intake reports
- 📊 **Supervisor Dashboard** - Team performance metrics
- 📊 **Analytics & Charts** - Demographics and trends
- 📊 **Audit Trail** - Complete change history

### Technical Features

- 🔒 **HIPAA Compliant** - Enterprise-grade security
- 📱 **Mobile Responsive** - Works on tablets and phones
- 🌐 **PWA Support** - Install as a native app
- 💾 **Offline Capable** - Works without internet (Demo Mode)
- 🎨 **Modern UI** - Glassmorphism and smooth animations

---

## 📚 Documentation

### For Users

- **[E2E Verification Guide](/.gemini/antigravity/brain/0b266790-c8d8-4262-98e4-5d5b7fd2745c/e2e_verification_guide.md)** - Complete walkthrough
- **[Manual Test Script](/.gemini/antigravity/brain/0b266790-c8d8-4262-98e4-5d5b7fd2745c/manual_test_script.md)** - Testing guide

### For Developers

- **[Developer Journal](/.gemini/antigravity/brain/0b266790-c8d8-4262-98e4-5d5b7fd2745c/developer_journal.md)** - Technical decisions and lessons learned
- **[Task Tracker](/.gemini/antigravity/brain/0b266790-c8d8-4262-98e4-5d5b7fd2745c/task.md)** - Project progress

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

```bash
npm run build
# Deploy to Vercel via their dashboard or CLI
```

### Option 2: Docker

```bash
docker build -t intake-portal .
docker run -p 3000:3000 intake-portal
```

### Option 3: Self-Hosted

```bash
npm run build
npm start
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run CI checks:

```bash
npm run ci:fence
```

---

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Interactive setup wizard |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test` | Run tests |
| `npm run lint` | Check code quality |
| `npm run ci:fence` | Run architectural checks |

---

## 🆘 Troubleshooting

### "Node.js version error"

**Solution:** Install Node.js 20+ from [nodejs.org](https://nodejs.org/)

### "Dependencies failed to install"

**Solution:** Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### "Database connection error"

**Solution:**

- **Demo Mode:** Make sure `.env.local` has `NEXT_PUBLIC_ALLOW_MOCK_AUTH=true`
- **Production Mode:** Verify your Supabase credentials in `.env.local`

### "Port 3000 already in use"

**Solution:** Stop other applications using port 3000, or change the port:

```bash
PORT=3001 npm run dev
```

### "Forms not loading / Infinite spinner"

**Solution:** Check browser console for errors. Most likely:

- Database not set up (Production Mode)
- Missing environment variables

---

## 🌟 Key Technologies

- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **AI:** Google Gemini, Ollama (local)
- **PDF Generation:** jsPDF
- **Testing:** Vitest
- **Deployment:** Vercel, Docker, or self-hosted

---

## 📄 License

ISC License - See LICENSE file for details

---

## 🤝 Support

Need help?

- 📖 Check the [E2E Verification Guide](/.gemini/antigravity/brain/0b266790-c8d8-4262-98e4-5d5b7fd2745c/e2e_verification_guide.md)
- 🐛 Report issues on GitHub
- 💬 Contact support

---

## 🎉 Getting Started is Easy

Just run:

```bash
npm run setup
```

And follow the friendly prompts. You'll be up and running in minutes!

**Made with ❤️ for social services professionals**
