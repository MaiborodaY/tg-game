export async function resolve(specifier, context, nextResolve) {
  const isRelativeExtensionlessImport =
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.[a-z0-9]+$/i.test(specifier);

  if (isRelativeExtensionlessImport) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch (error) {
      if (error?.code !== "ERR_MODULE_NOT_FOUND") {
        throw error;
      }
    }
  }

  return nextResolve(specifier, context);
}
