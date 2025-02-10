import { framer } from "framer-plugin"
import { useCallback, useEffect, useState } from "react"

function parse(str: string): string | object {
    try {
        const parsed = JSON.parse(str)
        return parsed
    } catch (e) {
        return str
    }
}

type PluginData<T> = [T | null, (value: T | null) => Promise<void>, () => Promise<T | undefined>]

export function usePluginData<T>(key: string, initialValue: T): PluginData<T> {
    const [data, setData] = useState<T | null>(initialValue)

    const get = useCallback(async () => {
        const collection = await framer.getManagedCollection()
        const serializedData = await collection.getPluginData(key)

        if (!serializedData) return

        return parse(serializedData) as T
    }, [key])

    useEffect(() => {
        get().then(v => {
            if (v) setData(v)
        })
    }, [key, get])

    const set = useCallback(
        async (value: T | null) => {
            const collection = await framer.getManagedCollection()

            if (typeof value === "object") {
                await collection.setPluginData(key, JSON.stringify(value))
            } else {
                await collection.setPluginData(key, value as string)
            }

            setData(value)
        },
        [key]
    )

    return [data, set, get] as const
}
