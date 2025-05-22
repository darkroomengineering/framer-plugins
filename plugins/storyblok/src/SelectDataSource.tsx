import { framer } from "framer-plugin"
import { useEffect, useState} from "react"
import { type DataSource, getDataSource,} from "./data"
import { getComponents, getStoryblokSpacesFromPersonalAccessToken, type StoryblokSpace, type StoryblokComponent, getApiKeys, type StoryblokApiKey, type StoryblokStory, getStoriesWithComponent } from "./storyblok"
import type StoryblokClient from "storyblok-js-client"

interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
}

type ClientWithRegion = {
    region: string
    client: StoryblokClient
}

type SelectedComponent = {
    id: string
    name: string
}

export function SelectDataSource({ onSelectDataSource }: SelectDataSourceProps) {
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("")
    const [spaces, setSpaces] = useState<StoryblokSpace[]>([])
    const [components, setComponents] = useState<StoryblokComponent[]>([])
    const [selectedComponent, setSelectedComponent] = useState<SelectedComponent | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [apiKeys, setApiKeys] = useState<StoryblokApiKey[] | null>(null)
    const [clients, setClients] = useState<ClientWithRegion[]>([])
    const [storiesByComponent, setStoriesByComponent] = useState<StoryblokStory[]>([])

    const token = localStorage.getItem("storyblok_token")

    useEffect(() => {
        getStoryblokSpacesFromPersonalAccessToken(token || "").then((result) => {
            // Flatten spaces while preserving their region information
            const spacesWithRegion = result.spaces.flatMap((spaces, index) => {
                const client = result.clients[index]
                if (!client) return []
                return spaces.map(space => ({
                    ...space,
                    region: client.region
                }))
            })
            setSpaces(spacesWithRegion)
            setClients([...result.clients])

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

    }, [token, selectedDataSourceId, clients])


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
        const publicKey = apiKeys?.find(k => k.access === 'public')
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
        <main className="framer-hide-scrollbar setup">
            <div className="intro">
                <div className="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none">
                        <title>Logo</title>
                        <path
                            fill="currentColor"
                            d="M15.5 8c3.59 0 6.5 1.38 6.5 3.083 0 1.702-2.91 3.082-6.5 3.082S9 12.785 9 11.083C9 9.38 11.91 8 15.5 8Zm6.5 7.398c0 1.703-2.91 3.083-6.5 3.083S9 17.101 9 15.398v-2.466c0 1.703 2.91 3.083 6.5 3.083s6.5-1.38 6.5-3.083Zm0 4.316c0 1.703-2.91 3.083-6.5 3.083S9 21.417 9 19.714v-2.466c0 1.702 2.91 3.083 6.5 3.083S22 18.95 22 17.248Z"
                        />
                    </svg>
                </div>
                <div className="content">
                    <h2>CMS Starter</h2>
                    <p>Everything you need to get started with a CMS Plugin.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <label htmlFor="spaces">
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
                <label htmlFor="components">
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
                            {isLoading ? "Loading components..." : "Choose Component..."}
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
        </main>
    )
}
