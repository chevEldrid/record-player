# Record Player

Record Player is a lean Expo React Native MVP for preserving personal-history audio. Each person is modeled as an album, and each recording for that person is modeled as a track. Google Drive is the source of truth, while local storage is used only for cached library reads and pending offline uploads.

## Product Summary

Record Player is a warm, modern mobile app for recording spoken memories from people close to you. The app keeps the mental model simple: albums represent people, tracks represent recordings, and everything important lives in the user’s own Google Drive rather than an app-owned backend.

## Architecture

- Expo React Native + TypeScript for cross-platform mobile development.
- Expo Router for lean navigation and modal flows.
- Google OAuth via `expo-auth-session`.
- Google Drive API for folders, files, and JSON metadata.
- `expo-av` for microphone recording and playback.
- `expo-document-picker` for importing existing audio files.
- `expo-image-picker` for album and track images.
- Local cache and pending-upload queue stored in the app document directory.

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

3. Fill in the Google OAuth client IDs in `.env`.

Required variables:

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

4. In Google Cloud Console:

- Enable the Google Drive API.
- Create OAuth clients for Android, iOS, web, and Expo/dev usage.
- Add the redirect URI produced by `recordplayer://oauth`.
- Request the scopes `openid`, `profile`, `email`, and `https://www.googleapis.com/auth/drive.file`.

5. Start the app:

```bash
npm run start
```

Then run on iOS, Android, or web through Expo.

## MVP Flows Implemented

- Google sign-in screen with architecture summary.
- Drive root bootstrap for `Record Player` and `albums`.
- Library screen with album grid and album creation modal.
- Tracks screen for a selected album with warning-aware list items.
- Record screen for microphone capture and existing file upload.
- Offline recording queue with later sync to Drive.
- Track details modal with playback and metadata editing.
- Cache-backed relaunch behavior for previously loaded library content.

## Important Tradeoffs

- The MVP uses Google Drive directly from the client and intentionally avoids a custom backend.
- The app uses the narrower `drive.file` scope to keep permissions lighter, which works best for folders and files created by the app itself.
- Metadata-only edits require network access; offline support is intentionally limited to capture and later upload.
- Track metadata is stored as sidecar JSON instead of separate notes and transcript folders to keep the structure smaller and easier to repair.

## Useful Scripts

```bash
npm run start
npm run ios
npm run android
npm run web
npm run typecheck
```
