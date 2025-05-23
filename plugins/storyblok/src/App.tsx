import "./App.css"

import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useState } from "react"
import { type DataSource, PLUGIN_KEYS } from "./data"
import { FieldMapping } from "./components/FieldMapping.tsx"
import { SelectDataSource } from "./components/SelectDataSource"
import { Auth } from "./components/auth"
import Page from "./page"
import { getTokenValidity } from "./storyblok"

interface AppProps {
    collection: ManagedCollection
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
    previousPersonalAccessToken: string | null
    previousSpaceId: string | null
    previousRegion: string | null
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
                    throw new Error(
                        `Error loading previously configured personal access token “${previousPersonalAccessToken}”. Check the logs for more details.`
                    )
                }

                // TODO: get spaces and clients
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
    }, [previousPersonalAccessToken])

    // Manage Button functionality
    // useEffect(() => {
    //     if (!previousDataSourceId) {
    //         return
    //     }

    //     const abortController = new AbortController()

    //     setIsLoadingDataSource(true)
    //     getDataSource(previousDataSourceId, abortController.signal)
    //         .then(setDataSource)
    //         .catch(error => {
    //             if (abortController.signal.aborted) return

    //             console.error(error)
    //             framer.notify(
    //                 `Error loading previously configured data source “${previousDataSourceId}”. Check the logs for more details.`,
    //                 {
    //                     variant: "error",
    //                 }
    //             )
    //         })
    //         .finally(() => {
    //             if (abortController.signal.aborted) return

    //             setIsLoadingDataSource(false)
    //         })

    //     return () => {
    //         abortController.abort()
    //     }
    // }, [previousDataSourceId])

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
