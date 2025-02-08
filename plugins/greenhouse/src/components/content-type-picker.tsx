// import { ContentType } from "contentful"
import Logo from "../assets/splash.png"
import { framer } from "framer-plugin"
import { useEffect, useLayoutEffect, useState } from "react"
import { CONTENT_TYPES, getAllContentTypes } from "../greenhouse"

export function ContentTypePicker({ onSubmit }: { onSubmit: (contentTypeId: string | null) => void }) {
    const [contentTypeId, setContentTypeId] = useState<string | null>(null)
    const [contentTypes, setContentTypes] = useState<{ id: string; entries: any[] }[]>([])
    const [isLoading, setIsLoading] = useState(false)

    console.log("contentTypes", contentTypes)

    useEffect(() => {
        const fetchContentTypes = async () => {
            setIsLoading(true)
            const contentTypes = await getAllContentTypes(false)

            const contentTypesWithEntries = Object.entries(contentTypes)
                .map(([id, entries]) => ({
                    id,
                    entries,
                }))
                .filter(({ entries }) => entries?.length > 0)

            setContentTypes(contentTypesWithEntries)
            setIsLoading(false)
        }

        fetchContentTypes()
    }, [])

    useLayoutEffect(() => {
        framer.showUI({
            width: 320,
            height: 305,
            resizable: false,
        })
    }, [])

    return (
        <div className="flex flex-col gap-[15px] text-secondary">
            <img
                src={Logo}
                alt="Contentful Hero"
                className="object-contain w-full rounded-[10px] h-[200px] bg-contentful-orange bg-opacity-10"
            />
            <div className="row justify-between items-center items-center">
                <label htmlFor="contentType" className="ml-[15px]">
                    Content Type
                </label>
                <select
                    id="contentType"
                    className="w-[134px]"
                    onChange={e => {
                        setContentTypeId(e.target.value)
                    }}
                >
                    <option disabled selected>
                        Select a content type...
                    </option>

                    {contentTypes.map(({ id }) => (
                        <option key={id} value={id}>
                            {CONTENT_TYPES.find(ct => ct.id === id)?.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="sticky left-0 bottom-0 flex justify-between bg-primary items-center max-w-full">
                <button
                    type="submit"
                    disabled={!contentTypeId || contentTypes.length === 0}
                    className="flex justify-center items-center relative py-2 framer-button-secondary w-full"
                    onClick={() => {
                        // console.log("contentTypeId", contentTypeId)
                        onSubmit(contentTypeId)
                    }}
                >
                    {isLoading ? "Loading..." : "Next"}
                </button>
            </div>
        </div>
    )
}
