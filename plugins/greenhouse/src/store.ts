import { framer } from "framer-plugin"
import { create } from "zustand"

async function getKey(key: string) {
    const collection = await framer.getManagedCollection()
    const value = await collection.getPluginData(key)

    return value || ""
}

async function setKey(key: string, value: string) {
    const collection = await framer.getManagedCollection()

    return collection.setPluginData(key, value)
}

interface Store {
    contentTypeId: string
    setContentTypeId: (contentTypeId: string) => void
    spaceId: string
    setSpaceId: (spaceId: string) => void
    slugFieldId: string
    setSlugFieldId: (slugFieldId: string) => void
    getInitialData: () => Promise<void>
}

export const useStore = create<Store>(set => ({
    contentTypeId: "",
    setContentTypeId: (contentTypeId: string) => {
        setKey("contentTypeId", contentTypeId)
        set({ contentTypeId })
    },
    spaceId: "",
    setSpaceId: (spaceId: string) => {
        setKey("spaceId", spaceId)
        set({ spaceId })
    },
    slugFieldId: "",
    setSlugFieldId: (slugFieldId: string) => {
        setKey("slugFieldId", slugFieldId)
        set({ slugFieldId })
    },
    getInitialData: async () => {
        const contentTypeId = await getKey("contentTypeId")
        const spaceId = await getKey("spaceId")
        const slugFieldId = await getKey("slugFieldId")

        set({ contentTypeId, spaceId, slugFieldId })
    },
}))

useStore.getState().getInitialData()
