import { useInView } from "react-intersection-observer"
import { CONTENT_TYPES, FIELD_TYPE_OPTIONS } from "../greenhouse"
import { CheckboxTextfield } from "./checkbox-text-field"
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import cx from "classnames"
import { CollectionField, framer, ManagedCollectionField } from "framer-plugin"
import { useCollections } from "../hooks/use-collections"

type CollectionFieldType = ManagedCollectionField["type"]

export function Fields({
    contentTypeId,
    onSubmit,
}: {
    contentTypeId: string
    onSubmit: (slugFieldId: string, fields: CollectionField[]) => Promise<void>
}) {
    const contentType = CONTENT_TYPES.find(type => type.id === contentTypeId)

    const [mappedContentType, setMappedContentType] = useState<
        {
            id: string
            name: string
            type: string
            defaultType: string
            isDisabled: boolean
            isMissingReference: boolean
            collectionId?: string
            userEditable: boolean
        }[]
    >([])

    const collections = useCollections()

    console.log({ collections })

    const filteredMappedContentType = mappedContentType?.filter(
        ({ isDisabled, isMissingReference }) => !isDisabled && !isMissingReference
    )

    const fields = filteredMappedContentType?.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        userEditable: field.userEditable,
        collectionId: field.collectionId,
    }))

    useEffect(() => {
        if (collections.length === 0) return

        const fetch = async () => {
            const collection = await framer.getManagedCollection()

            const fields = await collection.getFields()

            setMappedContentType(
                contentType?.fields?.map(field => {
                    const collectionId = collections.find(
                        collection => collection.contentTypeId === field?.contentTypeId
                    )?.id

                    const existingField = fields.find(f => f.id === field.id)

                    return {
                        ...field,
                        name: existingField?.name ?? field.name,
                        type: existingField?.type ?? field.type,
                        defaultType: field.type,
                        isDisabled: !existingField && fields.length !== 0,
                        isMissingReference:
                            (field.type === "multiCollectionReference" || field.type === "collectionReference") &&
                            !collectionId,
                        collectionId,
                        userEditable: false,
                    }
                }) ?? []
            )
        }

        fetch()
    }, [contentType, collections])

    const slugableFields = filteredMappedContentType?.filter(({ type }) => type === "string")

    const [slugFieldId, setSlugFieldId] = useState<string | null>(null)
    const slugSelectRef = useRef<HTMLSelectElement>(null)

    useEffect(() => {
        const fetch = async () => {
            const collection = await framer.getManagedCollection()
            const slugFieldId = await collection.getPluginData("slugFieldId")

            if (slugFieldId) {
                setSlugFieldId(slugFieldId)
            } else {
                setTimeout(() => {
                    setSlugFieldId(slugSelectRef.current?.value ?? "")
                }, 500)
            }
        }

        fetch()
    }, [])

    const [isLoading, setIsLoading] = useState(false)
    const { ref: scrollRef, inView: isAtBottom } = useInView({ threshold: 1 })

    useLayoutEffect(() => {
        if (mappedContentType.length === 0) return

        framer.showUI({
            width: 340,
            height: Math.max(345, Math.min(425, (mappedContentType?.length ?? 0) * 100)),
            resizable: false,
        })
    }, [mappedContentType])

    if (mappedContentType.length === 0) return

    // return
    return (
        <div className="col gap-[10px] flex-1 text-tertiary">
            <div className="h-px border-b border-divider mb-[5px] sticky top-0" />
            <div className="flex flex-col gap-[10px] mb-[15px] w-full">
                <label htmlFor="collectionName">Slug Field</label>
                <select
                    ref={slugSelectRef}
                    className="w-full"
                    defaultValue={slugFieldId ?? ""}
                    onChange={e => setSlugFieldId(e.target.value)}
                    disabled={!slugableFields?.length}
                >
                    {slugableFields?.map(({ id, name }) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
                {slugableFields?.length === 0 && (
                    <span className="text-xs text-framer-red">A String field is required as slug.</span>
                )}
            </div>

            <div className="grid grid-cols items-center grid-cols-fieldPicker gap-[10px] mb-auto overflow-hidden">
                <span className="col-span-2">Column</span>
                <span>Field</span>
                <span>Type</span>{" "}
                {mappedContentType
                    ?.sort((a, b) => (a.isMissingReference ? 1 : b.isMissingReference ? -1 : 0))
                    ?.map(({ id, name, type, isDisabled, isMissingReference, collectionId, defaultType }, index) => (
                        <Fragment key={id}>
                            <CheckboxTextfield
                                disabled={Boolean(isMissingReference)}
                                value={contentType?.fields?.find(field => field.id === id)?.name ?? ""}
                                checked={!isDisabled && !isMissingReference}
                                onChange={() => {
                                    setMappedContentType(prev => {
                                        if (!prev) return prev
                                        const newMappedContentType = structuredClone(prev)
                                        newMappedContentType[index].isDisabled = !newMappedContentType[index].isDisabled
                                        return newMappedContentType
                                    })
                                }}
                            />
                            <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16">
                                    <path
                                        d="M 3 11 L 6 8 L 3 5"
                                        fill="transparent"
                                        strokeWidth="1.5"
                                        stroke="#999"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className={cx("w-full", {
                                    "opacity-50": isDisabled || isMissingReference,
                                })}
                                placeholder={name}
                                value={isMissingReference ? "Missing reference" : name}
                                disabled={isDisabled || isMissingReference}
                                onChange={e => {
                                    setMappedContentType(prev => {
                                        if (!prev) return prev
                                        const newMappedContentType = structuredClone(prev)
                                        newMappedContentType[index].name = e.target.value
                                        return newMappedContentType
                                    })
                                }}
                            />
                            <select
                                className={cx("w-full", {
                                    "opacity-50": isDisabled || isMissingReference,
                                })}
                                value={isMissingReference ? "string" : type}
                                disabled={isDisabled || isMissingReference}
                                onChange={e => {
                                    setMappedContentType(prev => {
                                        if (!prev) return prev
                                        const newMappedContentType = structuredClone(prev)
                                        newMappedContentType[index].type = e.target.value as CollectionFieldType
                                        return newMappedContentType
                                    })
                                }}
                            >
                                {collectionId || isMissingReference ? (
                                    <>
                                        <option value="string">String</option>
                                        <option value={defaultType}>
                                            {collections.find(({ id }) => id === collectionId)?.name}
                                        </option>
                                    </>
                                ) : (
                                    FIELD_TYPE_OPTIONS.map(({ type, label }) => (
                                        <option value={type} key={label}>
                                            {label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </Fragment>
                    ))}
                {mappedContentType && mappedContentType?.length > 6 && !isAtBottom && (
                    <div className="scroll-fade"></div>
                )}
                <div ref={scrollRef} className="h-0 w-0"></div>
            </div>
            <div className="sticky left-0 bottom-0 flex justify-between bg-primary py-[15px] border-t border-divider border-opacity-20 items-center max-w-full">
                <button
                    type="button"
                    disabled={
                        isLoading ||
                        !slugFieldId ||
                        !mappedContentType.length ||
                        !slugableFields.length ||
                        !fields.length
                    }
                    className="w-full"
                    onClick={async () => {
                        setIsLoading(true)
                        try {
                            console.log(slugSelectRef.current?.value)
                            // @ts-expect-error: button can't be clicked if it's disabled
                            await onSubmit(slugSelectRef.current?.value, fields)
                        } catch (error) {
                            console.error(error)
                        } finally {
                            setIsLoading(false)
                        }
                    }}
                >
                    {isLoading ? "Importing..." : `Import from ${contentType?.name}`}
                </button>
            </div>
        </div>
    )
}
