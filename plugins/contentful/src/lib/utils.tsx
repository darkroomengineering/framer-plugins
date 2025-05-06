import { type ManagedCollectionFieldInput } from "framer-plugin"
import { framer } from "framer-plugin"
import { type ContentTypeField, type ContentType } from "contentful"
import { documentToHtmlString } from "@contentful/rich-text-html-renderer"
import { BLOCKS } from "@contentful/rich-text-types"
import { type FieldDataEntryInput } from "framer-plugin"

export type ExtendedManagedCollectionField = ManagedCollectionFieldInput & {
    isDisabled?: boolean
    field?: ContentTypeField
    isMissingReference?: boolean
    collectionId?: string
    defaultType?: string
}

export type Credentials = {
    accessToken: string | null
    spaceId: string | null
    authGranted: boolean
}

function getCollectionId(field: ContentTypeField, collections: Record<string, { id: string }> | null) {
    const validationContentType = field?.validations?.[0]?.linkContentType?.[0]
    return validationContentType && collections ? collections[validationContentType]?.id : null
}

export async function getFramerFieldFromContentfulField(field: ContentTypeField): Promise<ManagedCollectionFieldInput> {
    const baseField = {
        id: field.id ?? "",
        name: field.name ?? "",
        userEditable: false,
    }

    // TODO: fix collections references
    let collections = await framer.getPluginData("contentful:collections")
    collections = collections ? JSON.parse(collections) : {}

    switch (field.type) {
        case "Integer":
        case "Number":
            return { ...baseField, type: "number" }
        case "Boolean":
            return { ...baseField, type: "boolean" }
        case "Date":
            return { ...baseField, type: "date" }
        case "Text":
        case "Symbol":
            return { ...baseField, type: "string" }
        case "RichText":
            return { ...baseField, type: "formattedText" }
        case "Link":
            if (field.linkType === "Asset") {
                return { ...baseField, type: "image" }
            }
            if (field.linkType === "Entry") {
                const collectionId = getCollectionId(field, collections)

                if (!collectionId) {
                    return { ...baseField, type: "string" }
                }

                return { ...baseField, type: "collectionReference", collectionId }
            }
            return { ...baseField, type: "string" }
        case "Array":
            if (field.items?.type === "Link" && field.items.linkType === "Entry") {
                const collectionId = getCollectionId(field.items, collections)

                if (collectionId) {
                    return { ...baseField, type: "multiCollectionReference", collectionId }
                }
            }
            return { ...baseField, type: "string" }
        default:
            return { ...baseField, type: "string" }
    }
}

export function mapContentfulValueToFramerValue(value: ContentType, framerField: ExtendedManagedCollectionField) {
    // Handle undefined type
    if (!framerField?.type || typeof framerField?.type !== "string") return ""

    // Handle null or undefined value
    if (value === null || value === undefined) {
        switch (framerField?.type) {
            case "boolean":
                return false
            case "number":
                return 0
            case "multiCollectionReference":
                return []
            case "collectionReference":
                return ""
            default:
                return ""
        }
    }

    const flatTypesHandlers: Record<string, () => FieldDataEntryInput["value"]> = {
        boolean: () => Boolean(value),
        number: () => {
            const num = Number(value)
            return isNaN(num) ? 0 : num
        },
        string: () => String(value),
        date: () => String(value),
        color: () => String(value),
        image: () => parseImageUrl(value?.fields?.file?.url),
    }

    const flatTypes = flatTypesHandlers[framerField.type]
    const fieldType = framerField?.field?.type
    const linkType = framerField?.field?.linkType

    // Handle flat types
    if (flatTypes) return flatTypes()

    // Handle array types
    if (fieldType === "Array" && Array.isArray(value)) {
        const returnValue = value
            .map(item => {
                if (item && typeof item === "object" && "sys" in item && "fields" in item) {
                    if (item.sys.type === "Asset" && "file" in item.fields) {
                        return parseImageUrl(item.fields?.file?.url)
                    }
                    if (item.sys.type === "Entry") {
                        return item.sys.id
                    }
                }
                return typeof item === "string" ? item : ""
            })
            .filter(Boolean)

        if (framerField?.type === "image") {
            // Framer doesn't support multiple images in a collection field, so we need to return the first image
            return returnValue[0]
        }

        if (framerField?.type === "string") {
            return returnValue.join(",")
        }

        return returnValue
    }

    // Handle linked types, links or assets
    if (fieldType === "Link" && typeof value === "object" && value !== null) {
        const item = value as {
            sys?: { type?: string; id?: string }
            fields?: { file?: { url?: string } }
        }

        if (item.sys?.type === "Asset" && linkType === "Asset") {
            return parseImageUrl(item.fields?.file?.url)
        }

        if (item.sys?.type === "Entry" && linkType === "Entry" && item.sys.id) {
            return item.sys.id
        }

        return ""
    }

    // Handle rich text
    if (fieldType === "RichText") {
        // @ts-expect-error as to render it as string
        return documentToHtmlString(value, {
            renderNode: {
                [BLOCKS.EMBEDDED_ASSET]: node => {
                    if (node?.nodeType === "embedded-asset-block") {
                        return `<img src="${parseImageUrl(node.data.target.fields.file.url)}" />`
                    }
                },
            },
        })
    }

    return String(value)
}

const credentials = { accessToken: null, spaceId: null, authGranted: false }
export async function parseContentfulCredentials(): Promise<Credentials> {
    const previousContentfulSpace = await framer.getPluginData("contentful:space")

    try {
        return await JSON.parse(previousContentfulSpace ?? `${credentials}`)
    } catch {
        return credentials
    }
}

function parseImageUrl(url: string | undefined) {
    if (!url) return ""
    if (url.startsWith("//")) return "https:" + url
    return url
}
