import "framer-plugin/framer.css"

import { framer } from "framer-plugin"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { dataSourceIdPluginKey,
    slugFieldIdPluginKey,
    personalAccessToken,
    spaceIdPluginKey,
    regionPluginKey,syncExistingCollection } from "./data.ts"
import type { StoryblokRegion } from "./storyblok.ts"

const activeCollection = await framer.getActiveManagedCollection()

const previousDataSourceId = await activeCollection.getPluginData(dataSourceIdPluginKey)
const previousSlugFieldId = await activeCollection.getPluginData(slugFieldIdPluginKey)
const previousSpaceId = await activeCollection.getPluginData(spaceIdPluginKey)
const previousRegion = (await activeCollection.getPluginData(regionPluginKey)) as StoryblokRegion | null
const previousPersonalAccessToken = localStorage.getItem(personalAccessToken)

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
