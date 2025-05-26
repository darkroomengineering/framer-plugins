import type { LokaliseData } from "./parse";

const devMode = import.meta.env.MODE === "development"
const baseApiUrl = devMode 
? "/api/lokalise-proxy" 
: "https://api.lokalise.com/api2";

interface LokaliseKey {
  key_id: number;
  key_name: {
    web: string;
    other?: string;
  };
}

const HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json",
}

async function handleError(response: Response, endpoint: string) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Lokalise API Error (${endpoint}): ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data;
}

function stringToBase64(translations: LokaliseData) {
    const jsonString = JSON.stringify(translations);
    let base64Data;
    try {
      // Json string to UTF-8 bytes then to ascii then to base64
        base64Data = btoa(new TextEncoder().encode(jsonString).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    } catch (e) {
        console.log("Error base64 encoding translations:", e);
        throw new Error("Failed to base64 encode translations. Check for complex Unicode characters if issues persist.");
    }

    return base64Data;
}

export async function getProjects(apiKey: string) {
  const endpoint = `${baseApiUrl}/projects`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { ...HEADERS, "x-api-token": apiKey },
  })

  const data = await handleError(response, "getProjects")
  return data;
}

export async function getProjectLanguages(apiKey: string, projectId: string) {
  const endpoint = `${baseApiUrl}/projects/${projectId}/languages`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { ...HEADERS, "x-api-token": apiKey },
  })

  const data = await handleError(response, "getProjectLanguages")
  return data;
}

export async function getTranslationsKeys(
  authToken: string,
  projectId: string,
  languageId: number
): Promise<LokaliseKey[]> {
  const endpoint = `${baseApiUrl}/projects/${projectId}/keys?filter_lang_id=${languageId}&limit=5000`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { ...HEADERS, "x-api-token": authToken },
  })

  const {keys} = await handleError(response, "getTranslationsKeys")
  return keys;
}   

export async function getTranslationsAsJson(
    authToken: string,
    projectId: string,
    langIso: string, 
    languageId: number
): Promise<Record<string, string>> {
    const endpoint = `${baseApiUrl}/projects/${projectId}/translations?filter_lang_id=${languageId}&disable_references=1&limit=5000`;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: { ...HEADERS, "x-api-token": authToken },
    });

    const {translations} = await handleError(response, `Failed to fetch translations for ${langIso} (ID: ${languageId})`)

    // We need the keys to map id to keys name
    const keys = await getTranslationsKeys(authToken, projectId, languageId)

    const result: Record<string, string> = {};
    for (const translation of translations) {
        const keyName = keys.find(key => key.key_id === translation.key_id)?.key_name.web;
        if (keyName) {
            result[keyName] = translation.translation;
        }
    }

    return result;
}

export async function uploadTranslations(
    apiKey: string,
    projectId: string,
    langIso: string, // e.g., "en_US"
    filename: string, // e.g., "en_US.json"
    translations: LokaliseData // key-value translations for this language
  ) {
    const base64Data = stringToBase64(translations);
    const endpoint = `${baseApiUrl}/projects/${projectId}/files/upload`;
  
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { ...HEADERS, "x-api-token": apiKey },
        body: JSON.stringify({
            data: base64Data,
            filename: filename,
            lang_iso: langIso,
            tags: ["Framer"],
            // Config
            replace_modified: false,
            detect_icu_plurals: true,
            replace_breaks: false,
            skip_detect_lang_iso: true,
        }),
    });
  
    const data = await handleError(response, "uploadSingleLanguageTranslations")
    return data;
  }