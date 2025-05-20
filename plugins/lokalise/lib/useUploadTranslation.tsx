import { useEffect } from "react"
import { framer } from "framer-plugin"
import { getProjects, uploadSingleLanguageTranslations } from "./api"
import { parseFramerDataForLokalise } from "./parse"

const baseLocale = "en"

export function useUploadTranslations(uploading: boolean, authToken: string | null) {
    useEffect(() => {
        if (!authToken || !uploading) return

        const fetchAndUploadTranslations = async () => {
            try {
                const locales = await framer.getLocales()
                const groups = await framer.getLocalizationGroups()

                if (!locales || locales.length === 0 || !groups || groups.length === 0) {
                    console.log("Framer locales or groups data is missing or empty.")
                    return
                }

                // Parse the Framer data for Lokalise
                const parsedData = parseFramerDataForLokalise(baseLocale, locales, groups)

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
                const filenameForUpload = `framer_translations_${projectBaseIso}.json`

                try {
                    const uploadResult = await uploadSingleLanguageTranslations(
                        authToken,
                        projectId,
                        projectBaseIso,
                        `framer_translations_${projectBaseIso}.json`,
                        parsedData[projectBaseIso]
                    )
                    console.log(`Upload queued successfully for ${filenameForUpload}:`, uploadResult)
                } catch (uploadError: unknown) {
                    if (uploadError instanceof Error) {
                        console.error(`Error uploading ${filenameForUpload}:`, uploadError.message, uploadError)
                    } else {
                        console.error(`Error uploading ${filenameForUpload}:`, String(uploadError))
                    }
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error("Error in fetchAndUploadTranslations:", error.message, error)
                } else {
                    console.error("Error in fetchAndUploadTranslations:", String(error))
                }
            }
        }

        fetchAndUploadTranslations()
    }, [authToken, uploading])
}
