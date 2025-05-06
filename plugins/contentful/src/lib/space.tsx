import { createClient, type ContentfulClientApi } from "contentful"

interface ContentfulConfig {
    spaceId: string | null
    accessToken: string | null
}

let contentfulClient: ContentfulClientApi<undefined> | null = null

export function initContentful(config: ContentfulConfig) {
    if (!config.accessToken || !config.spaceId) {
        throw new Error("Contentful client credentials not found")
    }

    contentfulClient = createClient({
        space: config.spaceId,
        accessToken: config.accessToken,
    })
}

export async function getContentTypes() {
    if (!contentfulClient) throw new Error("Contentful client not initialized")
    const response = await contentfulClient.getContentTypes()
    return response.items
}

export async function getContentType(contentTypeId: string) {
    if (!contentfulClient) throw new Error("Contentful client not initialized")
    const response = await contentfulClient.getContentType(contentTypeId)
    return response
}

export async function getEntriesForContentType(contentTypeId: string) {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    if (!contentTypeId) throw new Error("Content type ID not found")
    const entries = await contentfulClient.getEntries({
        content_type: contentTypeId,
    })

    return entries.items
}
