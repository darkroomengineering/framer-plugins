import { useState, useCallback } from "react"
import { framer } from "framer-plugin"
import { getProjectLanguages, getProjects, getTranslationsAsJson } from "./api"

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

        const languagesData = await getProjectLanguages(authToken, projectId)
        const availableLokaliseIsos = languagesData.languages.filter(
            (lang: { lang_iso: string }) => lang.lang_iso !== projectBaseIso
        )

        const langIso = availableLokaliseIsos[0].lang_iso
        const langId = availableLokaliseIsos[0].lang_id

        try {
            const translations = await getTranslationsAsJson(authToken, projectId, langIso, langId)
            console.log(translations)
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
