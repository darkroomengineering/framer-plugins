import { useEffect } from "react"
import { framer } from "framer-plugin"
import { getProjects, uploadTranslations } from "./api"
import { parseFramerDataForLokalise } from "./parse"
import { isEmptyArray } from "../src/utils"
import type { LokaliseData } from "./parse"

export function useUploadTranslations(uploading: boolean, authToken: string | null) {
    useEffect(() => {
        if (!authToken || !uploading) return

        const fetchAndUploadTranslations = async () => {
            try {
                const baseLocale = await framer.getDefaultLocale()
                const locales = await framer.getLocales()
                const groups = await framer.getLocalizationGroups()

                if (isEmptyArray(locales) || isEmptyArray(groups)) {
                    console.log("Framer locales or groups data is missing or empty.")
                    return
                }

                // Parse the Framer data for Lokalise
                const parsedData = parseFramerDataForLokalise(baseLocale.code, locales, groups)

                // Get the projects
                const projectsData = await getProjects(authToken)

                if (!projectsData.projects || projectsData.projects.length === 0) {
                    console.log("No projects found via lib/getProjects. Cannot proceed with uploads.")
                    return
                }

                // Get the project ID and base language ISO
                const selectedProject = projectsData.projects[0]
                const projectId = selectedProject.project_id
                const projectBaseIso = selectedProject.base_language_iso
                const filenameForUpload = "framer_translations_" + projectBaseIso + ".json"

                const uploadResult = await uploadTranslations(
                    authToken,
                    projectId,
                    projectBaseIso,
                    filenameForUpload,
                    parsedData[projectBaseIso] as unknown as LokaliseData
                )
                console.log(`Upload queued successfully for ${filenameForUpload}:`, uploadResult)
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.log("Error in fetchAndUploadTranslations:", error.message, error)
                } else {
                    console.log("Error in fetchAndUploadTranslations:", String(error))
                }
            }
        }

        fetchAndUploadTranslations()
    }, [authToken, uploading])
}
