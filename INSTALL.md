# 🏥 Welcome to Intake System v3.2

### The Noob-Friendly Guide to Your Private Clinical Node

This guide will help you get your private, secure clinical system up and running in less than 5 minutes. No coding experience required.

---

## 🏁 Step 0: What You Need

1. **A Computer**: Windows 10/11 or Ubuntu Linux.
2. **Docker Desktop**: This is the "Engine" that runs the app.
    * [Download for Windows](https://www.docker.com/products/docker-desktop/)
    * *Make sure it is running (the little whale icon in your taskbar should be green).*

---

## 🚀 Step 1: Start the System

### 🪟 On Windows (Easy Mode)

1. Open the folder where you downloaded this project.
2. **Double-click** the file named `install.bat`.
3. A black window will pop up. Wait until it says "🎉 SUCCESS".

### 🐧 On Linux

1. Right-click in the folder and select "Open in Terminal".
2. Type this command and press Enter:
    `./install.sh`
3. Wait until you see the "🎉 SUCCESS" message.

---

## 📍 Step 2: Open the App

1. Open your web browser (Chrome, Edge, or Brave).
2. Type this in the address bar:
    `http://localhost`
3. You are now inside your private Clinical Node!

---

## 💾 Step 3: Where is my data?

Everything you save is stored **locally on your computer**.
* Your Database is in: `docker/data/db`
* Your Files/Photos are in: `docker/data/storage`
* **Important**: If you move this folder, your data moves with it. Keep it safe!

---

## ❓ Troubleshooting (Help! It's not working)

| Problem | Solution |
| :--- | :--- |
| **"Docker not found"** | You need to download and install Docker Desktop (see Step 0). |
| **"Port 80 already in use"** | Another program is using the web port. Close Skype, Steam, or other web servers and try again. |
| **"Permission Denied"** (Linux) | Type `chmod +x install.sh` and then try running it again. |
| **It's stuck at "Waiting"** | Your computer might be slow. Give it another 60 seconds; it's just waking up the AI. |

---

## 🛠️ Advanced Operator Notes

- **Custom Keys**: If you want to use your own Google Gemini AI key, edit the `.env.local` file and add your key next to `GOOGLE_GENERATIVE_AI_API_KEY=`.
* **Local AI**: By default, this system uses **Ollama** for private, local AI that never leaves your machine.
* **Port Change**: To run on a different port (e.g., 3001), edit `PORT=3000` in `.env.local`.
