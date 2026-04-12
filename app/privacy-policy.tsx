import { ContentBody, ContentPage, ContentSection } from '@/components/ContentPage';

export default function PrivacyPolicyScreen() {
  return (
    <ContentPage meta="Last updated: April 9, 2026" title="Privacy Policy">
      <ContentSection>
        <ContentBody>
          Pershie helps you record and organize personal-history audio. This policy
          explains what data the app handles and how that data is used.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Information Pershie accesses">
        <ContentBody>
          When you sign in with Google, Pershie may access your basic Google account
          profile information, including your name, email address, profile image,
          and an authentication token needed to connect the app to your Google Drive.
        </ContentBody>
        <ContentBody>
          Pershie also accesses the files and folders it creates or opens inside the
          Google Drive library you choose, including audio recordings, metadata,
          images, and folder structure used to organize your library.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="How information is used">
        <ContentBody>
          Pershie uses Google account access only to authenticate you and connect the
          app to your chosen Google Drive library.
        </ContentBody>
        <ContentBody>
          Audio recordings, metadata, and images are used only to store, display,
          update, and play back the library content you manage in the app.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Storage and retention">
        <ContentBody>
          Pershie is designed so your library content lives primarily in your own
          Google Drive. The web app may also store cached library data and session
          details in your browser so the app can reopen faster and remain signed in.
        </ContentBody>
        <ContentBody>
          Pershie does not use a separate application database to store your library
          contents.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Sharing">
        <ContentBody>
          Pershie does not sell your personal information. Data handled by the app is
          not shared with third parties except as needed to operate through Google
          services that you authorize, such as Google Sign-In and Google Drive.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Your choices">
        <ContentBody>
          You can stop using Pershie at any time, revoke the app’s Google access from
          your Google account settings, or delete files from the Google Drive library
          you selected. Deleting Pershie does not delete your saved recordings.
        </ContentBody>
      </ContentSection>
    </ContentPage>
  );
}
