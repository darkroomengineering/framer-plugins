import { useInView } from "react-intersection-observer"
import { CONTENT_TYPES, FIELD_TYPE_OPTIONS } from "../greenhouse"
import { CheckboxTextfield } from "./checkbox-text-field"
import { Fragment } from "react"
import cx from "classnames"

export function Fields({ contentTypeId }: { contentTypeId: string }) {
    const { ref: scrollRef, inView: isAtBottom } = useInView({ threshold: 1 })

    const contentType = CONTENT_TYPES.find(type => type.id === contentTypeId)
    console.log(contentType)

    // return
    return (
        <div>
            <div className="grid grid-cols items-center grid-cols-fieldPicker gap-[10px] mb-auto overflow-hidden">
                <span className="col-span-2">Column</span>
                <span>Field</span>
                <span>Type</span>{" "}
                {contentType?.fields?.map(({ id, name, type }, index) => (
                    <Fragment key={id}>
                        <CheckboxTextfield
                            // disabled={Boolean(isMissingReference)} // if reference doesn't exist, disable the field
                            value={contentType.fields.find(field => field.id === id)?.name ?? ""}
                            // checked={!isDisabled && !isMissingReference}
                            checked={true}
                            onChange={() => {
                                // setMappedContentType(prev => {
                                //     if (!prev) return prev
                                //     const newMappedContentType = structuredClone(prev)
                                //     newMappedContentType[index].isDisabled = !newMappedContentType[index].isDisabled
                                //     return newMappedContentType
                                // })
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
                                // "opacity-50": isDisabled || isMissingReference,
                            })}
                            placeholder={name}
                            value={name}
                            // value={isMissingReference ? "Missing reference" : name}
                            // disabled={isDisabled || isMissingReference}
                            onChange={e => {
                                // setMappedContentType(prev => {
                                //     if (!prev) return prev
                                //     const newMappedContentType = structuredClone(prev)
                                //     newMappedContentType[index].name = e.target.value
                                //     return newMappedContentType
                                // })
                            }}
                        />
                        <select
                            className={cx("w-full", {
                                // "opacity-50": isDisabled || isMissingReference,
                            })}
                            value={type}
                            // disabled={isDisabled || isMissingReference}
                            onChange={e => {
                                // setMappedContentType(prev => {
                                //     if (!prev) return prev
                                //     const newMappedContentType = structuredClone(prev)
                                //     newMappedContentType[index].type = e.target.value as CollectionFieldType
                                //     return newMappedContentType
                                // })
                            }}
                        >
                            {/* {collectionId ? (
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
                            )} */}

                            {FIELD_TYPE_OPTIONS.map(({ type, label }) => (
                                <option value={type} key={label}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </Fragment>
                ))}
                {/* {mappedContentType && mappedContentType?.length > 6 && !isAtBottom && (
                    <div className="scroll-fade"></div>
                )} */}
                {!isAtBottom && <div className="scroll-fade"></div>}
                <div ref={scrollRef} className="h-0 w-0"></div>
            </div>
            <div className="sticky left-0 bottom-0 flex justify-between bg-primary py-[15px] border-t border-divider border-opacity-20 items-center max-w-full">
                <button
                    type="button"
                    // disabled={
                    //     isLoading ||
                    //     !slugFieldId ||
                    //     !mappedContentType.length ||
                    //     !slugableFields.length ||
                    //     !fields.length
                    // }
                    className="w-full"
                    onClick={async () => {
                        // setIsLoading(true)
                        // // @ts-expect-error: button can't be clicked if it's disabled
                        // await onSubmit(slugFieldId, fields)
                        // setIsLoading(false)
                    }}
                >
                    {/* {isLoading ? "Importing..." : `Import from ${contentType?.name}`} */}
                    Import from {contentType?.name}
                </button>
            </div>
        </div>
    )
}
