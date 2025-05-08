import { useCallback, useEffect, useRef, useState } from "react"
import { type DataSource, getDataSource } from "./data"
import { useContentfulStore } from "./store"
import type { ContentType } from "contentful"
import { getApiKeys } from "./lib/management"
import { getContentTypes, initContentful } from "./lib/space"
import { framer } from "framer-plugin"
import { contentfulCredentials, type Credential } from "./lib/utils"

interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
    storedCredentials: Credential
}

interface ApiKey {
    sys: { id: string }
    accessToken: string
    name: string
}

export function SelectDataSource({ onSelectDataSource, storedCredentials }: SelectDataSourceProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("")
    const [credentials, setCredentials] = useState<Credential>(storedCredentials)
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [contentTypes, setContentTypes] = useState<ContentType[]>([])

    const onSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            setIsLoading(true)
            getDataSource(
                contentTypes.find((contentType: ContentType) => contentType.sys.id === selectedDataSourceId)!
            ).then(e => {
                setIsLoading(false)
                onSelectDataSource(e)
                framer.showUI({
                    width: 340,
                    height: 425,
                    resizable: true,
                })

                contentfulCredentials().setCredentials({
                    credential: {
                        ...credentials,
                        authGranted: true,
                        dataSources: [selectedDataSourceId],
                    },
                    dataSourceId: selectedDataSourceId,
                })
            })
        },
        [contentTypes, selectedDataSourceId, onSelectDataSource]
    )

    return (
        <main className="framer-hide-scrollbar">
            <img src="/contentful.webp" alt="Contentful" className="img" />
            <form onSubmit={onSubmit} className="form">
                <SelectSpace
                    onSelect={(spaceId, apiKeys) => {
                        setCredentials(prev => ({ ...prev, spaceId }))
                        setApiKeys(apiKeys)
                    }}
                />
                <SelectAPIKey
                    disabled={apiKeys.length === 0}
                    spaceId={credentials.spaceId}
                    apiKeys={apiKeys}
                    onSelect={(accessToken, contentTypes) => {
                        setCredentials(prev => ({ ...prev, accessToken }))
                        setContentTypes(contentTypes)
                        if (contentTypes[0]?.sys?.id) {
                            setSelectedDataSourceId(contentTypes[0].sys.id)
                        }
                    }}
                />
                <SelectContentType
                    disabled={contentTypes.length === 0}
                    contentTypes={contentTypes}
                    onChange={setSelectedDataSourceId}
                />
                <button disabled={!selectedDataSourceId || isLoading}>
                    {isLoading ? <div className="framer-spinner" /> : "Next"}
                </button>
            </form>
        </main>
    )
}

function SelectSpace({ onSelect }: { onSelect: (spaceId: string, apiKeys: ApiKey[]) => void }) {
    const { spaces } = useContentfulStore()
    const abortController = useAbortController()

    const selectSpace = useCallback(
        (spaceId: string) => {
            if (abortController.get()) {
                abortController.get()?.abort()
            }

            // Create new controller for this request
            abortController.set()

            getApiKeys(spaceId)
                .then(keys => {
                    if (keys.length === 0 || !keys?.[0]?.accessToken) {
                        framer.notify("No access token found for space", {
                            variant: "error",
                        })
                        throw new Error("No access token found for space")
                    }

                    onSelect(spaceId, keys)
                })
                .catch(error => {
                    if (abortController.get()?.signal.aborted) return

                    console.error(error)
                    framer.notify("Error loading space API keys. Check the logs for more details.", {
                        variant: "error",
                    })
                })
        },
        [onSelect, abortController]
    )

    useEffect(() => {
        if (spaces[0]?.sys.id) {
            selectSpace(spaces[0]?.sys.id)
        }
    }, [spaces])

    return (
        <label htmlFor="space" className="two-column">
            <span className="label">Space</span>
            <select
                id="space"
                className="select"
                onChange={e => {
                    e.preventDefault()
                    selectSpace(e.target.value as string)
                }}
                defaultValue={spaces[0]?.sys.id ?? "Loading"}
            >
                <option value="" disabled>
                    Choose Space
                </option>

                {spaces.length === 0 ? (
                    <option value="Loading" disabled>
                        Loading...
                    </option>
                ) : (
                    spaces.map(({ sys, name }) => (
                        <option key={sys.id} value={sys.id}>
                            {name}
                        </option>
                    ))
                )}
            </select>
        </label>
    )
}

function SelectAPIKey({
    spaceId,
    apiKeys,
    disabled,
    onSelect,
}: {
    spaceId: string | null
    apiKeys: ApiKey[]
    disabled: boolean
    onSelect: (accessToken: string, contentTypes: ContentType[]) => void
}) {
    const abortController = useAbortController()

    const selectApiKey = useCallback(
        (accessToken: string) => {
            if (abortController.get()) {
                abortController.get()?.abort()
            }

            abortController.set()

            initContentful({
                spaceId,
                accessToken,
            })

            getContentTypes()
                .then(contentTypes => {
                    onSelect(accessToken, contentTypes)
                })
                .catch(error => {
                    if (abortController.get()?.signal.aborted) return

                    console.error(error)
                    framer.notify("Error loading content types. Check the logs for more details.", {
                        variant: "error",
                    })
                })
        },
        [onSelect, spaceId, abortController]
    )

    // Set the default API key
    useEffect(() => {
        const accessToken = apiKeys[0]?.accessToken
        if (accessToken && spaceId) {
            selectApiKey(accessToken)
        }
    }, [apiKeys, spaceId])

    // Increase the height if there are multiple API keys
    useEffect(() => {
        framer.showUI({
            height: apiKeys.length > 1 ? 380 : 340,
        })
    }, [apiKeys])

    // If there is none/one API key, don't show the select
    if (apiKeys.length <= 1) {
        return null
    }

    return (
        <label htmlFor="apiKey" className="two-column">
            <span className="label">API Key</span>
            <select
                id="apiKey"
                className="select"
                onChange={e => {
                    e.preventDefault()
                    selectApiKey(e.target.value as string)
                }}
                disabled={disabled}
                defaultValue={apiKeys[0]?.accessToken ?? "Loading"}
            >
                <option value="" disabled>
                    Choose API Key
                </option>

                {apiKeys.length === 0 ? (
                    <option value="Loading" disabled>
                        Loading...
                    </option>
                ) : (
                    apiKeys.map(({ sys, accessToken, name }) => (
                        <option key={sys.id} value={accessToken}>
                            {name}
                        </option>
                    ))
                )}
            </select>
        </label>
    )
}

function SelectContentType({
    contentTypes,
    disabled,
    onChange,
}: {
    contentTypes: ContentType[]
    disabled: boolean
    onChange: (contentTypeId: string) => void
}) {
    return (
        <label htmlFor="contentType" className="two-column">
            <span className="label">Content Type</span>
            <select
                id="contentType"
                className="select"
                onChange={e => onChange(e.target.value as string)}
                disabled={disabled}
                defaultValue={contentTypes[0]?.sys.id ?? "Loading"}
            >
                <option value="" disabled>
                    Choose Content Type
                </option>

                {contentTypes.length === 0 ? (
                    <option value="Loading" disabled>
                        Loading...
                    </option>
                ) : (
                    contentTypes.map(({ sys, name }: ContentType) => (
                        <option key={sys.id} value={sys.id}>
                            {name}
                        </option>
                    ))
                )}
            </select>
        </label>
    )
}

function useAbortController() {
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        const controller = abortControllerRef.current
        return () => {
            controller?.abort()
        }
    }, [])

    return {
        get: () => abortControllerRef.current,
        set: () => {
            const controller = new AbortController()
            abortControllerRef.current = controller
        },
    }
}
