
# 🚀 Startup Guide: Preventing Crashes

## ⚠️ Critical: Memory Limiter

The application is configured to use a memory limiter to prevent "Heap Out of Memory" crashes during development.

**ALWAYS** start the application using the following command (or simply `npm run dev` which has this pre-configured):

```bash
npm run dev
```

### Verification

If you experience a crash, verify that `package.json` contains this exact script:

```json
"dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
```

This sets the memory limit to **4GB** (4096MB), which is usually sufficient.

## 🛠️ Troubleshooting

If the app still crashes:

1. **Clear `.next` folder**: `rm -rf .next` (Linux/Mac)
2. **Increase Limit**: Change `4096` to `8192` (8GB) in `package.json` if your machine has 16GB+ RAM.

## 📄 DOR Report Generation

To use the new **DOR Report Generator**:

1. Complete an Intake.
2. Look for the "Generate DOR Report" button in the review section.
3. The system uses AI to auto-fill the "Conclusion" and other narrative sections based on the template.
