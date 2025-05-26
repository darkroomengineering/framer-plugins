import type { LocalizationData } from "framer-plugin"

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

export type LokaliseData = Record<string, Record<string, string>>

export function parseFramerDataForLokalise(
  baseLocale: string,
  locales: readonly FramerLocale[],
  groups: readonly FramerLocalizationGroup[]
): LokaliseData {
  const lokaliseDataMap: LokaliseData = {}

  if (!locales || !groups) {
      console.log("Lokalise parsing: Locales or groups data is missing or empty.")
      return lokaliseDataMap
  }

  // We'll create entries only for English (source) initially
  const translationsForLocale: Record<string, string> = {}
  
  for (const group of groups) {
  for (const source of group.sources) {
      const lokaliseKey = `${group.id}:${source.id}` 
      translationsForLocale[lokaliseKey] = source.value 
  }

  // Only add the locale to the map if it has translations
  if (Object.keys(translationsForLocale).length > 0) {
      lokaliseDataMap[baseLocale] = translationsForLocale
  }
}

  return lokaliseDataMap
}

export function parseLokaliseDataForFramer(
  lokaliseData: Record<string, Record<string, string>>,
  locales: readonly FramerLocale[],
  groups: readonly FramerLocalizationGroup[]
): LocalizationData {
  const localizationData: LocalizationData = { valuesBySource: {} }

  // Process each locale's translations
  for (const [localeCode, translations] of Object.entries(lokaliseData)) {
    const targetLocale = locales.map((local) => ({
      ...local,
      code: local.code.replace("-", "_")
    })).find(locale => locale.code === localeCode)

    if (!targetLocale) continue

    // Process each translation for this locale
    for (const [lokaliseKey, translatedValue] of Object.entries(translations)) {
      const [groupId, sourceId] = lokaliseKey.split(':')

      if(!sourceId || !groupId) continue
          
      const sourceExists = groups.some(group => 
        group.id === groupId && 
        group.sources.some(source => source.id === sourceId)
      )
      
      if (!sourceExists) continue  
        
      localizationData.valuesBySource![sourceId] = {
        [targetLocale.id]: { action: "set", value: translatedValue }
      }
    }
  }

  return localizationData
}