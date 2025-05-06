import type { Space } from "contentful"
import { create } from "zustand"

type ContentfulStore = {
    spaces: Space[]
    setSpaces: (spaces: Space[]) => void
}

export const useContentfulStore = create<ContentfulStore>()(set => ({
    spaces: [],
    setSpaces: (spaces: Space[]) => {
        set({ spaces })
    },
}))
