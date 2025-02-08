import { useLayoutEffect, useState } from "react"
import { Auth } from "./components/auth"
import { ContentTypePicker } from "./components/content-type-picker"
import { Fields } from "./components/fields"
import { usePluginData } from "./hooks/use-plugin-data"
import { initGreenhouse } from "./greenhouse"

export function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [contentTypes, setContentTypes] = useState<[]>([])
    const [spaceId, setSpaceId] = usePluginData("spaceId", "")
    const [contentTypeId, setContentTypeId] = usePluginData("contentTypeId", "")
    const [isGreenhouseInitialized, setIsGreenhouseInitialized] = useState<boolean>(false)
    const [isMounted, setIsMounted] = useState(false)

    console.log({
        spaceId,
        contentTypeId,
    })

    useLayoutEffect(() => {
        if (spaceId) {
            initGreenhouse(spaceId)
                .then(() => {
                    setIsGreenhouseInitialized(true)
                })
                .catch(() => {
                    setSpaceId("")
                    setIsGreenhouseInitialized(false)
                })
        }
    }, [spaceId, setSpaceId])

    return (
        <>
            <button
                className="fixed"
                onClick={() => {
                    setSpaceId("")
                    setContentTypeId("")
                    setIsGreenhouseInitialized(false)
                }}
            >
                reset
            </button>
            <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
                {!spaceId ? (
                    <Auth onSubmit={setSpaceId} />
                ) : !contentTypeId ? (
                    isGreenhouseInitialized && <ContentTypePicker onSubmit={setContentTypeId} />
                ) : (
                    <Fields contentTypeId={contentTypeId} />
                )}
            </div>
        </>
    )
}
