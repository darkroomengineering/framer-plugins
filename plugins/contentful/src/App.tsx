import { useEffect, useState } from "react"
import { Auth } from "./components/auth"
import { initContentfulManagement } from "./contentful-management"
import { ContentTypePicker } from "./components/content-type-picker"
import { framer } from "framer-plugin"
import { getContentType, initContentful } from "./contentful"
import { Fields } from "./components/fields"
import { ContentType } from "contentful"

export function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [tokens, setTokens] = useState<{ access_token: string } | null>(null)
    const [contentTypeId, setContentTypeId] = useState<string | null>(null)
    const [spaceId, setSpaceId] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [contentType, setContentType] = useState<ContentType | null>(null)
    const [isContentfulInited, setIsContentfulInited] = useState(false)
    const [isContentfulManagementInited, setIsContentfulManagementInited] = useState(false)

    console.log({
        tokens,
        contentTypeId,
        spaceId,
        apiKey,
        contentType,
        isContentfulInited,
        isContentfulManagementInited,
    })

    useEffect(() => {
        // setIsLoading(true)
        // Check for tokens on first load.
        const serializedTokens = window.localStorage.getItem("tokens")
        if (!serializedTokens) return

        const tokens = JSON.parse(serializedTokens)
        setTokens(tokens)
    }, [])

    useEffect(() => {
        // check for contentful config on first load
        const fetchContentfulConfig = async () => {
            const collection = await framer.getManagedCollection()
            const serializedContentfulConfig = await collection.getPluginData("contentful")
            if (!serializedContentfulConfig) return
            const contentfulConfig = JSON.parse(serializedContentfulConfig)

            setSpaceId(contentfulConfig.spaceId)
            setApiKey(contentfulConfig.apiKey)
        }

        fetchContentfulConfig()
    }, [])

    useEffect(() => {
        const fetchContentTypeId = async () => {
            const collection = await framer.getManagedCollection()
            const contentTypeId = await collection.getPluginData("contentTypeId")
            if (!contentTypeId) return
            setContentTypeId(contentTypeId)
        }

        fetchContentTypeId()
    }, [])

    useEffect(() => {
        if (!tokens) return

        //Store tokens in local storage to keep the user logged in.
        window.localStorage.setItem("tokens", JSON.stringify(tokens))
        initContentfulManagement(tokens.access_token)

        setIsContentfulManagementInited(true)

        // setIsLoading(false)
    }, [tokens])

    useEffect(() => {
        if (!contentTypeId) return

        const storeContentTypeId = async () => {
            const collection = await framer.getManagedCollection()

            collection.setPluginData("contentTypeId", contentTypeId)
        }

        storeContentTypeId()
    }, [contentTypeId])

    useEffect(() => {
        if (!spaceId || !apiKey) return

        initContentful({
            space: spaceId,
            accessToken: apiKey,
        })
        setIsContentfulInited(true)

        const storeCredentials = async () => {
            const collection = await framer.getManagedCollection()

            collection.setPluginData(
                "contentful",
                JSON.stringify({
                    spaceId,
                    apiKey,
                })
            )
        }

        storeCredentials()
    }, [spaceId, apiKey])

    useEffect(() => {
        if (!contentTypeId) return

        const fetchContentType = async () => {
            const contentType = await getContentType(contentTypeId)
            setContentType(contentType)
        }

        fetchContentType()
    }, [contentTypeId, isContentfulInited])

    return (
        <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <button
                className="fixed"
                onClick={async () => {
                    const collection = await framer.getManagedCollection()
                    await collection.setPluginData("contentTypeId", null)
                    await collection.setPluginData("contentful", null)

                    setSpaceId(null)
                    setApiKey(null)
                    setContentTypeId(null)
                }}
            >
                reset
            </button>

            {!tokens ? (
                <Auth onSubmit={setTokens} />
            ) : !spaceId || !apiKey || !contentTypeId ? (
                isContentfulManagementInited && (
                    <ContentTypePicker
                        onSubmit={({ spaceId, contentTypeId, apiKey }) => {
                            setSpaceId(spaceId)
                            setApiKey(apiKey)
                            setContentTypeId(contentTypeId)
                        }}
                    />
                )
            ) : (
                contentType && isContentfulInited && <Fields contentType={contentType} />
            )}
        </div>
    )
}
