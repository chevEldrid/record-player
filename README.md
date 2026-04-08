# Record Player

Record Player is a lean Expo Router web app for preserving personal-history audio. Each person is modeled as an album, and each recording for that person is modeled as a track. Google Drive is the source of truth, while browser storage is used only for cached library reads and session state.

## Product Summary

Record Player is a warm, modern browser app for recording spoken memories from people close to you. The app keeps the mental model simple: albums represent people, tracks represent recordings, and everything important lives in the user’s own Google Drive rather than an app-owned backend.

## Architecture

- Expo Router + React Native Web + TypeScript for a browser-first app.
- Expo Router for lean navigation and modal flows.
- Google OAuth via `expo-auth-session`.
- Google Drive API for folders, files, and JSON metadata.
- `expo-av` for microphone recording and playback.
- `expo-document-picker` for importing existing audio files.
- `expo-image-picker` for album and track images.
- Local cache and session state stored in `localStorage`.

More detail is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Drive File Model

The app uses a readable Drive layout:

```text
Record Player/
  albums/
    {person-slug-id}/
      metadata.json
      recordings/
        {timestamp-title}.m4a
        {timestamp-title}.json
      attachments/
```

`metadata.json` stores album metadata. Each track gets a sidecar JSON file next to the audio file. Notes, transcript, tags, title, and recording date all live in the track JSON so the MVP stays simple and resilient.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill in the Google OAuth client ID in `.env`.

Required variables:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

4. In Google Cloud Console:

- Enable the Google Drive API.
- Create a Google web OAuth client.
- For web, add the redirect URI `http://localhost:8081/auth/sign-in` when running `expo start --web`, or the matching `/auth/sign-in` URL for your deployed domain.
- Request the scopes `openid`, `profile`, `email`, and `https://www.googleapis.com/auth/drive.file`.

5. Start the app:

```bash
npm run start
```

Then run the web app through Expo.

## Web Notes

- The browser build uses `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Browser uploads require a network connection.
- Session state and cached library data use `localStorage`.
- Install metadata lives in `public/manifest.json`.
- The service worker is registered for deployed builds, not localhost dev sessions, to avoid stale Metro caches while developing.

## MVP Flows Implemented

- Google sign-in screen with architecture summary.
- Drive root bootstrap for `Record Player` and `albums`.
- Library screen with album grid and album creation modal.
- Tracks screen for a selected album with warning-aware list items.
- Record screen for microphone capture and existing file upload.
- Track details modal with playback and metadata editing.
- Cache-backed relaunch behavior for previously loaded library content.

## Important Tradeoffs

- The MVP uses Google Drive directly from the client and intentionally avoids a custom backend.
- The app uses the narrower `drive.file` scope to keep permissions lighter, which works best for folders and files created by the app itself.
- Uploads and metadata-only edits require network access.
- Track metadata is stored as sidecar JSON instead of separate notes and transcript folders to keep the structure smaller and easier to repair.

## Useful Scripts

```bash
npm run start
npm run build:web
npm run web
npm run typecheck
```
