type PickedFolder = {
  id: string;
  name: string;
};

function normalizeConfigValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: { callback: () => void }) => void;
    };
    google?: {
      picker: {
        Action: { CANCEL: string; PICKED: string };
        DocsView: new (viewId: unknown) => {
          setIncludeFolders: (enabled: boolean) => void;
          setMimeTypes: (mimeTypes: string) => void;
          setSelectFolderEnabled: (enabled: boolean) => void;
        };
        Document: { ID: string; NAME: string };
        PickerBuilder: new () => {
          addView: (view: unknown) => any;
          enableFeature: (feature: unknown) => any;
          hideTitleBar: () => any;
          setAppId: (appId: string) => any;
          setCallback: (callback: (data: Record<string, unknown>) => void) => any;
          setDeveloperKey: (developerKey: string) => any;
          setOAuthToken: (token: string) => any;
          build: () => { setVisible: (visible: boolean) => void };
        };
        Response: { ACTION: string; DOCUMENTS: string };
        Feature: { NAV_HIDDEN: unknown };
        ViewId: { FOLDERS: unknown };
      };
    };
  }
}

async function loadGooglePickerApi() {
  if (typeof window === 'undefined') {
    throw new Error('Google Picker is only available in the web app.');
  }

  if (!document.querySelector('script[data-google-api-script="true"]')) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.dataset.googleApiScript = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Picker.'));
      document.head.appendChild(script);
    });
  }

  if (!window.gapi) {
    throw new Error('Google Picker did not initialize correctly.');
  }

  await new Promise<void>((resolve) => {
    window.gapi!.load('picker', {
      callback: resolve,
    });
  });
}

export async function openGoogleFolderPicker(params: {
  accessToken: string;
  apiKey: string;
  appId: string;
}) {
  const apiKey = normalizeConfigValue(params.apiKey);
  const appId = normalizeConfigValue(params.appId);

  await loadGooglePickerApi();

  const picker = window.google?.picker;
  if (!picker) {
    throw new Error('Google Picker is unavailable.');
  }

  return new Promise<PickedFolder | null>((resolve) => {
    const view = new picker.DocsView(picker.ViewId.FOLDERS);
    view.setIncludeFolders(true);
    view.setSelectFolderEnabled(true);
    view.setMimeTypes('application/vnd.google-apps.folder');

    const builder = new picker.PickerBuilder()
      .addView(view)
      .enableFeature(picker.Feature.NAV_HIDDEN)
      .hideTitleBar()
      .setDeveloperKey(apiKey)
      .setOAuthToken(params.accessToken)
      .setCallback((data: Record<string, unknown>) => {
        const action = data[picker.Response.ACTION];

        if (action === picker.Action.PICKED) {
          const docs = data[picker.Response.DOCUMENTS] as Record<string, string>[] | undefined;
          const first = docs?.[0];
          resolve(
            first
              ? {
                  id: first[picker.Document.ID],
                  name: first[picker.Document.NAME],
                }
              : null
          );
          return;
        }

        if (action === picker.Action.CANCEL) {
          resolve(null);
        }
      });

    if (/^\d+$/.test(appId)) {
      builder.setAppId(appId);
    }

    builder.build().setVisible(true);
  });
}

export type { PickedFolder };
