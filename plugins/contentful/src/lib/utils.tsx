import { type ManagedCollectionFieldInput } from "framer-plugin"
import { type ContentTypeField, type ContentType } from "contentful"
import { type FieldDataEntryInput } from "framer-plugin"
import { framer } from "framer-plugin"
import { documentToHtmlString } from "@contentful/rich-text-html-renderer"
import { BLOCKS } from "@contentful/rich-text-types"
import { PLUGIN_KEYS } from "../data"

export type ExtendedManagedCollectionField = ManagedCollectionFieldInput & {
    isDisabled?: boolean
    field?: ManagedCollectionFieldInput
    isMissingReference?: boolean
    collectionId?: string
    defaultType?: string
}

export type Credentials = {
    accessToken: string | null
    spaceId: string | null
    authGranted: boolean
}

export async function getFramerFieldFromContentfulField(field: ContentTypeField): Promise<ManagedCollectionFieldInput> {
    const baseField = {
        id: field.id ?? "",
        name: field.name ?? "",
        userEditable: false,
    }

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
            // Linked media
            if (field.linkType === "Asset") {
                return { ...baseField, type: "image" }
            }

            // Linked content types
            if (field.linkType === "Entry") {
                const fieldCollection = await linkedCollectionId(field, "collectionReference")

                return fieldCollection as ManagedCollectionFieldInput
            }

            return { ...baseField, type: "string" }
        case "Array":
            // Linked media
            if (field.items?.type === "Link" && field.items.linkType === "Asset") {
                return { ...baseField, type: "image" }
            }

            // Linked content types
            if (field.items?.type === "Link" && field.items.linkType === "Entry") {
                const fieldCollection = await linkedCollectionId(field, "multiCollectionReference")

                return fieldCollection as ManagedCollectionFieldInput
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

    const typesHandlers: Record<string, () => FieldDataEntryInput["value"]> = {
        boolean: () => Boolean(value),
        number: () => {
            const num = Number(value)
            return isNaN(num) ? 0 : num
        },
        string: () => String(value),
        date: () => String(value),
        color: () => String(value),
        image: () => parseImageUrl(value?.fields?.file?.url),
        collectionReference: () => value.sys.id,
        multiCollectionReference: () => value.map(({ sys }) => sys.id),
        formattedText: () =>
            documentToHtmlString(value, {
                renderNode: {
                    [BLOCKS.EMBEDDED_ASSET]: node => {
                        if (node?.nodeType === "embedded-asset-block") {
                            return `<img src="${parseImageUrl(node.data.target.fields.file.url)}" />`
                        }
                    },
                },
            }),
    }

    return typesHandlers[framerField.type]?.() ?? String(value)
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

async function linkedCollectionId(field: ContentTypeField, type: string) {
    const defaultField = {
        id: field.id ?? "",
        name: field.name ?? "",
        userEditable: false,
        collectionId: null,
        type,
    }

    const contentField = type === "multiCollectionReference" ? field.items : field

    const linkedContentType = contentField?.validations?.[0]?.linkContentType?.[0]

    if (!linkedContentType) return defaultField

    // Map linked content type id to a collection through data source id and retrieve the collection id
    const collections = await framer.getManagedCollections()
    const collectionsIds = await Promise.all(
        collections.map(async collection => {
            const dataSourceId = await collection.getPluginData(PLUGIN_KEYS.DATA_SOURCE_ID)
            return { dataSourceId, collectionId: collection.id }
        })
    )

    const linkedDataSourceId = collectionsIds.find(collection => collection.dataSourceId === linkedContentType)

    if (!linkedDataSourceId) return defaultField

    return {
        ...defaultField,
        collectionId: linkedDataSourceId.collectionId,
    }
}
