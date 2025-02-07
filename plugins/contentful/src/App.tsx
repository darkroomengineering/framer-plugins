import { useEffect, useState } from "react"
import { Auth } from "./components/auth"
import { initContentfulManagement } from "./contentful-management"
import { ContentTypePicker } from "./components/content-type-picker"
import { CollectionField, CollectionItem, framer, ManagedCollectionField, Mode } from "framer-plugin"
import { getContentType, getEntriesForContentType, initContentful } from "./contentful"
import { Fields } from "./components/fields"
import { ContentType } from "contentful"
import { getFramerFieldFromContentfulField, mapContentfulValueToFramerValue } from "./utils"

export function App() {
    // const [isLoading, setIsLoading] = useState(false)
    const [tokens, setTokens] = useState<{ access_token: string } | null>(null)
    const [contentTypeId, setContentTypeId] = useState<string | null>(null)
    const [spaceId, setSpaceId] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [contentType, setContentType] = useState<ContentType | null>(null)
    const [isContentfulInited, setIsContentfulInited] = useState(false)
    const [isContentfulManagementInited, setIsContentfulManagementInited] = useState(false)
    const [mode] = useState<Mode>(framer.mode)
    const [isMounted, setIsMounted] = useState(false)
    // const [slugFieldId, setSlugFieldId] = useState<string | null>(null)
    // const [fields, setFields] = useState<CollectionField[]>([])

    useEffect(() => {
        const timeout = setTimeout(() => {
            // wait for the plugin to be mounted
            setIsMounted(true)
        }, 1000)

        return () => clearTimeout(timeout)
    }, [])

    console.log({
        tokens,

        contentTypeId,
        spaceId,
        apiKey,
        contentType,
        isContentfulInited,
        isContentfulManagementInited,
        mode,
        // slugFieldId,
        // fields,
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
            const collectionsList = await framer.getPluginData("contentful:collections")
            const collections = collectionsList ? JSON.parse(collectionsList) : {}
            const framerCollections = await framer.getCollections()

            // delete collections that are not in framer
            Object.entries(collections).forEach(([key, value]) => {
                if (!framerCollections.find(({ id }) => id === value?.id)) {
                    delete collections[key]
                }
            })

            const collection = await framer.getManagedCollection()

            collection.setPluginData("contentTypeId", contentTypeId)

            collections[contentTypeId] = collection
            await framer.setPluginData("contentful:collections", JSON.stringify(collections))
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
        if (!contentTypeId || !isContentfulInited) return

        const fetchContentType = async () => {
            const contentType = await getContentType(contentTypeId)
            setContentType(contentType)
        }

        fetchContentType()
    }, [contentTypeId, isContentfulInited])

    const sync = async () => {
        const collection = await framer.getManagedCollection()
        const fields = await collection.getFields()
        const slugFieldId = await collection.getPluginData("slugFieldId")
        const contentTypeId = await collection.getPluginData("contentTypeId")

        if (!slugFieldId || !contentTypeId) {
            return
        }

        // const credentials = await collection.getPluginData("contentful")
        // if (credentials) {
        //     initContentful(JSON.parse(credentials))
        // }

        const contentType = await getContentType(contentTypeId)

        const existingMappedContentType = fields.map(framerField => {
            return {
                ...framerField,
                field: contentType.fields.find(field => field.id === framerField.id),
            }
        })

        let mappedContentType = await Promise.all(
            contentType.fields.map(async field => {
                const framerField = await getFramerFieldFromContentfulField(field)

                return {
                    ...framerField,
                    field,
                    defaultType: framerField.type,
                    collectionId: framerField.collectionId,
                }
            })
        )

        mappedContentType = mappedContentType
            .map(field => {
                const existingField = existingMappedContentType.find(existingField => existingField.id === field.id)

                if (existingField) {
                    field = { ...field, ...existingField }
                }

                if (!existingField) {
                    field.isDisabled = true
                }

                return field
            })
            .filter(field => field.isDisabled !== true)

        const entries = await getEntriesForContentType(contentTypeId)

        const mappedEntries = entries.map(entry => {
            return {
                id: entry.sys.id,
                slug: entry.fields[slugFieldId ?? ""],
                fieldData: Object.fromEntries(
                    Object.entries(entry.fields)
                        .filter(([id]) => mappedContentType.some(field => field.id === id))
                        .map(([id, value]) => {
                            const framerField = mappedContentType.find(field => field.id === id)

                            if (!framerField) {
                                return [id, value]
                            }

                            // @ts-expect-error Can't find the right type for the value
                            const mappedValue = mapContentfulValueToFramerValue(value, framerField)

                            return [id, mappedValue]
                        })
                ),
            }
        })

        const existingEntriesIds = await collection.getItemIds()

        // const entriesToBeAdded = mappedEntries.filter(entry => !existingEntriesIds.includes(entry.id))
        const entriesToBeRemoved = existingEntriesIds.filter(id => !mappedEntries.some(entry => entry.id === id))
        const order = entries.map(entry => entry.sys.id)

        await collection.addItems(mappedEntries as CollectionItem[])
        await collection.removeItems(entriesToBeRemoved)
        await collection.setItemOrder(order)
        // }

        // try {
        // } catch (error) {
        //     console.error("Failed to sync collection:", error)
        //     framer.notify(`Failed to sync collection, ${error instanceof Error ? error.message : "Unknown error"}`, {
        //         variant: "error",
        //     })
        // }

        framer.closePlugin()
    }

    const onSubmitFields = async (slugId: string, fields: CollectionField[]) => {
        const collection = await framer.getManagedCollection()
        await collection.setPluginData("slugFieldId", slugId)

        await collection.setFields(fields as ManagedCollectionField[])

        await sync()
    }

    useEffect(() => {
        if (!isContentfulInited) return

        if (mode === "syncManagedCollection") {
            sync()
        }
    }, [mode, isContentfulInited])

    if (mode === "syncManagedCollection") return
    if (!isMounted) return

    return (
        <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
            {/* <button
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
            </button> */}

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
                contentType && isContentfulInited && <Fields contentType={contentType} onSubmit={onSubmitFields} />
            )}
        </div>
    )
}
