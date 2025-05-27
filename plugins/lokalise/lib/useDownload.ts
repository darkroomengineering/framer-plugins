import { useState, useCallback } from "react"
import { framer } from "framer-plugin"
import { getProjects, downloadAllTranslationsAsJson } from "./api"
import { isEmptyArray } from "../src/utils"
import { parseLokaliseDataForFramer } from "./parse"
import { useAbortController } from "./useAbortController"
import type { AuthToken } from "./types"

export function useDownloadTranslations(authToken: AuthToken) {
    const [isLoading, setIsLoading] = useState(false)
    const abortController = useAbortController()

    const fetchAndApplyTranslations = useCallback(async () => {
        if (!authToken) {
            const errorMessage = "Authentication token is missing."
            console.log(errorMessage)
            throw new Error(errorMessage)
            return
        }

        if (abortController.get()) {
            abortController.get()?.abort()
        }
        abortController.set()
        setIsLoading(true)

        const locales = await framer.getLocales()
        const groups = await framer.getLocalizationGroups()

        // Get the projects
        const projectsData = await getProjects( authToken )

        if (isEmptyArray(projectsData.projects)) {
            console.log("No projects found via lib/getProjects. Cannot proceed with uploads.")
            return
        }

        // Get the project ID and base language ISO
        const selectedProject = projectsData.projects[0]
        const projectId = selectedProject.project_id

        try {
            const translations = await downloadAllTranslationsAsJson({ ...authToken, projectId })

            const parsedData = parseLokaliseDataForFramer({ lokaliseData: translations, locales, groups })

            await framer.setLocalizationData(parsedData)
        } catch (e: unknown) {
            const errorMessage = "Failed to download or apply translations:"
            console.log(errorMessage, e)
            framer.notify(`Error applying translations: ${e instanceof Error ? e.message : "Unknown error"}`, {
                variant: "error",
            })
        } finally {
            setIsLoading(false)
        }
    }, [authToken,abortController])

    return { fetchAndApplyTranslations, isLoading }
}
