import { framer, useIsAllowedTo } from "framer-plugin"
import { useCallback, useEffect, useState } from "react"
import StoryblokClient from "storyblok-js-client"
import hero from "../assets/hero.png"
import { accessTokenPluginKey, type DataSource, getDataSource, syncMethods } from "../data"
import {
    getComponentsFromSpaceId,
    getStoryblokSpacesAndClientsByRegion,
    getTokenValidity,
    type StoryblokComponent,
    type StoryblokRegion,
    type StoryblokSpace,
} from "../storyblok"

interface SelectDataSourceProps {
    previousSpaceId?: string | null
    onSelectSpaceId: (spaceId: string) => void
    previousAccessToken?: string | null
    onSelectAccessToken: (accessToken: string) => void
    previousDataSourceId?: string | null
    onSelectDataSource: (dataSource: DataSource) => void
}

export function SelectDataSource({
    previousSpaceId,
    onSelectSpaceId,
    previousAccessToken,
    onSelectAccessToken,
    previousDataSourceId,
    onSelectDataSource,
}: SelectDataSourceProps) {
    const [accessToken, setAccessToken] = useState<string | null>(previousAccessToken ?? "")
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(previousSpaceId ?? "")
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>(previousDataSourceId ?? "")

    const [selectedRegion, setSelectedRegion] = useState<StoryblokRegion | null>(null)
    const [spacesByRegion, setSpacesByRegion] = useState<Record<StoryblokRegion, StoryblokSpace[]>>(
        {} as Record<StoryblokRegion, StoryblokSpace[]>
    )
    const [clientsByRegion, setClientsByRegion] = useState<Record<StoryblokRegion, StoryblokClient>>(
        {} as Record<StoryblokRegion, StoryblokClient>
    )
    const spaces = Object.values(spacesByRegion).flat()
    const [collections, setCollections] = useState<StoryblokComponent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isValidAccessToken, setIsValidAccessToken] = useState(false)
    const isAllowedToManage = useIsAllowedTo("ManagedCollection.setFields", ...syncMethods)

    const validateAccessToken = useCallback((token: string | null) => {
        setAccessToken(token)
        if (token) {
            setIsLoading(true)
            getTokenValidity(token)
                .then(isValid => {
                    if (isValid) {
                        framer.notify("Access Token Is Valid. Loading Spaces...", {
                            variant: "success",
                        })
                        getStoryblokSpacesAndClientsByRegion(token)
                            .then(spacesClientCollection => {
                                setSpacesByRegion(spacesClientCollection.spacesByRegion)
                                setClientsByRegion(spacesClientCollection.clientsByRegion)
                                setIsValidAccessToken(true)
                                selectSpace(
                                    selectedSpaceId,
                                    spacesClientCollection.spacesByRegion,
                                    spacesClientCollection.clientsByRegion
                                )
                            })
                            .catch(error => {
                                console.error(error)
                                framer.notify(error instanceof Error ? error.message : "An unknown error occurred", {
                                    variant: "error",
                                })
                            })
                    } else {
                        setIsValidAccessToken(false)
                        framer.notify("Please Provide Valid Access Token", {
                            variant: "error",
                        })
                    }
                })
                .catch(error => {
                    console.error(error)
                    framer.notify(error instanceof Error ? error.message : "An unknown error occurred", {
                        variant: "error",
                    })
                })
                .finally(() => {
                    setIsLoading(false)
                })
        }
    }, [])
    const selectSpace = useCallback(
        (
            spaceIdValue: string | null,
            spaceCollection: Record<StoryblokRegion, StoryblokSpace[]> | null,
            clientCollection: Record<StoryblokRegion, StoryblokClient>
        ) => {
            if (spaceIdValue) {
                setIsLoading(true)
                if (spaceCollection) {
                    const selectedSpace = Object.values(spaceCollection)
                        .flat()
                        .find(space => space.id.toString() === spaceIdValue.toString())
                    if (selectedSpace) {
                        let selectedClientId: StoryblokRegion | null = null
                        for (const [region, spaces] of Object.entries(spaceCollection)) {
                            if (spaces.find(space => space.id.toString() === spaceIdValue.toString())) {
                                selectedClientId = region as StoryblokRegion
                                setSelectedRegion(region as StoryblokRegion)
                                break
                            }
                        }
                        if (!selectedClientId) {
                            framer.notify("No client found for selected space", {
                                variant: "error",
                            })
                        } else {
                            getComponentsFromSpaceId(clientCollection[selectedClientId], spaceIdValue)
                                .then(componentsCollection => {
                                    setCollections(componentsCollection)
                                    console.log(selectedDataSourceId)
                                })
                                .catch(error => {
                                    framer.notify(
                                        error instanceof Error ? error.message : "An unknown error occurred",
                                        {
                                            variant: "error",
                                        }
                                    )
                                })
                                .finally(() => {
                                    setIsLoading(false)
                                })
                        }
                    }
                }
            }
            setSelectedSpaceId(spaceIdValue)
        },
        []
    )
    const handleSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()

            setIsLoading(true)

            getDataSource(accessToken, selectedSpaceId, selectedDataSourceId, selectedRegion)
                .then(dataSource => {
                    onSelectSpaceId(selectedSpaceId ?? "")
                    onSelectDataSource(dataSource ?? "")
                    onSelectAccessToken(accessToken ?? "")
                })
                .catch(error => {
                    console.error(error)
                    framer.notify(error instanceof Error ? error.message : "An unknown error occurred", {
                        variant: "error",
                    })
                })
                .finally(() => {
                    setIsLoading(false)
                })
        },
        [
            selectedSpaceId,
            accessToken,
            selectedDataSourceId,
            selectedRegion,
            onSelectSpaceId,
            onSelectAccessToken,
            onSelectDataSource,
        ]
    )
    useEffect(() => {
        if (!accessToken) return
        if (accessToken === previousAccessToken) {
            validateAccessToken(accessToken)
        }
    }, [accessToken, previousAccessToken, validateAccessToken])

    const isButtonDisabled =
        !accessToken || !isValidAccessToken || !selectedDataSourceId || isLoading || !isAllowedToManage

    return (
        <main className="framer-hide-scrollbar setup">
            <img className={!isValidAccessToken ? "image" : ""} src={hero} alt="Storyblok Hero" />

            <form onSubmit={handleSubmit}>
                <label className="show">
                    <p>Access Token</p>
                    <input
                        id="accessToken"
                        type="text"
                        required
                        placeholder="Enter Access Token…"
                        value={!accessToken ? "" : accessToken}
                        onChange={event => validateAccessToken(event.target.value)}
                    />
                </label>
                <label className={!isValidAccessToken ? "hide" : "show"}>
                    <p>Space ID</p>
                    <select
                        id="spaceId"
                        required
                        onChange={event => selectSpace(event.target.value, spacesByRegion, clientsByRegion)}
                        value={selectedSpaceId ? selectedSpaceId : ""}
                        disabled={!isValidAccessToken}
                    >
                        <option value="">Choose Space…</option>
                        {spaces.map(({ id, name }) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={!isValidAccessToken ? "hide" : "show"}>
                    <p>Collection</p>
                    <select
                        id="collection"
                        required
                        onChange={event => (selectedSpaceId ? setSelectedDataSourceId(event.target.value) : "")}
                        value={selectedDataSourceId}
                        disabled={!isValidAccessToken || !selectedSpaceId}
                    >
                        <option value="" disabled>
                            Choose Source…
                        </option>
                        {collections.map(({ id, name }) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <button disabled={isButtonDisabled}>{isLoading ? <div className="framer-spinner" /> : "Next"}</button>
            </form>
        </main>
    )
}
