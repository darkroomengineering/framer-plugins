import type { LocalizationData } from "framer-plugin"
import type {LokaliseData, ParseFramerDataForLokalise, ParseLokaliseDataForFramer, Translation} from "./types"

export function parseFramerDataForLokalise(
 { baseLocale, locales, groups }: ParseFramerDataForLokalise
): LokaliseData {
  const lokaliseDataMap: LokaliseData = {}

  if (!locales || !groups) {
      console.log("Lokalise parsing: Locales or groups data is missing or empty.")
      return lokaliseDataMap
  }

  const translationsForLocale: Translation = {}
  
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
  { lokaliseData, locales, groups }: ParseLokaliseDataForFramer
): LocalizationData {
  const localizationData: LocalizationData = { valuesBySource: {} }

  // Process each locale's translations
  for (const [localeCode, translations] of Object.entries(lokaliseData)) {
    const targetLocale = locales.map((local) => ({
      ...local,
      code: local.code.replace("-", "_") // Difference between Framer and Lokalise
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