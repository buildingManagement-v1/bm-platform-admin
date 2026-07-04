export interface AppVersionConfig {
  id: string;
  androidMinimumVersion: string;
  androidLatestVersion: string;
  iosMinimumVersion: string;
  iosLatestVersion: string;
  versionDescription: string;
  lastForceUpdateVersion: string;
  isOptional: boolean;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAppVersionInput {
  androidMinimumVersion: string;
  androidLatestVersion: string;
  iosMinimumVersion: string;
  iosLatestVersion: string;
  versionDescription: string;
  lastForceUpdateVersion: string;
  isOptional: boolean;
}
