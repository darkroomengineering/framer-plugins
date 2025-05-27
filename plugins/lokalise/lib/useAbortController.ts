import { useRef, useEffect } from "react"

export function useAbortController() {
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        const controller = abortControllerRef.current
        return () => {
            controller?.abort()
        }
    }, [])

    return {
        get: () => abortControllerRef.current,
        set: () => {
            const controller = new AbortController()
            abortControllerRef.current = controller
        },
    }
}
