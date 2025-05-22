import { framer } from "framer-plugin"
import { useEffect, useState } from "react"
import { type DataSource, getDataSource } from "./data"
import {
    getComponents,
    getStoryblokSpacesFromPersonalAccessToken,
    type StoryblokSpace,
    type StoryblokComponent,
    getApiKeys,
    type StoryblokApiKey,
    type StoryblokStory,
    getStoriesWithComponent,
} from "./storyblok"
import type StoryblokClient from "storyblok-js-client"

interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
    token: string
}

type ClientWithRegion = {
    region: string
    client: StoryblokClient
}

type SelectedComponent = {
    id: string
    name: string
}

export function SelectDataSource({ onSelectDataSource, token }: SelectDataSourceProps) {
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("")
    const [spaces, setSpaces] = useState<StoryblokSpace[]>([])
    const [components, setComponents] = useState<StoryblokComponent[]>([])
    const [selectedComponent, setSelectedComponent] = useState<SelectedComponent | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [apiKeys, setApiKeys] = useState<StoryblokApiKey[] | null>(null)
    const [clients, setClients] = useState<ClientWithRegion[]>([])
    const [storiesByComponent, setStoriesByComponent] = useState<StoryblokStory[]>([])

    useEffect(() => {
        getStoryblokSpacesFromPersonalAccessToken(token).then(result => {
            // Flatten spaces while preserving their region information
            const spacesWithRegion = result.spaces.flatMap((spaces, index) => {
                const client = result.clients[index]
                if (!client) return []
                return spaces.map(space => ({
                    ...space,
                    region: client.region,
                }))
            })
            setSpaces(spacesWithRegion)
            const clients = [...result.clients]
            setClients(clients)

            // If we have a selected space, fetch its components
            if (selectedDataSourceId) {
                const selectedSpace = spacesWithRegion.find(space => space.id.toString() === selectedDataSourceId)
                if (selectedSpace) {
                    const client = clients.find(c => c.region === selectedSpace.region)?.client
                    if (client) {
                        getComponents(client, Number.parseInt(selectedDataSourceId))
                            .then(setComponents)
                            .catch(error => {
                                console.error("Failed to fetch components:", error)
                            })
                    }
                }
            }
        })
    }, [token, selectedDataSourceId])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        try {
            setIsLoading(true)

            // Ensure we have stories before proceeding
            if (!storiesByComponent.length && selectedComponent) {
                const space = spaces.find(s => s.id.toString() === selectedDataSourceId)
                if (space) {
                    await fetchStories(selectedDataSourceId, selectedComponent.id)
                }
            }

            if (!selectedComponent) return

            const dataSource = await getDataSource(selectedComponent.name, storiesByComponent)
            onSelectDataSource(dataSource)
        } catch (error) {
            console.error(error)
            framer.notify(`Failed to load data source "${selectedComponent?.name}". Check the logs for more details.`, {
                variant: "error",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch stories for a given component
    const fetchStories = async (spaceId: string, componentId: string) => {
        const space = spaces.find(s => s.id.toString() === spaceId)
        const component = components.find(c => c.id.toString() === componentId)
        const publicKey = apiKeys?.find(k => k.access === "public")
        const client = space ? clients.find(c => c.region === space.region)?.client : null

        if (!space || !component || !publicKey || !client) return

        try {
            const stories = await getStoriesWithComponent(space.id, component.name, publicKey, client)
            setStoriesByComponent(stories)
        } catch (error) {
            console.error("Failed to fetch stories:", error)
            framer.notify("Failed to fetch stories for this component", { variant: "error" })
        }
    }

    return (
        <div className="framer-hide-scrollbar setup">
            <img src="/asset.jpg" alt="Greenhouse Hero" onDragStart={e => e.preventDefault()} />

            <form onSubmit={handleSubmit}>
                <label>
                    <p>Space</p>
                    <select
                        id="spaces"
                        onChange={async event => {
                            const selectedSpaceId = event.target.value
                            setSelectedDataSourceId(selectedSpaceId)

                            const selectedSpace = spaces.find(space => space.id.toString() === selectedSpaceId)
                            if (selectedSpace) {
                                const client = clients.find(c => c.region === selectedSpace.region)?.client
                                if (client) {
                                    const keys = await getApiKeys(selectedSpace.id, client)
                                    setApiKeys(keys)
                                }
                            }
                        }}
                        value={selectedDataSourceId}
                        disabled={isLoading || spaces.length === 0}
                    >
                        <option value="" disabled>
                            {isLoading ? "Loading spaces..." : "Choose Space..."}
                        </option>
                        {spaces.map(({ id, name }) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <p>Collection</p>
                    <select
                        id="components"
                        onChange={event => {
                            const componentId = event.target.value
                            const component = components.find(c => c.id.toString() === componentId)
                            if (component) {
                                setSelectedComponent({ id: componentId, name: component.name })
                                fetchStories(selectedDataSourceId, componentId)
                            }
                        }}
                        value={selectedComponent?.id || ""}
                        disabled={isLoading || components.length === 0}
                    >
                        <option value="" disabled>
                            {isLoading ? "Loading Collections..." : "Choose Collection..."}
                        </option>
                        {components.map(({ id, name }) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <button disabled={!selectedComponent || isLoading} type="submit">
                    {isLoading ? <div className="framer-spinner" /> : "Next"}
                </button>
            </form>
        </div>
    )
}
