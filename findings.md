# Findings - One-Click Setup

## Design Considerations

- **Environment**: Users might not have `bash` (Windows users), so a `setup.js` script is better than `setup.sh`.
- **Interactivity**: The script should prompt for the Supabase URL and Key if the `.env` file doesn't exist.
- **Node.js Check**: Ensure the user has at least Node 20.
- **Feedback**: Use emojis and clear colors (via terminal) to guide the user.

## Proposed Setup Flow

1. Run `node setup.js`
2. Script checks environment.
3. Script asks for Supabase URL/Key.
4. Script writes `.env.local`.
5. Script runs `npm install`.
6. Script reminds user to run `schema.sql`.
7. Script offers to start the dev server immediately.
