import "./App.css"

import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useState } from "react"
import { type DataSource, getDataSource, PLUGIN_KEYS } from "./data"
import { FieldMapping } from "./components/FieldMapping.tsx"
import { SelectDataSource } from "./components/SelectDataSource"
import { Auth } from "./components/auth"
import Page from "./page"
import { getTokenValidity, type StoryblokRegion } from "./storyblok"

interface AppProps {
    collection: ManagedCollection
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
    previousPersonalAccessToken: string | null
    previousSpaceId: string | null
    previousRegion: StoryblokRegion | null
}

export function App({
    collection,
    previousDataSourceId,
    previousSlugFieldId,
    previousPersonalAccessToken,
    previousSpaceId,
    previousRegion,
}: AppProps) {
    const [personalAccessToken, setPersonalAccessToken] = useState<string | null>()
    const [dataSource, setDataSource] = useState<DataSource | null>(null)
    const [isLoading, setIsLoading] = useState(
        Boolean(previousDataSourceId || previousPersonalAccessToken || previousSpaceId || previousRegion)
    )

    useEffect(() => {
        if (personalAccessToken) {
            localStorage.setItem(PLUGIN_KEYS.PERSONAL_ACCESS_TOKEN, personalAccessToken)
        }
    }, [personalAccessToken])

    useEffect(() => {
        framer.showUI({
            width: 360,
            height: 350,
        })
    }, [])

    useEffect(() => {
        const abortController = new AbortController()

        async function init() {
            setIsLoading(true)

            try {
                if (abortController.signal.aborted) return

                if (!previousPersonalAccessToken) return

                const isValid = await getTokenValidity(previousPersonalAccessToken)
                if (isValid) {
                    setPersonalAccessToken(previousPersonalAccessToken)
                } else {
                    console.warn(
                        `Error loading previously configured personal access token “${previousPersonalAccessToken}”. Check the logs for more details.`
                    )
                    return
                }

                if (!previousRegion || !previousSpaceId || !previousDataSourceId) {
                    console.warn("Missing required fields")
                    return
                }

                const dataSource = await getDataSource({
                    personalAccessToken: previousPersonalAccessToken,
                    region: previousRegion,
                    spaceId: previousSpaceId,
                    collectionId: previousDataSourceId,
                })

                setDataSource(dataSource)
            } catch (error) {
                if (abortController.signal.aborted) return
                console.error(error)
                framer.notify(error instanceof Error ? error.message : "An unknown error occurred", {
                    variant: "error",
                })
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        init()

        return () => {
            abortController.abort()
        }
    }, [previousPersonalAccessToken, previousRegion, previousSpaceId, previousDataSourceId])

    if (isLoading) {
        return (
            <main className="loading">
                <div className="framer-spinner" />
            </main>
        )
    }

    if (!personalAccessToken) {
        return (
            <Page>
                <Auth
                    onValidToken={token => {
                        setPersonalAccessToken(token)
                    }}
                />
            </Page>
        )
    }

    if (!dataSource) {
        return (
            <Page previousPage="Authentication" onPreviousPage={() => setPersonalAccessToken(null)}>
                <SelectDataSource onSelectDataSource={setDataSource} personalAccessToken={personalAccessToken} />
            </Page>
        )
    }

    return (
        <Page previousPage="Data Source" onPreviousPage={() => setDataSource(null)}>
            <FieldMapping collection={collection} dataSource={dataSource} initialSlugFieldId={previousSlugFieldId} />
        </Page>
    )
}
