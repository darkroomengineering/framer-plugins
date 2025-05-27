import type { HandleResponse, LokaliseKey, AuthToken, ProjectCredentials, UploadTranslations, FetchLokalise, LokaliseData, Translation } from "./types";

const devMode = import.meta.env.MODE === "development"
const baseApiUrl = devMode 
? "/api/lokalise-proxy" 
: "https://api.lokalise.com/api2";


async function fetchLokalise({endpoint, authToken, ...props}: FetchLokalise) {
  const response = await fetch(baseApiUrl + endpoint, {
    headers: { "Accept": "application/json", "Content-Type": "application/json", "x-api-token": authToken as string },
    ...props,
  })

  return response;
}

async function handleResponse({response, endpoint}: HandleResponse) {
  if (!response.ok) {
    const message = `${endpoint}: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return data;
}

function stringToBase64(translations: Translation) {
    const jsonString = JSON.stringify(translations);
    let base64Data;
    try {
      // Json string to UTF-8 bytes then to ascii then to base64
        base64Data = btoa(new TextEncoder().encode(jsonString).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    } catch (e) {
      const errorMessage = `Failed to base64 encode translations: ${e}`;
      console.log(errorMessage);
      throw new Error(errorMessage);
    }

    return base64Data;
}

export async function getProjects({authToken}: AuthToken) {
  const endpoint = 'projects'

  const response = await fetchLokalise({endpoint, authToken})
  const data = await handleResponse({response, endpoint: "getProjects"})
  return data;
}

export async function getProjectLanguages({authToken, projectId}: ProjectCredentials) {
  const endpoint = `projects/${projectId}/languages`

  const response = await fetchLokalise({endpoint, authToken})
  const data = await handleResponse({response, endpoint: "getProjectLanguages"})
  return data;
}

export async function getTranslationsKeys(
  {authToken, projectId}: ProjectCredentials,
): Promise<LokaliseKey[]> {
  const endpoint = `projects/${projectId}/keys?limit=5000`

  const response = await fetchLokalise({endpoint, authToken})
  const {keys} = await handleResponse({response, endpoint: "getTranslationsKeys"})  
  return keys;
}   

export async function downloadAllTranslationsAsJson(
    {authToken, projectId}: ProjectCredentials,
): Promise<LokaliseData> {
    const endpoint = `projects/${projectId}/translations?disable_references=1&limit=5000`

    const response = await fetchLokalise({endpoint, authToken})
    const {translations} = await handleResponse({response, endpoint: "downloadAllTranslationsAsJson"})

    // Get all keys
    const keys = await getTranslationsKeys({authToken, projectId})

    // Group translations by language code
    const result: LokaliseData = {};
    
    for (const translation of translations) {
        const langCode = translation.language_iso // Use language_iso directly
        const keyName = keys.find(key => key.key_id === translation.key_id)?.key_name.web;

        if(!langCode || !keyName) continue
      
        if (!result[langCode]) {
            result[langCode] = {}
        }
        result[langCode][keyName] = translation.translation;
    }

    return result;
}

export async function uploadTranslations(
    {authToken, projectId, langIso, filename, translations}: UploadTranslations, 
  ): Promise<UploadTranslations> {
    const base64Data = stringToBase64(translations);
    const endpoint = `projects/${projectId}/files/upload`;
  
    const response = await fetchLokalise({endpoint, authToken, method: "POST", body: JSON.stringify({
            data: base64Data, 
            filename: filename,
            lang_iso: langIso,
            tags: ["Framer"],
            // Config
            replace_modified: false,
            replace_breaks: false,
            detect_icu_plurals: true,
            skip_detect_lang_iso: true,
        }),
    });
  
    const data = await handleResponse({response, endpoint: "uploadSingleLanguageTranslations"})
    return data;
  }