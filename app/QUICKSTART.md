# 🚀 Quick Start Guide

**New to this? No problem!** Follow these simple steps:

## Step 1: Install Node.js (if you don't have it)

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS version** (recommended)
3. Run the installer
4. Click "Next" through all the prompts
5. Restart your computer

## Step 2: Download the Project

**Option A: Using Git (if you have it)**

```bash
git clone https://github.com/KFussell-71/intake-system.git
cd intake-system
```

**Option B: Download ZIP**

1. Go to the GitHub repository
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open Terminal/Command Prompt in that folder

## Step 3: Run the Setup Wizard

**On Windows:**

1. Open Command Prompt or PowerShell
2. Navigate to the project folder
3. Type: `npm run setup`
4. Press Enter

**On Mac/Linux:**

1. Open Terminal
2. Navigate to the project folder
3. Type: `npm run setup`
4. Press Enter

## Step 4: Follow the Prompts

The wizard will ask you simple questions:

1. **Choose Demo or Production Mode**
   - Choose **Demo Mode** if you're just testing
   - Choose **Production Mode** if you want real data storage

2. **Enter Credentials (Production Mode only)**
   - You'll need a free Supabase account
   - Don't have one? The wizard will guide you!

3. **Wait for Installation**
   - This takes 1-3 minutes
   - You'll see a progress bar

4. **Start the App**
   - The wizard will ask if you want to start now
   - Say "yes" and your browser will open automatically!

## Step 5: Login

**Demo Mode:**

```
Email: staff@newbeginning.org
Password: password
```

**Production Mode:**

- Create your own account on the login page

## That's It! 🎉

You're now ready to use the Intake Portal!

---

## Need Help?

### "I don't know how to open Terminal/Command Prompt"

**Windows:**

1. Press `Windows Key + R`
2. Type `cmd` and press Enter

**Mac:**

1. Press `Command + Space`
2. Type `terminal` and press Enter

**Linux:**

1. Press `Ctrl + Alt + T`

### "I get an error about Node.js version"

You need Node.js 20 or higher. Download it from [nodejs.org](https://nodejs.org)

### "The setup wizard won't start"

Make sure you're in the correct folder:

```bash
cd path/to/intake-system
npm run setup
```

### "I want to start over"

Delete the `.env.local` file and run `npm run setup` again.

---

## Video Tutorial (Coming Soon)

We're working on a video walkthrough! Check back soon.

---

**Still stuck?** Open an issue on GitHub or contact support.
