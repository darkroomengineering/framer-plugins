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
        formattedText: () => {
            return documentToHtmlString(value, {
                renderNode: {
                    [BLOCKS.EMBEDDED_ASSET]: node => {
                        if (node?.nodeType === "embedded-asset-block") {
                            return `<img src="${parseImageUrl(node.data.target.fields.file.url)}" />`
                        }
                    },
                },
            })
        },
    }

    return typesHandlers[framerField.type]?.() ?? String(value)
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

export type Credential = {
    accessToken: string | null
    spaceId: string | null
    authGranted: boolean
    dataSources: string[]
}

export type Credentials = Credential[]

const dataId = "contentful:credentials"
const defaultCredential = { accessToken: null, spaceId: null, authGranted: false, dataSources: [] }

type GetCredentialsArg = string | null
type SetCredentialsArg = { credential: Credential; dataSourceId: string }

export function contentfulCredentials(): {
    getCredentials: (arg: GetCredentialsArg) => Promise<Credential>
    setCredentials: (arg: SetCredentialsArg) => Promise<void>
} {
    async function parseCredentials(credentials: string): Promise<Credentials> {
        const parsedCredentials = (await JSON.parse(credentials)) as Credentials

        return Array.isArray(parsedCredentials) ? parsedCredentials : [parsedCredentials]
    }

    function dataSourceInCredentials(previousCredentials: Credentials, dataSourceId: string) {
        if (!previousCredentials) return defaultCredential

        return previousCredentials?.find(({ dataSources }) => dataSources.includes(dataSourceId))
    }

    function spaceIdInCredentials(previousCredentials: Credentials, spaceId: string) {
        if (!previousCredentials) return -1

        return previousCredentials?.findIndex(credential => credential.spaceId === spaceId)
    }

    async function getCredentials(dataSourceId: GetCredentialsArg) {
        // No datasource id means no credentials
        if (!dataSourceId) return defaultCredential

        const getPluginCredentials = await framer.getPluginData(dataId)
        // No credentials then default
        if (!getPluginCredentials) return defaultCredential

        const previousCredentials = await parseCredentials(getPluginCredentials)
        // Check if the credential already exists for this datasourceId
        const credential = dataSourceInCredentials(previousCredentials, dataSourceId)

        return credential ?? defaultCredential
    }

    async function setCredentials({ credential: newCredential, dataSourceId }: SetCredentialsArg) {
        const getPluginCredentials = await framer.getPluginData(dataId)

        // If no credentials are set, set the credential
        if (!getPluginCredentials) {
            framer.setPluginData(dataId, JSON.stringify([newCredential]))
            return
        }

        // If credentials exist, parse them
        const previousCredentials = await parseCredentials(getPluginCredentials)

        // Check if spaceId credential already exists
        const credentialIndex = spaceIdInCredentials(previousCredentials, newCredential.spaceId as string)

        if (credentialIndex !== -1) {
            // If the credential already exists, add the new dataSourceId to the existing credential
            previousCredentials?.[credentialIndex]?.dataSources?.push(dataSourceId)
        } else {
            // If the credential does not exist, add the new credential
            previousCredentials?.push(newCredential)
        }

        framer.setPluginData(dataId, JSON.stringify(previousCredentials))
    }

    return { getCredentials, setCredentials }
}
