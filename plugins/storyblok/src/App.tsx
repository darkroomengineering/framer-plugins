import "./App.css"
import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useLayoutEffect, useState } from "react"
import { FieldMapping } from "./components/FieldMapping"
import { Loading } from "./components/Loading"
import { SelectDataSource } from "./components/SelectDataSource"
import { accessTokenPluginKey, type DataSource, getDataSource, spaceIdPluginKey } from "./data"
import { type StoryblokRegion } from "./storyblok"

interface AppProps {
    collection: ManagedCollection
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
    previousAccessToken: string | null
    previousSpaceId: string | null
    previousRegion: StoryblokRegion
}

export function App({
    collection,
    previousDataSourceId,
    previousSlugFieldId,
    previousAccessToken,
    previousSpaceId,
    previousRegion,
}: AppProps) {
    const [accessToken, setAccessToken] = useState<string | null>(previousAccessToken ?? "")
    const [spaceId, setSpaceId] = useState<string | null>(previousSpaceId ?? "")
    const [dataSource, setDataSource] = useState<DataSource | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useLayoutEffect(() => {
        const hasDataSourceSelected = Boolean(dataSource)

        framer.showUI({
            width: hasDataSourceSelected ? 400 : 320,
            height: hasDataSourceSelected ? 427 : 325,
            minHeight: hasDataSourceSelected ? 427 : undefined,
            minWidth: hasDataSourceSelected ? 400 : undefined,
            resizable: hasDataSourceSelected,
        })
    }, [dataSource])

    useEffect(() => {
        if (!previousAccessToken || !previousDataSourceId || !previousSpaceId) return
        setIsLoading(true)
        getDataSource(previousAccessToken, previousSpaceId, previousDataSourceId, previousRegion)
            .then(setDataSource)
            .catch(error => {
                console.error(`Error loading previously configured data source “${previousDataSourceId}”.`, error)
                framer.notify(`Error loading previously configured data source “${previousDataSourceId}”.`, {
                    variant: "error",
                })
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [previousSpaceId, previousDataSourceId, previousAccessToken, previousRegion])

    useEffect(() => {
        if (!accessToken) return
        if (accessToken === previousAccessToken) return

        if (framer.isAllowedTo("setPluginData")) {
            framer.setPluginData(accessTokenPluginKey, accessToken)
        }
    }, [accessToken, previousAccessToken])

    useEffect(() => {
        if (!spaceId) return
        if (spaceId === previousSpaceId) return

        if (framer.isAllowedTo("setPluginData")) {
            framer.setPluginData(spaceIdPluginKey, spaceId)
        }
    }, [spaceId, previousSpaceId])

    if (isLoading) {
        return <Loading />
    }

    if (!accessToken || !dataSource) {
        return (
            <SelectDataSource
                previousSpaceId={previousSpaceId}
                onSelectSpaceId={setSpaceId}
                onSelectAccessToken={setAccessToken}
                onSelectDataSource={setDataSource}
                previousDataSourceId={previousDataSourceId}
                previousAccessToken={previousAccessToken}
            />
        )
    }

    return <FieldMapping collection={collection} dataSource={dataSource} initialSlugFieldId={previousSlugFieldId} />
}
