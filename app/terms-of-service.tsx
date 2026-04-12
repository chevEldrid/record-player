import { ContentBody, ContentPage, ContentSection } from '@/components/ContentPage';

export default function TermsOfServiceScreen() {
  return (
    <ContentPage meta="Last updated: April 9, 2026" title="Terms of Service">
      <ContentSection>
        <ContentBody>
          These Terms of Service govern your use of Pershie, a web app for recording
          and organizing personal-history audio in your own Google Drive.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Use of the service">
        <ContentBody>
          You may use Pershie only in compliance with applicable law and these terms.
          You are responsible for the recordings, images, notes, and other content
          you create, upload, or manage through the app.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Your Google account and content">
        <ContentBody>
          Pershie relies on Google Sign-In and Google Drive access that you authorize.
          You remain responsible for your Google account, your Drive files, and the
          permissions on folders and content you choose to connect.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Acceptable use">
        <ContentBody>
          You agree not to use Pershie to violate privacy rights, infringe
          intellectual property rights, upload unlawful material, or interfere with
          the normal operation or security of the service.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Availability">
        <ContentBody>
          Pershie is provided on an as-is and as-available basis. Features may
          change, improve, or be removed over time, especially while the product is
          being tested.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Limitation of liability">
        <ContentBody>
          To the fullest extent permitted by law, Pershie is not liable for indirect,
          incidental, special, consequential, or exemplary damages arising from your
          use of the app, including data loss, account issues, or service
          interruptions.
        </ContentBody>
      </ContentSection>

      <ContentSection heading="Changes to these terms">
        <ContentBody>
          These terms may be updated from time to time. Continued use of Pershie
          after an update means you accept the revised terms.
        </ContentBody>
      </ContentSection>
    </ContentPage>
  );
}
