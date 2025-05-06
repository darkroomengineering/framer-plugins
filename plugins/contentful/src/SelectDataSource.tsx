import { useCallback, useEffect, useState } from "react"
import { type DataSource, getDataSource } from "./data"
import { useContentfulStore } from "./store"
import type { ContentType } from "contentful"
import { getApiKeys } from "./lib/management"
import { getContentTypes, initContentful } from "./lib/space"
import { framer } from "framer-plugin"
import type { Credentials } from "./lib/utils"

interface SelectDataSourceProps {
    onSelectDataSource: (dataSource: DataSource) => void
    storedCredentials: Credentials
}

interface ApiKey {
    sys: { id: string }
    accessToken: string
    name: string
}

export function SelectDataSource({ onSelectDataSource, storedCredentials }: SelectDataSourceProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("")
    const [credentials, setCredentials] = useState<Credentials>(storedCredentials)
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
            })
        },
        [contentTypes, selectedDataSourceId, onSelectDataSource]
    )

    return (
        <main className="framer-hide-scrollbar setup">
            <img src="/contentful.webp" alt="Contentful" className="img" />
            <form onSubmit={onSubmit}>
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

    const selectSpace = useCallback(
        (spaceId: string) => {
            getApiKeys(spaceId).then(keys => {
                if (keys.length === 0) {
                    throw new Error("No API keys found")
                }

                if (!keys?.[0]?.accessToken) {
                    throw new Error(`No access token found for space ${spaceId}`)
                }

                onSelect(spaceId, keys)
            })
        },
        [onSelect]
    )

    return (
        <label htmlFor="space" className="framer-select">
            Space
            <select
                id="space"
                onChange={e => {
                    e.preventDefault()
                    selectSpace(e.target.value as string)
                }}
            >
                <option value="" disabled>
                    Choose Space
                </option>
                {spaces.map(({ sys, name }) => (
                    <option key={sys.id} value={sys?.id ?? ""}>
                        {name}
                    </option>
                ))}
            </select>
        </label>
    )
}

function SelectAPIKey({
    spaceId,
    apiKeys,
    onSelect,
    disabled,
}: {
    spaceId: string | null
    apiKeys: ApiKey[]
    onSelect: (accessToken: string, contentTypes: ContentType[]) => void
    disabled: boolean
}) {
    const selectApiKey = useCallback(
        (accessToken: string) => {
            initContentful({
                spaceId,
                accessToken,
            })

            framer.setPluginData(
                "contentful:space",
                JSON.stringify({
                    authGranted: true,
                    spaceId,
                    accessToken,
                })
            )

            getContentTypes().then(contentTypes => {
                onSelect(accessToken, contentTypes)
            })
        },
        [onSelect, spaceId]
    )

    // If there is only one API key, select it
    useEffect(() => {
        const accessToken = apiKeys[0]?.accessToken

        if (apiKeys.length === 1 && accessToken && spaceId) {
            selectApiKey(accessToken)
        }
    }, [apiKeys, spaceId, selectApiKey])

    // If there is only one API key, don't show the select
    if (apiKeys.length === 1) {
        return null
    }

    return (
        <label htmlFor="apiKey" className="framer-select">
            API Key
            <select
                id="apiKey"
                onChange={e => {
                    e.preventDefault()
                    selectApiKey(e.target.value as string)
                }}
                disabled={disabled}
            >
                <option value={undefined} disabled>
                    Choose API Key
                </option>
                {apiKeys.map(({ sys, accessToken, name }) => (
                    <option key={sys.id} value={accessToken}>
                        {name}
                    </option>
                ))}
            </select>
        </label>
    )
}

function SelectContentType({
    contentTypes,
    onChange,
    disabled,
}: {
    contentTypes: ContentType[]
    onChange: (contentTypeId: string) => void
    disabled: boolean
}) {
    return (
        <label htmlFor="contentType" className="framer-select">
            Content Type
            <select id="contentType" onChange={e => onChange(e.target.value as string)} disabled={disabled}>
                <option value="" disabled>
                    Choose Content Type
                </option>
                {contentTypes.map(({ sys, name }: ContentType) => (
                    <option key={sys.id} value={sys.id}>
                        {name}
                    </option>
                ))}
            </select>
        </label>
    )
}
