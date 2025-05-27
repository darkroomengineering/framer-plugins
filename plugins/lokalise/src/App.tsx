import "./App.css"

import { framer } from "framer-plugin"
import { useLayoutEffect, useState } from "react"
import { Auth } from "../components/auth"
import { useUploadTranslations } from "../lib/useUploadTranslation"
import { useDownloadTranslations } from "../lib/useDownload"
import type { AuthToken } from "../lib/types"

export function App(token: AuthToken) {
    const [auth, setAuth] = useState<AuthToken>(token)

    useLayoutEffect(() => {
        framer.showUI({
            width: 360,
            height: 325,
        })
    }, [])

    if (!auth.authToken) {
        return <Auth onAuth={setAuth} />
    }

    return (
        <div className="main">
            <h1 className="title">Lokalise</h1>
            <img src="/lokalise.png" alt="Lokalise" className="image" />
            {UploadTranslations(auth)}
            {DownloadTranslations(auth)}
        </div>
    )
}

function UploadTranslations(authToken: AuthToken) {
    const { fetchAndUploadTranslations, isLoading } = useUploadTranslations(authToken)

    return <button onClick={fetchAndUploadTranslations}>{isLoading ? "Uploading..." : "Upload Translations"}</button>
}

function DownloadTranslations(authToken: AuthToken) {
    const { fetchAndApplyTranslations, isLoading } = useDownloadTranslations(authToken)

    return <button onClick={fetchAndApplyTranslations}>{isLoading ? "Downloading..." : "Download Translations"}</button>
}
