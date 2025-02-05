import { useState } from "react"
import { Auth } from "./components/auth"
import { framer } from "framer-plugin"
import { ContentTypePicker } from "./components/content-type-picker"

export function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [contentTypes, setContentTypes] = useState<[]>([])
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [contentType, setContentType] = useState<null>(null)
    const [isMounted, setIsMounted] = useState(false)

    const onSubmitAuth = async (spaceId: string) => {
        setIsLoading(true)

        try {
            // check if spaceId is valid
            const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${spaceId}`)
            if (!response.ok) {
                throw new Error("Invalid space ID")
            }

            await framer.setPluginData("greenhouse", spaceId)
            const collection = await framer.getManagedCollection()
            await collection.setPluginData("spaceId", spaceId)

            setIsAuthenticated(true)
        } catch (error) {
            framer.notify("Failed to connect to Greenhouse", { variant: "error" })
            console.error("Failed to connect to Greenhouse", error)
        }

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

    const onSubmitPickContentType = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        setIsLoading(false)
    }

    return (
        <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
            {!isAuthenticated ? (
                <Auth isLoading={isLoading} onSubmit={onSubmitAuth} />
            ) : !contentType ? (
                <ContentTypePicker
                    onSubmit={onSubmitPickContentType}
                    // contentTypes={contentTypes}
                    isLoading={isLoading}
                />
            ) : (
                "fields"
                // <Fields contentType={contentType} onSubmit={onSubmitFields} isLoading={isLoading} />
            )}
        </div>
    )
}
