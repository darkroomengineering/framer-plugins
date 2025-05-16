import { framer } from "framer-plugin"
import { useState, useCallback } from "react"
import { type DataSource, getApiKeys, getComponents, getDataSource, getSpaces, STORYBLOK_REGIONS, type StoryblokComponent, type StoryblokRegion, type StoryblokSpace } from "./data"
import StoryblokClient from "storyblok-js-client"


interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
}

export function SelectDataSource({ onSelectDataSource }: SelectDataSourceProps) {
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("")
    const [selectedRegion, setSelectedRegion] = useState<StoryblokRegion | string>('init')
    const [spaces, setSpaces] = useState<StoryblokSpace[]>([])
    const [components, setComponents] = useState<StoryblokComponent[]>([])
    const [selectedComponent, setSelectedComponent] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [storyblok, setStoryblok] = useState<StoryblokClient>()

    const getStoryblokClient = useCallback((region: StoryblokRegion) => {
        const token = localStorage.getItem("storyblok_token")

        if (!token) {
            throw new Error("No token found")
        }

        const storyblokClient = new StoryblokClient({
            oauthToken: token,
            region: region,
        })

        return storyblokClient
    }, [])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        try {
            setIsLoading(true)
            localStorage.setItem("storyblok_region", selectedRegion)
            if (!storyblok) {
                throw new Error("No Storyblok client available")
            }
            const dataSource = await getDataSource(selectedDataSourceId, storyblok)
            onSelectDataSource(dataSource)
        } catch (error) {
            console.error(error)
            framer.notify(`Failed to load data source "${selectedDataSourceId}". Check the logs for more details.`, {
                variant: "error",
            })
        } finally {
            setIsLoading(false)
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
                <label htmlFor="region">
                    <select
                        id="region"
                        onChange={event => {
                            const region = event.target.value as StoryblokRegion
                            setSelectedRegion(region)
                            const client = getStoryblokClient(region)
                            getSpaces(client).then((value) => {
                                setSpaces(value.spaces)
                                setStoryblok(client)
                            })
                        }}
                        value={selectedRegion}
                    >
                        <option value='init' disabled>Select Region</option>
                        <option value={STORYBLOK_REGIONS.US}>United States (US)</option>
                        <option value={STORYBLOK_REGIONS.EU}>Europe (EU)</option>
                        <option value={STORYBLOK_REGIONS.CA}>Canada (CA)</option>
                        <option value={STORYBLOK_REGIONS.AP}>Asia Pacific (AP)</option>
                        <option value={STORYBLOK_REGIONS.CN}>China (CN)</option>
                    </select>
                </label>

                <label htmlFor="spaces">
                    <select
                        id="spaces"
                        onChange={event => {
                            const spaceId = Number(event.target.value)
                            setSelectedDataSourceId(event.target.value)
                            if (spaceId && storyblok) {
                                getComponents(storyblok, spaceId).then((value) => {
                                    setComponents(value)
                                })
                                getApiKeys(spaceId, storyblok)
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
                            setSelectedComponent(event.target.value)
                        }}
                        value={selectedComponent}
                        disabled={isLoading || components.length === 0}
                    >
                        <option value="" disabled>
                            {isLoading ? "Loading components..." : "Choose Component..."}
                        </option>
                        {components.map(({ id, name }) => (
                            <option key={id} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <button disabled={!selectedDataSourceId || isLoading} type="submit">
                    {isLoading ? <div className="framer-spinner" /> : "Next"}
                </button>
            </form>
        </main >
    )
}
