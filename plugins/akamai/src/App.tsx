import { framer, type PublishInfo } from "framer-plugin"
import { useEffect, useState } from "react"
import "./App.css"

framer.showUI({
    position: "top right",
    width: 240,
    height: 200,
})

function usePublishInfo() {
    const [publishInfo, setPublishInfo] = useState<PublishInfo>()

    useEffect(() => {
        return framer.subscribeToPublishInfo(setPublishInfo)
    }, [])

    return publishInfo
}

export function App() {
    const [isValidProjectUrl, setIsValidProjectUrl] = useState<boolean>(false)

    const publishInfo = usePublishInfo()
    console.log(publishInfo)

    useEffect(() => {
        const validateProjectUrl = () => {
            const projectUrl = publishInfo?.production?.url
            if (!projectUrl) {
                setIsValidProjectUrl(false)
                return
            }

            if (typeof projectUrl === "string" && projectUrl.includes(".framer.app")) {
                setIsValidProjectUrl(false)
                return
            }
            setIsValidProjectUrl(true)
        }
        validateProjectUrl()
    }, [publishInfo])

    return (
        <main>
            <strong>Production URL: {publishInfo?.production?.url ?? "None"}</strong>
            {publishInfo?.production?.url ? (
                isValidProjectUrl ? (
                    <>
                        <p>Welcome to Akamai Flow!</p>
                        <button className="framer-button-primary" onClick={() => console.log("clicked")}>
                            Akamai Flow
                        </button>
                    </>
                ) : (
                    <p>
                        A custom domain isn't set in site settings. Please assign this in{" "}
                        <a href="https://www.framer.com/help/articles/how-to-connect-a-custom-domain/" target="_blank">
                            Site Settings
                        </a>
                        .
                    </p>
                )
            ) : (
                <p>
                    No production URL, please set a custom URL in{" "}
                    <a href="https://www.framer.com/help/articles/how-to-connect-a-custom-domain/" target="_blank">
                        Site Settings
                    </a>{" "}
                    and publish.
                </p>
            )}
        </main>
    )
}
