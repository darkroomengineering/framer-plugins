import StoryblokClient from "storyblok-js-client"
import type { StoryblokGenericFieldType } from "storyblok-schema-types"

export type StoryblokRegion = "us" | "eu" | "ca" | "ap" 

export interface StoryblokSpace {
    id: number
    name: string
    domain: string
    version: number
    region: StoryblokRegion
}

export interface StoryblokComponent {
    id: number
    name: string
    schema: StoryblokGenericFieldType
}

export interface StoryblokApiKey {
    id: number
    name: string
    token: string
    access: string
}

export interface StoryblokStory {
    id: number
    name: string
    content: Record<string, unknown>
}

// Retrieve multiple stories with CDA for a specific space
export async function getStories(storyblok: StoryblokClient, apiKeys: StoryblokApiKey[]) {
    apiKeys.map(async apiKey => {
        if (apiKey.access === "private") {
            const response = await storyblok.get("cdn/stories/", {
                token: apiKey.token,
            })

            return response.data.stories
        }
    })
}

// Get api keys for a given space
export async function getApiKeysFromSpaceId(storyblok: StoryblokClient, spaceId: string) {
    const response = await storyblok.get(`spaces/${spaceId}/api_keys/`, {})

    return response.data.api_keys as StoryblokApiKey[]
}

// Get all stories for a given space and component name
export async function getStoriesFromComponentName(
    spaceId: string,
    apiKey: StoryblokApiKey,
    storyblok: StoryblokClient
) {
    // Fetch stories with public api key
    if (apiKey.access === "public") {
        const response = await storyblok.get(`cdn/spaces/${spaceId}/stories/`, {
            token: apiKey.token,
            cv: Date.now(),
        })

        return response.data.stories as StoryblokStory[]
    }
    throw new Error("No public api key found")
}

// Get all components for a given space
export async function getComponentsFromSpaceId(storyblok: StoryblokClient, spaceId: string) {
    const response = await storyblok.get(`spaces/${spaceId}/components/`, {})

    return response.data.components as StoryblokComponent[]
}

export async function getComponentFromSpaceId(storyblok: StoryblokClient, spaceId: string, componentId: string) {
    const response = await storyblok.get(`spaces/${spaceId}/components/${componentId}`, {})

    return response.data.component as StoryblokComponent
}

// Get all spaces for a given region
export async function getSpaces(storyblok: StoryblokClient) {
    const response = await storyblok.get("spaces/", {})
    const spaces = response.data.spaces as StoryblokSpace[]


    return spaces
}

export async function getSpaceFromId(storyblok: StoryblokClient, spaceId: string) {
    const response = await storyblok.get(`spaces/${spaceId}`, {})

    return response.data.space as StoryblokSpace
}

export async function getStoryblokClient(region: StoryblokRegion, token: string) {
    if (!token) {
        throw new Error("No token found")
    }

    const storyblokClient = new StoryblokClient({
        cache: {
            clear: "manual",
            type: "none",
        },
        oauthToken: token,
        region: region,
    })

    storyblokClient.flushCache()

    return storyblokClient
}

export async function getStoryblokSpacesAndClientsByRegion(token: string): Promise<{
    spacesByRegion: Record<StoryblokRegion, StoryblokSpace[]>
    clientsByRegion: Record<StoryblokRegion, StoryblokClient>
}> {
    const clientsByRegion = {
        us: await getStoryblokClient("us", token),
        eu: await getStoryblokClient("eu", token),
        ca: await getStoryblokClient("ca", token),
        ap: await getStoryblokClient("ap", token),
    }

    const spaces = await Promise.all(
        Object.entries(clientsByRegion).map(async ([region, client]) => {
            const spaces = await getSpaces(client)
            return {
                region,
                spaces,
            }
        })
    )

    const spacesByRegion = spaces.reduce(
        (acc, curr) => {
            acc[curr.region as StoryblokRegion] = curr.spaces
            return acc
        },
        {} as Record<StoryblokRegion, StoryblokSpace[]>
    )

    return {
        spacesByRegion,
        clientsByRegion,
    }
}

export async function getTokenValidity(token: string): Promise<boolean> {
    const response = await fetch("https://api.storyblok.com/v1/spaces/", {
        headers: {
            Authorization: token,
        },
    })

    if (!response.ok) {
        throw new Error("Invalid token")
    }

    return true
}

export async function getStoriesFromSpaceId(storyblok: StoryblokClient, spaceId: string) {
    const apiKeys = await getApiKeysFromSpaceId(storyblok, spaceId)

    const publicApiKey = apiKeys.find(key => key.access === "public")

    if (!publicApiKey) {
        throw new Error("No public api key found")
    }


    let page = 1
    let maxPage = 2
    const perPage = 50 // max is 100
    const allItems: StoryblokStory[] = []

    while (page <= maxPage) {
        const response = await storyblok.get(`cdn/spaces/${spaceId}/stories/`, {
            cv: Date.now(),
            token: publicApiKey.token,
            per_page: perPage,
            page,
        })
        maxPage = Math.ceil(response.total / perPage)
        allItems.push(...response.data.stories)
        page++
    }

    return allItems as StoryblokStory[]
}

export async function getApiKeyFromSpaceId(storyblok: StoryblokClient, spaceId: string) {
    const response = await storyblok.get(`spaces/${spaceId}/api_keys/`, {})

    return response.data.api_keys as StoryblokApiKey[]
}

export function findBloks(object: Record<string, unknown>, collectionName: string) {
    const occurences: Record<string, unknown>[] = []

    for (const [key, value] of Object.entries(object)) {
        if (key === "component" && value === collectionName) {
            occurences.push(object)
        } else if (typeof value === "object" && value !== null) {
            occurences.push(...findBloks(value as Record<string, unknown>, collectionName))
        }
    }

    return occurences
}

export function findBloksInStories(stories: StoryblokStory[], collectionName: string) {
    const bloks = []
    const contents = stories.map(story => story.content)

    for (const content of contents) {
        bloks.push(...findBloks(content, collectionName))
    }

    // TODO REVIEW: check if this is needed is this a bug in storyblok?

    // Storyblok returning duplicated _uids when should be unique
    const uidCounts: { [key: string]: number } = {}
    
    // Process each block to ensure unique UIDs
    const uniqueBloks = bloks.map(block => {
        const uid = (block as { _uid: string })._uid
        if (!uid) return block
        
        if (uid in uidCounts) {
            uidCounts[uid]!++
            return { ...block, _uid: `${uid}_${uidCounts[uid]}` }
        }
        uidCounts[uid] = 0
        return block
    })

    return uniqueBloks
}
