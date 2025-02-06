import { ContentType } from "contentful"
import { framer } from "framer-plugin"
import { useEffect, useLayoutEffect, useState } from "react"
import { Hero } from "./hero"
import { getApiKeys, getSpaces } from "../contentful-management"
import { Space } from "contentful-management"
import { getContentTypes, getEntriesForContentType, initContentful } from "../contentful"

export function ContentTypePicker({
    onSubmit,
}: {
    onSubmit: ({ spaceId, contentTypeId, apiKey }: { spaceId: string; contentTypeId: string; apiKey: string }) => void
}) {
    useLayoutEffect(() => {
        framer.showUI({
            width: 320,
            height: 345,
            resizable: false,
        })
    }, [])

    const [isLoading, setIsLoading] = useState(true)
    const [spaces, setSpaces] = useState<Space[]>([])
    const [spaceId, setSpaceId] = useState<string>("")
    const [apiKey, setApiKey] = useState<string>("")
    const [contentTypes, setContentTypes] = useState<ContentType[]>([])
    const [contentTypeId, setContentTypeId] = useState<string>("")

    useEffect(() => {
        setIsLoading(true)

        const fetchSpaces = async () => {
            const spaces = await getSpaces()
            if (spaces.length === 0) {
                throw new Error("No spaces found")
            }
            setSpaces(spaces)
        }

        fetchSpaces().then(() => {
            setIsLoading(false)
        })
    }, [])

    useEffect(() => {
        if (!spaceId) return

        // retrieve API Keys
        const fetchApiKeys = async () => {
            setContentTypes([])
            setContentTypeId("")
            setApiKey("")

            const apiKeys = await getApiKeys(spaceId)

            if (apiKeys?.length === 0) {
                throw new Error("No API key has been found for this space")
            }

            const apiKey = apiKeys[0]?.accessToken
            setApiKey(apiKey)
        }

        fetchApiKeys()
    }, [spaceId])

    useEffect(() => {
        if (!spaceId || !apiKey) return

        initContentful({
            space: spaceId,
            accessToken: apiKey,
        })

        const fetchContentTypes = async () => {
            const contentTypes = await getContentTypes()

            // Filter out content types with no entries
            const contentTypesWithEntries = await Promise.all(
                contentTypes.map(async contentType => {
                    const entries = await getEntriesForContentType(contentType.sys.id)
                    return entries.length > 0 ? contentType : null
                })
            )

            const filteredContentTypes = contentTypesWithEntries.filter(
                (ct): ct is NonNullable<typeof ct> => ct !== null
            )

            setContentTypes(filteredContentTypes)
            setContentTypeId(filteredContentTypes[0]?.sys.id || "")
        }

        fetchContentTypes()
    }, [spaceId, apiKey])

    return (
        <div className="flex flex-col gap-[15px] text-secondary">
            <Hero />
            <div className="col gap-[10px] flex-1">
                <div className="row justify-between items-center items-center">
                    <label htmlFor="contentType" className="ml-[15px]">
                        Space
                    </label>
                    <select id="space" className="w-[134px]" onChange={e => setSpaceId(e.target.value)}>
                        <option disabled selected>
                            Select a space...
                        </option>

                        {spaces.map(space => (
                            <option key={space.sys.id} value={space.sys.id}>
                                {space.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="row justify-between items-center items-center">
                    <label htmlFor="contentType" className="ml-[15px]">
                        Content Type
                    </label>
                    <select
                        id="contentType"
                        className="w-[134px]"
                        disabled={contentTypes.length === 0}
                        onChange={e => setContentTypeId(e.target.value)}
                        value={contentTypeId}
                    >
                        <option disabled>Select a content type...</option>

                        {contentTypes.map(contentType => (
                            <option key={contentType.sys.id} value={contentType.sys.id}>
                                {contentType.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="sticky left-0 bottom-0 flex justify-between bg-primary items-center max-w-full">
                <button
                    type="button"
                    disabled={!spaceId || !contentTypeId || contentTypes.length === 0}
                    className="flex justify-center items-center relative py-2 framer-button-secondary w-full"
                    onClick={() => {
                        onSubmit({ spaceId, contentTypeId, apiKey })
                    }}
                >
                    {isLoading ? "Loading..." : "Next"}
                </button>
            </div>
        </div>
    )
}
