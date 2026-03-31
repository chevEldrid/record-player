import { Platform } from 'react-native';

export const APP_NAME = 'Record Player';
export const DRIVE_ROOT_NAME = 'Record Player';
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
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  }

  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  }

  return process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
}
