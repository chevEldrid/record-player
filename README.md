# Pershie

Pershie is a lean Expo Router web app for preserving personal-history audio. Each person is modeled as an album, each recording is modeled as a track, and Google Drive remains the source of truth while browser storage is used only for cached reads and session state.

## Product Summary

Pershie is a warm browser app for recording spoken memories from people close to you. Albums represent people, tracks represent recordings, and everything important lives in the user's own Google Drive rather than an app-owned backend.

## Architecture

- Expo Router + React Native Web + TypeScript for a browser-first app.
- Google OAuth via `expo-auth-session`.
- Google Drive API for folders, files, and JSON metadata.
- `expo-av` for microphone recording and playback.
- `expo-document-picker` for importing existing audio files.
- `expo-image-picker` for album and track images.
- `localStorage` for session state, selected library config, and cached library reads.

More detail is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Drive File Model

Pershie stores a readable Drive layout inside a configurable root folder:

```text
{your-base-folder}/
  albums/
    {person-slug-id}/
      metadata.json
      recordings/
        {timestamp-title}.m4a
        {timestamp-title}.json
      attachments/
```

`metadata.json` stores album metadata. Each track gets a sidecar JSON file next to the audio file so titles, dates, notes, transcript, and tags stay easy to inspect and repair.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill in the Google OAuth client ID in `.env`.

Required variables:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_API_KEY`
- `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER`

4. In Google Cloud Console:

- Enable the Google Drive API.
- Enable the Google Picker API.
- Create a Google web OAuth client.
- Create or reuse a browser API key that can be used with Google Picker.
- Note the Google Cloud project number for Picker `setAppId(...)`.
- For local dev, add `http://localhost:8081/auth/sign-in` as an authorized redirect URI when running `expo start --web`.
- For production, add `https://pershie.com/auth/sign-in` and any preview-domain variant you plan to use.
- Request the scopes `openid`, `profile`, `email`, and `https://www.googleapis.com/auth/drive.file`.

5. Start the app:

```bash
pnpm web
```

## Current UX

- Google sign-in with setup choices for creating a new library or importing an existing Drive folder via Google Picker.
- Custom base folder naming so users are not forced into a `Pershie/` root.
- Library, Record, and Help tabs.
- Album creation, recording, upload, playback, and metadata editing.
- Cached relaunch behavior for previously loaded library content.

## Vercel Deployment Notes

This repo is ready for Vercel's Git-based deployment flow. You do not need a GitHub Action to deploy if Vercel is connected directly to the repository.

- Vercel project ID: `prj_QmfDhx8HJ8ZU0s9tJbZJXDLwN50j`
- Vercel team slug: `chev424-5579s-projects`
- Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the Vercel project environment settings.
- Add `EXPO_PUBLIC_GOOGLE_API_KEY` and `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER` in the Vercel project environment settings.
- Point the production domain to `pershie.com`.
- Use the included `vercel.json` so Vercel builds the Expo web export from `dist`.
- Keep the GitHub Action for CI focused on validation such as typechecking.

## Useful Scripts

```bash
pnpm web
pnpm build:web
pnpm typecheck
```
