import { useCallback, useState } from "react"
import { framer } from "framer-plugin"
import { getProjects, uploadTranslations } from "./api"
import { parseFramerDataForLokalise } from "./parse"
import { isEmptyArray } from "../src/utils"
import { useAbortController } from "./useAbortController"
import type { AuthToken } from "./types"

export function useUploadTranslations(authToken: AuthToken) {
    const [isLoading, setIsLoading] = useState(false)
    const abortController = useAbortController()

    const fetchAndUploadTranslations = useCallback(async () => {
        if (!authToken) return
        setIsLoading(true)

        if (abortController.get()) {
            abortController.get()?.abort()
        }
        abortController.set()

        try {
            const baseLocale = await framer.getDefaultLocale()
            const locales = await framer.getLocales()
            const groups = await framer.getLocalizationGroups()

            if (isEmptyArray(locales) || isEmptyArray(groups)) {
                console.log("Framer locales or groups data is missing or empty.")
                return
            }

            // Parse the Framer data for Lokalise
            const parsedData = parseFramerDataForLokalise({ baseLocale: baseLocale.code, locales, groups })

            // Get the projects
            const projectsData = await getProjects( authToken )

            if (!projectsData.projects || projectsData.projects.length === 0) {
                console.log("No projects found via lib/getProjects. Cannot proceed with uploads.")
                return
            }

            // Get the project ID and base language ISO
            const selectedProject = projectsData.projects[0]
            const projectId = selectedProject.project_id
            const projectBaseIso: string = selectedProject.base_language_iso
            const filenameForUpload = "framer_translations_" + projectBaseIso + ".json"

            const translations = parsedData[projectBaseIso as keyof typeof parsedData]
            if (!translations) {
                console.log(`No translations found for locale: ${projectBaseIso}`)
                return
            }

            const uploadResult = await uploadTranslations({
                ...authToken,
                projectId,
                langIso: projectBaseIso,
                filename: filenameForUpload,
                translations,
            })
            console.log(`Upload queued successfully for ${filenameForUpload}:`, uploadResult)
        } catch (error: unknown) {
            console.log("Error in fetchAndUploadTranslations:", error instanceof Error ? error.message : String(error))
        } finally {
            setIsLoading(false)
        }
    }, [authToken,abortController])

    return { fetchAndUploadTranslations, isLoading }
}
