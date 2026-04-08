# Architecture Notes

## Short Product Summary

Pershie is a personal-history recording web app where each person is an album and each memory is a track. The MVP prioritizes calm browser UX, direct ownership of files in Google Drive, and a simple client-only architecture.

## Technical Architecture

- UI: Expo Router screens rendered through React Native Web.
- Navigation: Expo Router with tabs for Library, Record, and Help, plus stack screens and modals for tracks and details.
- Auth: Google OAuth handled in-browser with `expo-auth-session`.
- Import UX: Google Picker lets the user explicitly choose an existing Drive folder.
- Persistence: Google Drive folders and JSON metadata files.
- Local storage: `localStorage` stores cached library data, pending uploads, session state, and the selected library configuration.
- State: React context keeps the architecture small and avoids adding another state library for v1.

## Why No Backend

The MVP can work client-side because Google Drive already provides persistence, file ownership, and API access. A backend would add cost, deployment complexity, token-management work, and a second source of truth. If production Google auth policy or long-lived refresh behavior becomes limiting later, the smallest next step would be a tiny token broker rather than a full application backend.

## Folder Strategy

The app keeps Drive readable while allowing a user-selected base folder name:

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

Reasons:

- Audio and metadata stay adjacent.
- External repairs are easier because one JSON file explains one audio file.
- Notes, transcript, tags, and image references stay in one place.
- Users are not forced to keep the app under a hardcoded `Pershie/` root.

## Import Behavior

- New libraries can be created under any top-level folder name.
- Existing libraries can be reconnected during sign-in by opening Google Picker and selecting the desired Drive folder.
- This is a better fit than blind Drive discovery when the app intentionally uses the narrower `drive.file` scope.

## Metadata Schema

Album metadata:

```json
{
  "schemaVersion": 1,
  "id": "album_xxxxxxxx",
  "name": "Grandma Rosa",
  "createdAt": "2026-03-30T19:00:00.000Z",
  "updatedAt": "2026-03-30T19:00:00.000Z",
  "imageFileName": "album-cover-album_xxxxxxxx.jpg"
}
```

Track metadata:

```json
{
  "schemaVersion": 1,
  "id": "track_xxxxxxxx",
  "albumId": "album_xxxxxxxx",
  "title": "How we moved to Tijuana",
  "recordedAt": "2026-03-30T19:10:00.000Z",
  "createdAt": "2026-03-30T19:10:00.000Z",
  "updatedAt": "2026-03-30T19:10:00.000Z",
  "tags": ["migration", "family"],
  "notes": "Recorded after dinner.",
  "transcript": "",
  "imageFileName": "2026-03-30T19-10-00-000Z-how-we-moved-image.jpg",
  "audioFileName": "2026-03-30T19-10-00-000Z-how-we-moved.m4a"
}
```

## Assumptions

- The app creates the Drive structure and primarily manages files it created.
- Users may edit metadata or move folders externally, and the app should continue working as long as the structure is still recognizable.
- Missing metadata should not hide recordings; instead, the UI shows warnings and falls back to filename or Drive timestamps.
- Offline support is intentionally minimal. Reads may use cached library data, but uploads and metadata edits require network access.

## Deployment Notes

- Production hosting is planned for `pershie.com`.
- Vercel project ID is `prj_QmfDhx8HJ8ZU0s9tJbZJXDLwN50j`.
- Vercel team slug is `chev424-5579s-projects`.
- Vercel should provide the static hosting and environment-variable management for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Vercel should also provide `EXPO_PUBLIC_GOOGLE_API_KEY` and `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER` for Google Picker.
- GitHub Actions are useful for CI validation, but Vercel's Git integration can handle the actual deploy pipeline.
