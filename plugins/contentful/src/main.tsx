import "framer-plugin/framer.css"
import { framer } from "framer-plugin"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { PLUGIN_KEYS, syncExistingCollection } from "./data"
import { Auth, AuthScreen } from "./auth"
import { Contentful } from "./lib"
import { parseContentfulCredentials } from "./lib/utils"

const activeCollection = await framer.getActiveManagedCollection()
const storedCredentials = await parseContentfulCredentials()
const previousDataSourceId = await activeCollection.getPluginData(PLUGIN_KEYS.DATA_SOURCE_ID)
const previousSlugFieldId = await activeCollection.getPluginData(PLUGIN_KEYS.SLUG_FIELD_ID)

const { didSync } = await syncExistingCollection(
    activeCollection,
    previousDataSourceId,
    previousSlugFieldId,
    storedCredentials
)

// TODO: Remove for testing purposes
// framer.setPluginData("contentful:space", null)

if (didSync) {
    await framer.closePlugin("Synchronization successful", {
        variant: "success",
    })
} else {
    const root = document.getElementById("root")
    if (!root) throw new Error("Root element not found")

    createRoot(root).render(
        <StrictMode>
            <Auth previousCredentials={storedCredentials}>
                {({ tokens, setTokens, needsAuth }) => {
                    if (needsAuth) {
                        return <AuthScreen onSubmit={setTokens} />
                    }

                    return (
                        <Contentful tokens={tokens}>
                            <App
                                collection={activeCollection}
                                storedCredentials={storedCredentials}
                                previousDataSourceId={previousDataSourceId}
                                previousSlugFieldId={previousSlugFieldId}
                            />
                        </Contentful>
                    )
                }}
            </Auth>
        </StrictMode>
    )
}
