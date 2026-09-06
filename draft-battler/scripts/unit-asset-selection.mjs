const SAFE_UNIT_ID = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

export function readUnitAssetSelection(args, availableUnitIds) {
  const optionIndexes = args.flatMap((argument, index) => (
    argument === "--units" || argument.startsWith("--units=") ? [index] : []
  ));
  if (optionIndexes.length === 0) {
    return undefined;
  }
  if (optionIndexes.length !== 1) {
    throw new Error("Specify --units only once.");
  }

  const optionIndex = optionIndexes[0];
  const option = args[optionIndex];
  const value = option === "--units" ? args[optionIndex + 1] : option.slice("--units=".length);
  if (!value || value.startsWith("--")) {
    throw new Error("--units requires a non-empty comma-separated list of unit IDs.");
  }

  const ids = value.split(",").map((id) => id.trim());
  if (ids.some((id) => !SAFE_UNIT_ID.test(id))) {
    throw new Error("--units contains an empty or invalid unit ID; paths are not accepted.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("--units contains duplicate unit IDs.");
  }

  const availableIds = new Set(availableUnitIds);
  const unknownIds = ids.filter((id) => !availableIds.has(id));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown unit IDs in --units: ${unknownIds.join(", ")}`);
  }

  return ids;
}
