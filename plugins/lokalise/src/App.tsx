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
            height: 325,
        })
    }, [])

    if (!authToken) {
        return <Auth onAuth={setAuthToken} />
    }

    return (
        <div className="main">
            <h1 className="title">Lokalise</h1>
            <img src="/lokalise.png" alt="Lokalise" className="image" />
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
