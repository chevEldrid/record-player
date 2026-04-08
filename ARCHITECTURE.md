# Architecture Notes

## Short Product Summary

Record Player is a personal-history recording web app where each person is an album and each memory is a track. The MVP prioritizes calm browser UX, direct ownership of files in Google Drive, and a simple client-only architecture.

## Technical Architecture

- UI: Expo Router screens rendered through React Native Web.
- Navigation: Expo Router with tabs for Library and Record, plus stack screens and modals for Tracks and details.
- Auth: Google OAuth handled in-browser with `expo-auth-session`.
- Persistence: Google Drive folders and JSON metadata files.
- Local storage: `localStorage` stores cached library data and session state.
- State: React context keeps the architecture small and avoids adding another state library for v1.

## Why No Backend

The MVP can work client-side because Google Drive already provides persistence, file ownership, and API access. A backend would add cost, deployment, token-management complexity, and a second source of truth. If production Google auth policy or long-lived refresh behavior becomes limiting later, the smallest next step would be a tiny token broker rather than a full application backend.

## Folder Strategy

The requested baseline suggested separate notes and transcript folders. For v1, this implementation slightly simplifies that shape:

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

Reasons:

- Audio and metadata stay adjacent.
- External repairs are easier because one JSON file explains one audio file.
- Notes, transcript, tags, and image references stay in one place.
- The Drive tree stays readable without turning into many tiny directories.

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

## Tradeoffs

- `drive.file` is narrower and safer, but it is less ideal for discovering arbitrary pre-existing Drive trees the app did not create.
- React context is simpler than a dedicated state library, but it is less specialized if the app grows significantly.
- ISO date editing in the track modal is pragmatic for v1, but not the final UX.
- The web app intentionally avoids a background upload queue, since browser blobs and session lifetimes are less durable than native app storage.
