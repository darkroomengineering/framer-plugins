import "framer-plugin/framer.css"

import { framer } from "framer-plugin"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { PLUGIN_KEYS, syncExistingCollection } from "./data.ts"
import type { StoryblokRegion } from "./storyblok.ts"

const activeCollection = await framer.getActiveManagedCollection()

const previousDataSourceId = await activeCollection.getPluginData(PLUGIN_KEYS.DATA_SOURCE_ID)
const previousSlugFieldId = await activeCollection.getPluginData(PLUGIN_KEYS.SLUG_FIELD_ID)
const previousSpaceId = await activeCollection.getPluginData(PLUGIN_KEYS.SPACE_ID)
const previousRegion = (await activeCollection.getPluginData(PLUGIN_KEYS.REGION)) as StoryblokRegion | null

const previousPersonalAccessToken = localStorage.getItem(PLUGIN_KEYS.PERSONAL_ACCESS_TOKEN)

const { didSync } = await syncExistingCollection(activeCollection, {
    previousDataSourceId,
    previousSlugFieldId,
    previousSpaceId,
    previousRegion,
    previousPersonalAccessToken,
})

if (didSync) {
    await framer.closePlugin("Synchronization successful", {
        variant: "success",
    })
} else {
    const root = document.getElementById("root")
    if (!root) throw new Error("Root element not found")

    createRoot(root).render(
        <StrictMode>
            <App
                collection={activeCollection}
                previousDataSourceId={previousDataSourceId}
                previousSlugFieldId={previousSlugFieldId}
                previousSpaceId={previousSpaceId}
                previousPersonalAccessToken={previousPersonalAccessToken}
                previousRegion={previousRegion}
            />
        </StrictMode>
    )
}
