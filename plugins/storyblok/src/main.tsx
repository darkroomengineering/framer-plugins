import "framer-plugin/framer.css"

import { framer } from "framer-plugin"
import { StrictMode, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { PLUGIN_KEYS, syncExistingCollection } from "./data.ts"
import { Login } from "./login/index.tsx"

const activeCollection = await framer.getActiveManagedCollection()

const previousDataSourceId = await activeCollection.getPluginData(PLUGIN_KEYS.DATA_SOURCE_ID)
const previousSlugFieldId = await activeCollection.getPluginData(PLUGIN_KEYS.SLUG_FIELD_ID)

const { didSync } = await syncExistingCollection(activeCollection, previousDataSourceId, previousSlugFieldId)

if (didSync) {
    await framer.closePlugin("Synchronization successful", {
        variant: "success",
    })
} else {
    const root = document.getElementById("root")
    if (!root) throw new Error("Root element not found")

    const Main = () => {
        const [isAuthenticated, setIsAuthenticated] = useState(() => {
            return Boolean(localStorage.getItem("storyblok_token"))
        })

        useEffect(() => {
            framer.showUI({
                width: 320,
                height: 200,
                resizable: false,
            })
        }, [])

        return (
            <StrictMode>
                {isAuthenticated ? (
                    <App
                        collection={activeCollection}
                        previousDataSourceId={previousDataSourceId}
                        previousSlugFieldId={previousSlugFieldId}
                    />
                ) : (
                    <Login onValidToken={() => setIsAuthenticated(true)} />
                )}
            </StrictMode>
        )
    }

    createRoot(root).render(<Main />)
}
