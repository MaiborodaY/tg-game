export type SaveVersionKind = 'schema' | 'campaign';

// Kept independent of campaign modules so storage can recognize an intact save
// that belongs to a newer client without treating it as damaged progress.
export class UnsupportedSaveVersionError extends Error {
  readonly versionKind: SaveVersionKind;
  readonly foundVersion: number;
  readonly supportedVersion: number;

  constructor(versionKind: SaveVersionKind, foundVersion: number, supportedVersion: number) {
    super(`Unsupported ${versionKind} save version ${foundVersion}; this client supports ${supportedVersion}`);
    this.name = 'UnsupportedSaveVersionError';
    this.versionKind = versionKind;
    this.foundVersion = foundVersion;
    this.supportedVersion = supportedVersion;
  }
}
