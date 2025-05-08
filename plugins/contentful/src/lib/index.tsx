import { useEffect, type ReactNode } from "react"
import { getSpaces, initContentfulManagement } from "./management"
import { useContentfulStore } from "../store"

export function Contentful({ children, tokens }: { children: ReactNode; tokens: { accessToken: string | null } }) {
    const { spaces, setSpaces } = useContentfulStore()

    useEffect(() => {
        if (!tokens?.accessToken) return

        initContentfulManagement(tokens.accessToken)

        getSpaces().then(spaces => {
            setSpaces(spaces.reverse())
        })
    }, [tokens, setSpaces])

    if (!spaces) return <div className="framer-spinner" />

    return children
}
