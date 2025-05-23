import { useEffect, useState } from "react"
import { type DataSource, getDataSource } from "../data"
import {
    type StoryblokSpace,
    type StoryblokComponent,
    type StoryblokRegion,
    getComponentsFromSpaceId,
    getStoryblokSpacesAndClientsByRegion,
} from "../storyblok"
import type StoryblokClient from "storyblok-js-client"
import { framer } from "framer-plugin"

interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
    personalAccessToken: string
}

export function SelectDataSource({ onSelectDataSource, personalAccessToken }: SelectDataSourceProps) {
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>()
    const [selectedRegion, setSelectedRegion] = useState<StoryblokRegion | null>(null)
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>()

    const [spacesByRegion, setSpacesByRegion] = useState<Record<StoryblokRegion, StoryblokSpace[]>>(
        {} as Record<StoryblokRegion, StoryblokSpace[]>
    )
    const spaces = Object.values(spacesByRegion).flat()

    const [clientsByRegion, setClientsByRegion] = useState<Record<StoryblokRegion, StoryblokClient>>(
        {} as Record<StoryblokRegion, StoryblokClient>
    )
    // const clients = Object.values(clientsByRegion).flat()

    const [collections, setCollections] = useState<StoryblokComponent[]>([])
    // const [selectedComponent, setSelectedComponent] = useState<SelectedComponent | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function fetchSpacesAndClients() {
            const { spacesByRegion, clientsByRegion } = await getStoryblokSpacesAndClientsByRegion(personalAccessToken)

            setSpacesByRegion(spacesByRegion)
            setClientsByRegion(clientsByRegion)
        }

        fetchSpacesAndClients()

        return () => {
            setSpacesByRegion({} as Record<StoryblokRegion, StoryblokSpace[]>)
            setClientsByRegion({} as Record<StoryblokRegion, StoryblokClient>)
        }
    }, [personalAccessToken])

    useEffect(() => {
        async function init() {
            if (selectedSpaceId) {
                const selectedSpace = Object.values(spacesByRegion)
                    .flat()
                    .find(space => space.id === selectedSpaceId)

                if (!selectedSpace) {
                    console.error("No space found for selected space id")
                    return
                }

                let selectedClientId: StoryblokRegion | null = null

                for (const [region, spaces] of Object.entries(spacesByRegion)) {
                    if (spaces.find(space => space.id === selectedSpaceId)) {
                        selectedClientId = region as StoryblokRegion
                        setSelectedRegion(region as StoryblokRegion)
                        break
                    }
                }

                if (!selectedClientId) {
                    console.error("No client found for selected space")
                    return
                }

                const selectedClient = clientsByRegion[selectedClientId]

                const components = await getComponentsFromSpaceId(selectedClient, selectedSpaceId)
                setCollections(components)
            }
        }

        init()

        return () => {
            setCollections([])
            setSelectedCollectionId(null)
            setSelectedRegion(null)
        }
    }, [selectedSpaceId, spacesByRegion, clientsByRegion])

    useEffect(() => {
        console.log("selectedSpaceId", selectedSpaceId)
        console.log("selectedCollectionId", selectedCollectionId)
        console.log("selectedRegion", selectedRegion)
    }, [selectedSpaceId, selectedCollectionId, selectedRegion])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        console.log({ selectedRegion, selectedSpaceId, selectedCollectionId })

        if (!selectedRegion || !selectedSpaceId || !selectedCollectionId) {
            console.error("Missing required fields")
            return
        }

        // await getDataSource({
        //     personalAccessToken,
        //     region: selectedRegion,
        //     spaceId: selectedSpaceId,
        //     collectionId: selectedCollectionId,
        // })

        try {
            setIsLoading(true)

            const dataSource = await getDataSource({
                personalAccessToken,
                region: selectedRegion,
                spaceId: selectedSpaceId,
                collectionId: selectedCollectionId,
            })
            // return
            onSelectDataSource(dataSource)
        } catch (error) {
            console.error(error)
            framer.notify(`Failed to load data source “${selectedCollectionId}”. Check the logs for more details.`, {
                variant: "error",
            })
        } finally {
            setIsLoading(false)
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

                            setSelectedSpaceId(Number(selectedSpaceId))
                        }}
                        value={selectedSpaceId ? String(selectedSpaceId) : ""}
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
                        id="collections"
                        onChange={event => {
                            const selectedCollectionId = event.target.value

                            setSelectedCollectionId(parseInt(selectedCollectionId))
                        }}
                        value={selectedCollectionId ? String(selectedCollectionId) : ""}
                        disabled={isLoading || collections.length === 0}
                    >
                        <option value="" disabled>
                            {isLoading ? "Loading Collections..." : "Choose Collection..."}
                        </option>
                        {collections.map(({ id, name }) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <button disabled={!selectedCollectionId || isLoading} type="submit">
                    {isLoading ? <div className="framer-spinner" /> : "Next"}
                </button>
            </form>
        </div>
    )
}
