export const APP_NAME = 'Pershie';
export const APP_DOMAIN = 'pershie.com';
export const DRIVE_ROOT_NAME = 'Pershie';
export const DRIVE_ALBUMS_FOLDER_NAME = 'albums';
export const APP_SCHEMA_VERSION = 1;
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export function getGoogleClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
}

export function getGooglePickerApiKey() {
  return process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
}

export function getGoogleCloudProjectNumber() {
  return process.env.EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER;
}
