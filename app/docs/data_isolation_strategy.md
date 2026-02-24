
# Data Isolation & Mock Data Strategy

## 1. Production Data Safety

The system uses strict Row Level Security (RLS) policies in Supabase.

- **Production**: Access is restricted to `authenticated` users with correct roles.
- **Mock Data**: The "mock" data seen in development (e.g., "John Doe") comes from the **SEED** file or local development database.
- **Deployment**: When deploying to a fresh production instance, the database starts **EMPTY** unless you explicitly run the seed script.

## 2. Removing/Hiding Mock Data

To ensure no mock data appears in production:

1. **Do NOT run `seed.sql`** on your production Supabase project.
2. **Environment Variables**: Ensure `NEXT_PUBLIC_ALLOW_MOCK_AUTH=false` in your production `.env`.
3. **Training Mode**: The "Training Mode" toggle only activates the *UI Overlay*. It does not inject fake clients. This is safe to use in production for employee onboarding.

## 3. Training/Demo Mode

- **Activation**: Supervisor Dashboard > System Pulse > "Training Mode" Toggle.
- **Features**:
  - Adds a persistent "Help" button to the screen.
  - Provides interactive walkthroughs (e.g., "Intake Process").
  - **Note**: This mode is strictly a UI layer. It does not create fake records in the database.
