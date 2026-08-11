const AUTHORING_IMAGE_EXTENSION = /\.png$/i;

export function getAuthoringAssetsInBuild(relativePaths) {
  return [...relativePaths]
    .filter((filePath) => AUTHORING_IMAGE_EXTENSION.test(filePath))
    .sort((left, right) => left.localeCompare(right));
}

export function assertNoAuthoringAssetsInBuild(relativePaths) {
  const authoringAssets = getAuthoringAssetsInBuild(relativePaths);
  if (authoringAssets.length === 0) {
    return;
  }

  throw new Error(`Draft Battler build contains authoring PNG assets:\n${authoringAssets.join("\n")}`);
}
