import "./App.css"

import { framer } from "framer-plugin"
import { useLayoutEffect, useState } from "react"
import { Auth } from "../components/auth"
import { useUploadTranslations } from "../lib/useUploadTranslation"
import { useDownloadTranslations } from "../lib/useDownload"
export function App({ token }: { token: string }) {
    const [authToken, setAuthToken] = useState<string | null>(token)

    useLayoutEffect(() => {
        framer.showUI({
            width: 360,
            height: 425,
            minWidth: 360,
            minHeight: 425,
            resizable: true,
        })
    }, [])

    if (!authToken) {
        return <Auth onAuth={setAuthToken} />
    }

    return (
        <div className="main">
            <h1>Lokalise Plugin</h1>
            {UploadTranslations(authToken)}
            {DownloadTranslations(authToken)}
        </div>
    )
}

function UploadTranslations(authToken: string | null) {
    const [isUploading, setIsUploading] = useState(false)
    useUploadTranslations(isUploading, authToken)

    return (
        <button
            onClick={() => {
                setIsUploading(true)
            }}
        >
            Upload Translations
        </button>
    )
}

function DownloadTranslations(authToken: string | null) {
    const { fetchAndApplyTranslations } = useDownloadTranslations(authToken)

    return <button onClick={fetchAndApplyTranslations}>Download Translations</button>
}
