import { useState, useCallback } from "react"
import { framer } from "framer-plugin"
import { getProjects, downloadAllTranslationsAsJson } from "./api"
import { isEmptyArray } from "../src/utils"
import { parseLokaliseDataForFramer } from "./parse"

export function useDownloadTranslations(authToken: string | null) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAndApplyTranslations = useCallback(async () => {
        if (!authToken) {
            setError("Authentication token is missing.")
            return
        }

        setIsLoading(true)
        setError(null)

        const locales = await framer.getLocales()
        const groups = await framer.getLocalizationGroups()

        // Get the projects
        const projectsData = await getProjects(authToken)

        if (isEmptyArray(projectsData.projects)) {
            console.log("No projects found via lib/getProjects. Cannot proceed with uploads.")
            return
        }

        // Get the project ID and base language ISO
        const selectedProject = projectsData.projects[0]
        const projectId = selectedProject.project_id

        try {
            const translations = await downloadAllTranslationsAsJson(authToken, projectId)

            const parsedData = parseLokaliseDataForFramer(translations, locales, groups)

            await framer.setLocalizationData(parsedData)
        } catch (e: unknown) {
            console.error("Failed to download or apply translations:", e)
            setError(`Error: ${e.message}`)
            framer.notify(`Error applying translations: ${e.message}`, { variant: "error" })
        } finally {
            setIsLoading(false)
        }
    }, [authToken])

    return { fetchAndApplyTranslations, isLoading, error }
}
