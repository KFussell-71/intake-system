# Findings - One-Click Setup

## Design Considerations

- **Environment**: Users might not have `bash` (Windows users), so a `setup.js` script is better than `setup.sh`.
- **Interactivity**: The script should prompt for the Supabase URL and Key if the `.env` file doesn't exist.
- **Node.js Check**: Ensure the user has at least Node 20.
- **Deployment Error**: User encountered a deployment error implicitly resolved by the build fix, but provided additional screenshots for verification.
  - `Screenshot 2026-01-28 at 21-27-44 Next.js on Netlify Netlify Docs.png`
  - `Screenshot 2026-01-28 at 21-27-58 Deploy details Deploys silver-maamoul-9fe5f2 Netlify.png`
- **Build Fix**: The local build failed initially due to `vitest.config.ts` being included in the build. This was resolved by excluding it in `tsconfig.json`.
- **Round 2 Errors (21:37)**: User reports continued failure. New screenshots available.
  - `Screenshot 2026-01-28 at 21-36-21...`
  - `Screenshot 2026-01-28 at 21-37-24...`
  - *Hypothesis*: Environment variable validation failure during build, or Node.js version mismatch.
- **Round 3 Errors (Netlify Logs)**:
  - **Error**: `Error: Cannot find module 'autoprefixer'`
  - **Cause**: `netlify.toml` sets `NODE_ENV=production`, causing `npm install` to skip `devDependencies`. `autoprefixer` is needed for the build.
  - **Fix**: Move `autoprefixer`, `postcss`, and `tailwindcss` to `dependencies`.
- **Round 4 Errors**: User sees same error because **Round 3 Push Failed** locally due to unstaged files.
- **Round 4 Errors (Detailed Log)**: User provided a detailed breakdown confirming `autoprefixer` module not found.
  - **Current State**: My previous commit (`568ae157`) *should* have fixed this by moving deps.
  - **Verification**: Need to verify `package.json` actually has `autoprefixer` in `dependencies`.
- **Round 5 Errors (New Log)**: Auto-fix worked! CSS error gone. New error: `Module not found: Can't resolve 'zod'`.
  - **Cause**: `zod` is likely missing from `package.json` or in `devDependencies`.
  - **Fix**: Install `zod` as a production dependency.
- **Round 6 Feedback**: User flagged non-compliance with skill protocols and CI rules.
  - **Action**: Formal re-alignment with `planning-with-files` steps.
  - **Status**: `zod` fix is deployed (`main -> a2c0e780`). Pending Netlify build result.
- **Round 7 Errors (New Log)**: Build failed during `Running TypeScript ...`.
  - **Error**: `It looks like you're trying to use TypeScript but do not have the required package(s) installed.`
  - **Cause**: Same as Round 3. `NODE_ENV=production` prevents installation of `typescript` and `@types/*` which are in `devDependencies`.
  - **Fix**: Move `typescript`, `@types/react`, `@types/react-dom`, `@types/node` to `dependencies`.
- **Final Checks**: acting on "Netlify Deployment Goggles" feedback.
  - **Action**: Enforce `engines.node`, verify `setup.js` ESM, check `netlify.toml`.
- **Implementation Error**: strict type check failed in `useIntakeForm.ts`.
  - **Cause**: New fields added to interface but not to initial state constant.
  - **Fix**: Initialize verification fields to empty strings.
- **Feedback**: Use emojis and clear colors (via terminal) to guide the user.

## Proposed Setup Flow

1. Run `node setup.js`
2. Script checks environment.
3. Script asks for Supabase URL/Key.
4. Script writes `.env.local`.
5. Script runs `npm install`.
6. Script reminds user to run `schema.sql`.
7. Script offers to start the dev server immediately.
