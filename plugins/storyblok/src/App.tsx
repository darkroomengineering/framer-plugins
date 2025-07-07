import "./App.css"
import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useState } from "react"
import { type DataSource, getDataSource, personalAccessToken } from "./data"
import { FieldMapping } from "./components/FieldMapping.tsx"
import { SelectDataSource } from "./components/SelectDataSource"
import { Auth } from "./components/Auth"
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
    const [accessToken, setAccessToken] = useState<string | null>()
    const [dataSource, setDataSource] = useState<DataSource | null>(null)
    const [isLoading, setIsLoading] = useState(
        Boolean(previousDataSourceId || previousPersonalAccessToken || previousSpaceId || previousRegion)
    )

    useEffect(() => {
        if (accessToken) {
            setAccessToken(accessToken)
            localStorage.setItem(personalAccessToken, accessToken)
        }
    }, [accessToken])

    useEffect(() => {
        framer.showUI({
            width: 320,
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
                    setAccessToken(previousPersonalAccessToken)
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
                        setAccessToken(token)
                    }}
                />
            </Page>
        )
    }

    if (!dataSource) {
        return (
            <Page>
                <SelectDataSource onSelectDataSource={setDataSource} accessToken={setAccessToken} />
            </Page>
        )
    }

    return (
        <Page>
            <FieldMapping collection={collection} dataSource={dataSource} initialSlugFieldId={previousSlugFieldId} />
        </Page>
    )
}
