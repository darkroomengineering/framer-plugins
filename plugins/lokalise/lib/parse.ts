// Assumed type definitions for data from Framer
interface FramerLocale {
  code: string // e.g., "en", "fr-FR"
  name: string
  isDefault?: boolean
  id: string
}

interface FramerLocalizationString {
  id: string
  value: string // e.g., { "en": "Hello", "fr-FR": "Bonjour" }
}

interface FramerLocalizationGroup {
  id: string
  name: string // Used for prefixing keys, e.g., "common"
  sources: FramerLocalizationString[]
}

/**
* Parses Framer's localization data into a map of locale codes to flat translation objects.
* Example output:
* {
*   "en": { "common.greeting": "Hello", "user.profileTitle": "Profile" },
* }
*/

export function parseFramerDataForLokalise(
  baseLocale: string,
  locales: readonly FramerLocale[],
  groups: readonly FramerLocalizationGroup[]
): Record<string, Record<string, string>> {
  const lokaliseDataMap: Record<string, Record<string, string>> = {}

  if (!locales || !groups) {
      console.log("Lokalise parsing: Locales or groups data is missing or empty.")
      return lokaliseDataMap
  }

  // We'll create entries only for English (source) initially
  const translationsForLocale: Record<string, string> = {}
  
  for (const group of groups) {
  for (const source of group.sources) {
      const lokaliseKey = `${group.id}.${source.id}` 
      translationsForLocale[lokaliseKey] = source.value 
  }

  // Only add the locale to the map if it has translations
  if (Object.keys(translationsForLocale).length > 0) {
      lokaliseDataMap[baseLocale] = translationsForLocale
  }
}

  return lokaliseDataMap
}