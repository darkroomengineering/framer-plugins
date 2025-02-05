import { useState } from "react"
import { Auth } from "./components/auth"

export function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [spaceId, setSpaceId] = useState("")
    const [contentTypes, setContentTypes] = useState<[]>([])
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [contentType, setContentType] = useState<null>(null)
    const [isMounted, setIsMounted] = useState(false)

    const onSubmitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        // try {
        //     initContentful(contentfulConfig)

        //     // Store the content type ID and Contentful credentials for future syncs

        //     framer.setPluginData("contentful", JSON.stringify(contentfulConfig))

        //     const collection = await framer.getManagedCollection()
        //     collection.setPluginData("contentful", JSON.stringify(contentfulConfig))

        //     const contentTypesWithEntries = await fetchContentTypes()

        //     setContentTypes(contentTypesWithEntries)
        //     setIsAuthenticated(true)
        // } catch (error) {
        //     framer.notify("Failed to connect to Contentful", { variant: "error" })
        //     console.error("Failed to connect to Contentful", error)
        // } finally {
        //     setIsLoading(false)
        // }

        setIsLoading(false)
    }

    return (
        <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
            {!isAuthenticated ? (
                <Auth spaceId={spaceId} setSpaceId={setSpaceId} isLoading={isLoading} onSubmit={onSubmitAuth} />
            ) : !contentType ? (
                "contentTypePicker"
            ) : (
                // <ContentTypePicker
                //     onSubmit={onSubmitPickContentType}
                //     // contentTypes={contentTypes}
                //     isLoading={isLoading}
                // />
                "fields"
                // <Fields contentType={contentType} onSubmit={onSubmitFields} isLoading={isLoading} />
            )}
        </div>
    )
}
