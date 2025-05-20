import StoryblokClient from "storyblok-js-client"

// TODO: Add more regions
type StoryblokRegion = "us" | "eu" | "ca"


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
    description: string
    image: string   
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
}

// Retrieve multiple stories with CDA for a specific space
export async function getStories(storyblok: StoryblokClient, apiKeys: StoryblokApiKey[]) {
    
    apiKeys.map(async (apiKey) => {
        if(apiKey.access === 'private') {
            const response = await storyblok.get('cdn/stories/', {
                token: apiKey.token,
            })

            return response.data.stories
        }
    })
}

// Get api keys for a given space
export async function getApiKeys(spaceId: number, storyblok: StoryblokClient) {

    const response = await storyblok.get(`spaces/${spaceId}/api_keys/`, {})
    
    return response.data.api_keys as StoryblokApiKey[]
}

// Get all stories for a given space and component name
export async function getStoriesWithComponent(spaceId: number, componentName: string, apiKey: StoryblokApiKey, storyblok: StoryblokClient) {

    // Fetch stories with public api key
    if(apiKey.access === 'public') {
            const response = await storyblok.get(`cdn/spaces/${spaceId}/stories/`, {
                token: apiKey.token,
                "search_term": componentName,
            })

        return response.data.stories as StoryblokStory[]
    }
    throw new Error("No public api key found")
}

// Get all components for a given space
export async function getComponents(storyblok: StoryblokClient, spaceId: number) {
    const response = await storyblok.get(`spaces/${spaceId}/components/`, {})

    return response.data.components as StoryblokComponent[]
}

// Get all spaces for a given region
export async function getSpaces(storyblok: StoryblokClient) {

    const response = await storyblok.get('spaces/', {})

    const spaces = response.data.spaces as StoryblokSpace[]

    return spaces
}

export async function getStoryblokSpacesFromPersonalAccessToken(token: string) {

    const getStoryblokClient = (region: StoryblokRegion, token: string) => {

        if (!token) {
            throw new Error("No token found")
        }

        const storyblokClient = new StoryblokClient({
            oauthToken: token,
            region: region,
        })

        return storyblokClient
    }

    const clients = [
        { region: "us", client: getStoryblokClient("us", token) },
        { region: "eu", client: getStoryblokClient("eu", token) },
        { region: "ca", client: getStoryblokClient("ca", token) }
    ] as const

    const spacesByRegion = await Promise.all(clients.map(async (client) => {

        const spaces = await getSpaces(client.client)
        return {
            region: client.region,
            spaces: spaces
        }
    }))

    return {spaces: spacesByRegion.map((space) => space.spaces), clients: clients}
}