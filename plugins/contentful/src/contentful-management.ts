import { createClient, ClientAPI } from "contentful-management"

let contentfulClient: ClientAPI | null = null

export const initContentfulManagement = (accessToken: string) => {
    contentfulClient = createClient({
        accessToken,
    })
}

export const getSpaces = async () => {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const entries = await contentfulClient.getSpaces()

    return entries.items
}

export const getSpace = async (spaceId: string) => {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const space = await contentfulClient.getSpace(spaceId)

    return space
}

export const getApiKeys = async (spaceId: string) => {
    if (!contentfulClient) throw new Error("Contentful client not initialized")

    const space = await getSpace(spaceId)
    const entries = await space.getApiKeys()

    return entries.items
}
