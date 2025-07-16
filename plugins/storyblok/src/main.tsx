import "framer-plugin/framer.css"

import {framer, ManagedCollection} from "framer-plugin"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import {
    accessTokenPluginKey,
    dataSourceIdPluginKey,
    regionPluginKey,
    slugFieldIdPluginKey,
    spaceIdPluginKey,
    syncExistingCollection,
} from "./data"
import { type StoryblokRegion } from "./storyblok"

const lastUsedAccessToken = await framer.getPluginData(accessTokenPluginKey)
const lastUsedSpaceId = await framer.getPluginData(spaceIdPluginKey)

const activeCollection = await framer.getActiveManagedCollection()

const previousDataSourceId = await activeCollection.getPluginData(dataSourceIdPluginKey)
const previousSlugFieldId = await activeCollection.getPluginData(slugFieldIdPluginKey)
const previousCollectionAccessToken = await activeCollection.getPluginData(accessTokenPluginKey)
const previousCollectionSpaceId = await activeCollection.getPluginData(spaceIdPluginKey)
const previousRegion = (await activeCollection.getPluginData(regionPluginKey)) as StoryblokRegion | null

const previousAccessToken = previousCollectionAccessToken ?? lastUsedAccessToken
const previousSpaceId = previousCollectionSpaceId ?? lastUsedSpaceId

const { didSync } = await syncExistingCollection(
    activeCollection,
    previousDataSourceId,
    previousSlugFieldId,
    previousRegion,
    previousSpaceId,
    previousAccessToken
)
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
                previousAccessToken={previousAccessToken}
                previousSpaceId={previousSpaceId}
                previousRegion={previousRegion}
            />
        </StrictMode>
    )
}
