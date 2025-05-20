const devMode = import.meta.env.MODE === "development"
const baseApiUrl = devMode 
? "/api/lokalise-proxy" 
: "https://api.lokalise.com/api2";


export async function getProjects(apiKey: string) {
  const endpoint = baseApiUrl + "/projects"
    const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Accept": "application/json", "x-api-token": apiKey },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Lokalise API Error (getProjects): ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    return response.json();
}

export async function getProjectLanguages(apiKey: string, projectId: string) {
  const endpoint = `${baseApiUrl}/projects/${projectId}/languages`
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { "Accept": "application/json", "x-api-token": apiKey },
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Lokalise API Error (getProjectLanguages): ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
  }
  return response.json();
}

export async function uploadSingleLanguageTranslations(
  apiKey: string,
  projectId: string,
  langIso: string, // e.g., "en_US"
  filename: string, // e.g., "en_US.json"
  translations: Record<string, string> // The actual key-value translations for this language
) {
  const jsonString = JSON.stringify(translations);
  let base64Data;
  try {
      // Using btoa for browser environment. Note its limitations with complex Unicode.
      // For server-side or more robust client-side, consider TextEncoder/TextDecoder for UTF-8 to Uint8Array then to base64.
      base64Data = btoa(unescape(encodeURIComponent(jsonString)));
  } catch (e) {
      console.error("Error base64 encoding translations:", e);
      throw new Error("Failed to base64 encode translations. Check for complex Unicode characters if issues persist.");
  }

  const endpoint = `${baseApiUrl}/projects/${projectId}/files/upload`;

  const response = await fetch(endpoint, {
      method: "POST",
      headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-token": apiKey,
      },
      body: JSON.stringify({
          data: base64Data,
          filename: filename,
          lang_iso: langIso,
      }),
  });

  const responseData = await response.json().catch(() => ({ message: "Failed to parse JSON response" }));

  if (!response.ok) {
      console.error("Lokalise upload error response body:", responseData);
      const message = responseData.error?.message || JSON.stringify(responseData);
      throw new Error(`Lokalise API Error (uploadTranslations): ${response.status} - ${message}`);
  }
  return responseData;
}

export async function getTransitionsKeys(
  authToken: string,
  projectId: string,
  languageId: number
) {
  const endpoint = `${baseApiUrl}/projects/${projectId}/keys?filter_lang_id=${languageId}&limit=5000`
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { "Accept": "application/json", "x-api-token": authToken },
  })
  const {keys} = await response.json();
  return keys;
}   

/**
 * Fetches translations for a specific language directly from the Lokalise API
 * as JSON and returns a flat key-value map.
 */

export async function getTranslationsAsJson(
    authToken: string,
    projectId: string,
    langIso: string, 
    languageId: number
): Promise<Record<string, string>> {
    const translationsUrl = `${baseApiUrl}/projects/${projectId}/translations?filter_lang_id=${languageId}&disable_references=1&limit=5000`;

    const response = await fetch(translationsUrl, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "x-api-token": authToken,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log(
            `Error fetching translations as JSON from Lokalise for project ${projectId}, lang_id ${languageId} (iso: ${langIso}):`,
            errorData
        );
        throw new Error(
            `Failed to fetch translations for ${langIso} (ID: ${languageId}): ${errorData.error?.message || response.statusText}`
        );
    }

    const {translations} = await response.json();
    // We need the keys to map id to keys name
    const keys = await getTransitionsKeys(authToken, projectId, languageId)

    return mapTranslationsToKeys(keys, translations);
}

function mapTranslationsToKeys(keys: any, translations: any) {
    const keyIdToName: Record<string, string> = {};
    for (const key of keys) {
        // Use the appropriate platform key or 'other'
        keyIdToName[key.key_id] = key.key_name.web;
    }

    const result = {};
    for (const translation of translations) {
        const keyName = keyIdToName[translation.key_id];
        if (keyName) {
            console.log(keyName,translation.translation)
            result[keyName] = translation.translation;
        }
    }
    return result;
}