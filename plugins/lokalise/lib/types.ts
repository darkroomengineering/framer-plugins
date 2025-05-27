// Parsing
interface FramerLocale {
  code: string // "en", "fr-FR"
  name: string
  isDefault?: boolean
  id: string
}

interface FramerLocalizationString {
  id: string
  value: string // { "en": "Hello", "fr-FR": "Bonjour" }
}

interface FramerLocalizationGroup {
  id: string
  name: string 
  sources: FramerLocalizationString[]
}

interface ParseFramerDataForLokalise {
  baseLocale: string
  locales: readonly FramerLocale[]
  groups: readonly FramerLocalizationGroup[]
}

interface ParseLokaliseDataForFramer {
  lokaliseData: LokaliseData
  locales: readonly FramerLocale[]
  groups: readonly FramerLocalizationGroup[]
}

interface Translation {
  [key: string]: string
}

type LokaliseData = Record<string, Translation>

export type { ParseFramerDataForLokalise, ParseLokaliseDataForFramer, FramerLocalizationString,  LokaliseData, Translation }

// API
type HandleResponse = {
  response: Response;
  endpoint: string;
}

type LokaliseKey = {
  key_id: number;
  key_name: {
    web: string;
    other?: string;
  };
}

interface AuthToken {
  authToken: string | null;
}

interface ProjectCredentials extends AuthToken {
  projectId: string;
}

interface UploadTranslations extends ProjectCredentials {
  langIso: string;
  filename: string;
  translations: Translation;
}

interface FetchLokalise extends AuthToken, RequestInit {
  endpoint: string;
}

export type { HandleResponse, LokaliseKey, AuthToken, ProjectCredentials, UploadTranslations, FetchLokalise }

