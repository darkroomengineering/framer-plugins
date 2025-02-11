import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { Auth } from "./components/auth"
import { ContentTypePicker } from "./components/content-type-picker"
import { Fields } from "./components/fields"
import { usePluginData } from "./hooks/use-plugin-data"
import { CONTENT_TYPES, getContentType, initGreenhouse } from "./greenhouse"
import { CollectionField, CollectionItem, framer, ManagedCollectionField, Mode } from "framer-plugin"

export function App() {
    const [spaceId, setSpaceId] = usePluginData("spaceId", "")
    const [contentTypeId, setContentTypeId] = usePluginData("contentTypeId", "")
    const [slugFieldId, setSlugFieldId] = usePluginData("slugFieldId", "")
    const [isGreenhouseInitialized, setIsGreenhouseInitialized] = useState<boolean>(false)
    const [isMounted, setIsMounted] = useState(false)
    const [mode] = useState<Mode>(framer.mode)
    const [fields, setFields] = useState<CollectionField[]>([])

    useEffect(() => {
        const timeout = setTimeout(() => {
            // wait for the plugin to be mounted to avoid flickers
            setIsMounted(true)
        }, 1000)

        return () => clearTimeout(timeout)
    }, [])

    useLayoutEffect(() => {
        if (spaceId) {
            initGreenhouse(spaceId)
                .then(() => {
                    setIsGreenhouseInitialized(true)
                    framer.setPluginData("greenhouse", spaceId)
                })
                .catch(() => {
                    setSpaceId("")
                    setIsGreenhouseInitialized(false)
                })
        }
    }, [spaceId, setSpaceId])

    const sync = useCallback(async () => {
        console.log("syncing", slugFieldId, contentTypeId)
        if (!slugFieldId || !contentTypeId) return

        const contentType = CONTENT_TYPES.find(contentType => contentType.id === contentTypeId)

        if (!contentType) return // TODO: handle this, content type not supported

        const collection = await framer.getManagedCollection()

        const fields = await collection.getFields()

        const entries = await getContentType(contentTypeId)

        const mappedEntries = entries.map(entry => {
            const mappedEntry = contentType.mapEntry(entry)
            // console.log(mappedEntry)

            return {
                id: mappedEntry.id,
                slug: slugFieldId === "id" ? `${mappedEntry.id}` : `${mappedEntry[slugFieldId]}-${mappedEntry.id}`,
                fieldData: Object.fromEntries(
                    Object.entries(mappedEntry).filter(([key]) => fields.map(field => field.id).includes(key))
                ),
            }
        })

        const existingEntriesIds = await collection.getItemIds()
        const entriesToBeRemoved = existingEntriesIds.filter(id => !mappedEntries.some(entry => entry.id === id))

        await collection.addItems(mappedEntries as CollectionItem[])
        await collection.removeItems(entriesToBeRemoved)

        framer.closePlugin()
    }, [slugFieldId, contentTypeId])

    // sync
    useEffect(() => {
        if (mode === "syncManagedCollection" && slugFieldId && contentTypeId && isGreenhouseInitialized) {
            sync()
        }
    }, [mode, isGreenhouseInitialized, sync, slugFieldId, contentTypeId])

    // sync on manage
    useEffect(() => {
        const set = async () => {
            const collection = await framer.getManagedCollection()
            await collection.setFields(fields as ManagedCollectionField[])
            await sync()
        }

        if (mode === "configureManagedCollection" && fields.length > 0 && slugFieldId && isGreenhouseInitialized) {
            set()
        }
    }, [mode, fields, slugFieldId, sync, isGreenhouseInitialized])

    const onSubmitFields = async (slugId: string, fields: CollectionField[]) => {
        setFields(fields)
        setSlugFieldId(slugId)
    }

    if (mode === "syncManagedCollection") return
    if (!isMounted) return

    return (
        <>
            {/* <button
                className="fixed"
                onClick={() => {
                    setSpaceId("")
                    setContentTypeId("")
                    setIsGreenhouseInitialized(false)

                    framer.setPluginData(`${pkg.name}:collections`, JSON.stringify([]))
                }}
            >
                reset
            </button> */}
            <div className="w-full px-[15px] flex flex-col flex-1 overflow-y-auto no-scrollbar">
                {!spaceId ? (
                    <Auth onSubmit={setSpaceId} />
                ) : !contentTypeId ? (
                    isGreenhouseInitialized && <ContentTypePicker onSubmit={setContentTypeId} />
                ) : (
                    isGreenhouseInitialized && <Fields contentTypeId={contentTypeId} onSubmit={onSubmitFields} />
                )}
            </div>
        </>
    )
}
