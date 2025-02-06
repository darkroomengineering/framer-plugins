import { Collection, CollectionField, framer, ManagedCollectionField } from "framer-plugin"
import { forwardRef, Fragment, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react"
import { CheckboxTextfield } from "./checkbox-text-field"
import cx from "classnames"
import { useInView } from "react-intersection-observer"
import { ExtendedManagedCollectionField, getFramerFieldFromContentfulField } from "../utils"
import { ContentType } from "contentful"
import { getContentType } from "../contentful"

type CollectionFieldType = ManagedCollectionField["type"]

const FIELD_TYPE_OPTIONS: { type: CollectionFieldType; label: string }[] = [
    { type: "boolean", label: "Boolean" },
    { type: "color", label: "Color" },
    { type: "number", label: "Number" },
    { type: "string", label: "String" },
    { type: "formattedText", label: "Formatted Text" },
    { type: "image", label: "Image" },
    // { type: "link", label: "Link" }, // this is string
    { type: "date", label: "Date" },
    // { type: "enum", label: "Option" }, // this doesn't make sense for the collection
    // { type: "file", label: "File" }, // this cannot be handled by the plugin
]

export function Fields({
    contentType,
    onSubmit,
}: {
    contentType: ContentType
    onSubmit: (slugId: string, fields: CollectionField[]) => void
}) {
    const [slugFieldId, setSlugFieldId] = useState<string | null>(null)
    const [mappedContentType, setMappedContentType] = useState<ExtendedManagedCollectionField[]>([])
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

    const [framerCollections, setFramerCollections] = useState<Collection[]>([])

    useEffect(() => {
        const fetchCollections = async () => {
            const framerCollections = await framer.getCollections()
            setFramerCollections(framerCollections)
        }

        fetchCollections()
    }, [])

    useEffect(() => {
        async function mapContentType() {
            if (contentType) {
                const collection = await framer.getManagedCollection()
                const fields = await collection.getFields()
                const slugFieldId = await collection.getPluginData("slugFieldId")
                const contentTypeId = await collection.getPluginData("contentTypeId")

                if (!contentTypeId) {
                    return
                }

                const contentType = await getContentType(contentTypeId)

                const existingMappedContentType = fields.map(framerField => {
                    return {
                        ...framerField,
                        field: contentType.fields.find(field => field.id === framerField.id),
                    }
                })

                let mappedContentType = await Promise.all(
                    contentType.fields.map(async field => {
                        const framerField = await getFramerFieldFromContentfulField(field)

                        return {
                            ...framerField,
                            // field,
                            defaultType: framerField.type,
                            collectionId: framerField.collectionId,
                        }
                    })
                )

                // this means it's not the first time the user is importing
                if (existingMappedContentType.length > 0) {
                    mappedContentType = mappedContentType.map(field => {
                        const existingField = existingMappedContentType.find(
                            existingField => existingField.id === field.id
                        )

                        if (existingField) {
                            field = { ...field, ...existingField }
                        }

                        if (!existingField) {
                            field.isDisabled = true
                        }

                        return field
                    })
                }

                setMappedContentType(mappedContentType as ExtendedManagedCollectionField[])
                setSlugFieldId(slugFieldId ?? mappedContentType.find(field => field.type === "string")?.id ?? null)
            }
        }

        mapContentType()
    }, [contentType])

    console.log({ contentType, mappedContentType, slugFieldId, fields })

    const { ref: scrollRef, inView: isAtBottom } = useInView({ threshold: 1 })

    const slugableFields = filteredMappedContentType?.filter(({ type }) => type === "string")

    const slugSelectRef = useRef<HTMLSelectElement>(null)
    useEffect(() => {
        setSlugFieldId(slugSelectRef.current?.value ?? null)
    }, [slugableFields])

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
                    <span className="text-xs text-framer-red">
                        A String field is required as slug. If you don't have one, you can create a new one within your
                        ContentType.
                    </span>
                )}
            </div>

            <div className="grid grid-cols items-center grid-cols-fieldPicker gap-[10px] mb-auto overflow-hidden">
                <span className="col-span-2">Column</span>
                <span>Field</span>
                <span>Type</span>{" "}
                {mappedContentType
                    ?.sort((a, b) => (a.isMissingReference ? 1 : b.isMissingReference ? -1 : 0))
                    .map(({ id, name, type, collectionId, isMissingReference, isDisabled, defaultType }, index) => (
                        <Fragment key={id}>
                            <CheckboxTextfield
                                disabled={Boolean(isMissingReference)} // if reference doesn't exist, disable the field
                                value={contentType.fields.find(field => field.id === id)?.name ?? ""}
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
                                value={type}
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
                                {collectionId ? (
                                    <>
                                        <option value="string">String</option>
                                        <option value={defaultType}>
                                            {framerCollections.find(({ id }) => id === collectionId)?.name}
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
                    disabled={!slugFieldId || !mappedContentType.length || !slugableFields.length || !fields.length}
                    className="w-full"
                    onClick={() => {
                        onSubmit(slugFieldId, fields)
                    }}
                >
                    Import from {contentType?.name}
                </button>
            </div>
        </div>
    )
}
