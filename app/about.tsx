import { Link } from 'expo-router';
import { Text } from 'react-native';

import { ContentBody, ContentPage, ContentSection } from '@/components/ContentPage';
import {
  APP_NAME,
  DRIVE_ALBUMS_FOLDER_NAME,
  DRIVE_ROOT_NAME,
} from '@/constants/config';

export default function AboutScreen() {
  return (
    <ContentPage title={`About ${APP_NAME}`}>
      <ContentSection>
        <ContentBody>
          Pershie is an app for recording and organizing human histories. Each
          person is represented as an album, and each recording is stored as a track.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="How it works">
        <ContentBody>
          After signing in with Google and pointing Pershie to your personal library, Pershie takes care of the rest.
          All recordings are saved on your drive with appropriate metadata and can be deleted, edited, updated, or imported completely outside of this application with no issues.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Library structure">
        <Text
          className="rounded-appMd border border-appBorder bg-appBgElevated p-4 text-[13px] leading-[22px] text-appText"
          style={{ fontFamily: 'monospace' }}>
          {DRIVE_ROOT_NAME}
          {'\n'}  {DRIVE_ALBUMS_FOLDER_NAME}
          {'\n'}    {'{person-slug-id}'}
          {'\n'}      metadata.json
          {'\n'}      recordings/
          {'\n'}        {'{track-title-id}'}.m4a
          {'\n'}        {'{track-title-id}'}.json
          {'\n'}      attachments/
        </Text>
      </ContentSection>

      <ContentSection heading="What Pershie stores">
        <ContentBody>
          Nothing - you keep all your own data.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="About the Author">
        <Link className="text-[15px] font-bold text-appAccent" href="https://github.com/chevEldrid">
          github.com/chevEldrid
        </Link>
      </ContentSection>
    </ContentPage>
  );
}
