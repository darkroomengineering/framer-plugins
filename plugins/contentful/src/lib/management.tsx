import { createClient, type ClientAPI } from "contentful-management"

let contentfulClient: ClientAPI | null = null

export function initContentfulManagement(accessToken: string) {
    contentfulClient = createClient({
        accessToken,
    })
}

export async function getSpaces() {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const entries = await contentfulClient.getSpaces()

    return entries.items
}

export async function getSpace(spaceId: string) {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const space = await contentfulClient.getSpace(spaceId)

    return space
}

export async function getApiKeys(spaceId: string) {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const space = await getSpace(spaceId)
    const entries = await space.getApiKeys()

    return entries.items
}
