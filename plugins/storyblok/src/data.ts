// import { type StoryblokGenericFieldType } from "storyblok-schema-types"
import {
    type ManagedCollectionFieldInput,
    type FieldDataInput,
    framer,
    type ManagedCollection,
    type ManagedCollectionItemInput,
} from "framer-plugin"
import { findBloksInStories, getComponentFromSpaceId, getStoriesFromSpaceId, getStoryblokClient } from "./storyblok"
import type { StoryblokRegion } from "./storyblok"
import { capitalizeFirstLetter, createUniqueSlug, filterAsync } from "./utils"
import { richTextResolver } from "@storyblok/richtext"
import type { StoryblokRichTextNode } from "@storyblok/richtext"

export const PLUGIN_KEYS = {
    DATA_SOURCE_ID: "dataSourceId",
    SLUG_FIELD_ID: "slugFieldId",
    PERSONAL_ACCESS_TOKEN: "personalAccessToken",
    SPACE_ID: "spaceId",
    REGION: "region",
} as const

// this is used in FieldMapping.tsx to display the collections options in the dropdown
export type ExtendedManagedCollectionFieldInput = ManagedCollectionFieldInput & {
    collectionsOptions?: ManagedCollection[]
}

export interface DataSource {
    id: string
    fields: readonly ExtendedManagedCollectionFieldInput[]
    items: FieldDataInput[]
    idField: ManagedCollectionFieldInput
    slugField: ManagedCollectionFieldInput | null
    region: StoryblokRegion
    spaceId: string
}

export type DataSourceOption = {
    id: string
    name: string
    idFieldId?: string
    slugFieldId?: string
}

export const dataSourceOptions: DataSourceOption[] = []

/**
 * Retrieve data and process it into a structured format.
 *
 * @example
 * {
 *   id: "articles",
 *   fields: [
 *     { id: "title", name: "Title", type: "string" },
 *     { id: "content", name: "Content", type: "formattedText" }
 *   ],
 *   items: [
 *     { title: "My First Article", content: "Hello world" },
 *     { title: "Another Article", content: "More content here" }
 *   ]
 * }
 */

const { render } = richTextResolver()

export async function getDataSource({
    personalAccessToken,
    region,
    spaceId,
    collectionId,
}: {
    personalAccessToken: string
    spaceId: string
    collectionId: string
    region: StoryblokRegion
}): Promise<DataSource> {
    const client = await getStoryblokClient(region, personalAccessToken)

    if (!client) {
        throw new Error("Client not found")
    }

    const component = await getComponentFromSpaceId(client, spaceId, collectionId)

    if (!component) {
        throw new Error(`Component with id ${collectionId} not found`)
    }

    const stories = await getStoriesFromSpaceId(client, spaceId)
    const bloks = findBloksInStories(stories, component.name)

    const schema = component.schema

    // map schema to fields

    const idField: ManagedCollectionFieldInput = {
        id: "_uid",
        name: "ID",
        type: "string",
    }

    const fields: ExtendedManagedCollectionFieldInput[] = [idField]

    for (const [key, { type, component_whitelist, is_reference_type }] of Object.entries(schema)) {
        switch (type) {
            case "bloks":
                if (component_whitelist?.length === 1) {
                    let collectionId = ""
                    let matchingCollections: ManagedCollection[] = []

                    const referenceCollectionId = component_whitelist?.[0]
                    const managedCollections = await framer.getManagedCollections()
                    matchingCollections = await filterAsync(managedCollections, async collection => {
                        const collectionSpaceId = await collection.getPluginData(PLUGIN_KEYS.SPACE_ID)
                        const dataSourceId = await collection.getPluginData(PLUGIN_KEYS.DATA_SOURCE_ID)

                        return dataSourceId === referenceCollectionId && collectionSpaceId === spaceId
                    })

                    if (matchingCollections.length === 0) {
                        console.warn(`Reference collection with id ${referenceCollectionId} not found`)
                    } else {
                        collectionId = matchingCollections[0]?.id ?? ""
                    }

                    fields.push({
                        id: key,
                        name: capitalizeFirstLetter(key),
                        type: "multiCollectionReference",
                        collectionId: collectionId,
                        collectionsOptions: matchingCollections,
                    })
                } else {
                    console.warn(`Unsupported reference to more than one collection: ${key}`)
                }

                break
            case "text":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "string",
                })
                break
            case "textarea":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "string",
                })
                break
            case "boolean":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "boolean",
                })
                break
            case "number":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "number",
                })
                break
            case "asset":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "image",
                })
                break
            case "option":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "string",
                })
                break
            case "options":
                if (is_reference_type) {
                    console.warn(`Unsupported field type: references`)
                } else {
                    fields.push({
                        id: key,
                        name: capitalizeFirstLetter(key),
                        type: "string",
                    })
                }

                break
            case "multilink":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "link",
                })
                break
            case "references":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "string",
                })
                break
            case "markdown":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "string",
                })
                break
            case "datetime":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "date",
                })
                break
            case "richtext":
                fields.push({
                    id: key,
                    name: capitalizeFirstLetter(key),
                    type: "formattedText",
                })
                break
            default:
                console.warn(`Unsupported field type: ${type}`)
        }
    }

    // map occurences to items
    let items: FieldDataInput[] = []

    for (const blok of bloks) {
        const itemData: FieldDataInput = {}

        for (const [fieldName, value] of Object.entries(blok)) {
            const field = fields.find(field => field.id === fieldName)

            if (!field) {
                console.warn(`Field with id ${fieldName} not found`)
            } else {
                switch (field.type) {
                    case "multiCollectionReference":
                        if (Array.isArray(value)) {
                            itemData[field.id] = {
                                value: value.map(item => (typeof item === "string" ? item : item._uid)),
                                type: field.type,
                            }
                        }
                        break
                    case "string":
                        itemData[field.id] = {
                            value: Array.isArray(value) ? value.join(", ") : String(value),
                            type: field.type,
                        }
                        break
                    case "boolean":
                        itemData[field.id] = {
                            value: Boolean(value),
                            type: field.type,
                        }
                        break
                    case "number":
                        itemData[field.id] = {
                            value: Number(value),
                            type: field.type,
                        }
                        break
                    case "date":
                        itemData[field.id] = {
                            value: typeof value === "string" ? new Date(value).toISOString() : new Date().toISOString(),
                            type: field.type,
                        }
                        break
                    case "image":
                        itemData[field.id] = {
                            value:
                                typeof value === "object" &&
                                value !== null &&
                                "filename" in value &&
                                ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif"].includes(
                                    (value as { filename: string }).filename?.split(".").pop()?.toLowerCase() ?? ""
                                )
                                    ? String(value.filename)
                                    : null,
                            type: field.type,
                        }
                        break
                    case "link":
                        itemData[field.id] = {
                            value:
                                typeof value === "object" && value !== null && "url" in value ? String(value.url) : "",
                            type: field.type,
                        }
                        break
                    case "formattedText":
                        itemData[field.id] = {
                            value:
                                value && typeof value === "object" && "type" in value && "content" in value
                                    ? String(render(value as StoryblokRichTextNode))
                                    : "",
                            type: field.type,
                        }
                        break

                    default:
                        console.warn(`Unsupported field type: ${field.type}`)
                }
            }
        }

        items.push(itemData)
    }

    console.log("items", items)
    console.log("fields", fields)

    return {
        id: component.name,
        fields,
        items,
        idField,
        slugField: null,
        region,
        spaceId,
    }
}

export function mergeFieldsWithExistingFields(
    sourceFields: readonly ManagedCollectionFieldInput[],
    existingFields: readonly ManagedCollectionFieldInput[]
): ManagedCollectionFieldInput[] {
    return sourceFields.map(sourceField => {
        const existingField = existingFields.find(existingField => existingField.id === sourceField.id)
        if (existingField) {
            return { ...sourceField, name: existingField.name }
        }
        return sourceField
    })
}

export async function syncCollection(
    collection: ManagedCollection,
    dataSource: DataSource,
    fields: readonly ManagedCollectionFieldInput[],
    slugField: ManagedCollectionFieldInput
) {
    const sanitizedFields = fields.map(field => ({
        ...field,
        name: field.name.trim() || field.id,
    }))

    const items: ManagedCollectionItemInput[] = []
    const unsyncedItems = new Set(await collection.getItemIds())

    const existingSlugs = new Map<string, number>()

    for (let i = 0; i < dataSource.items.length; i++) {
        const item = dataSource.items[i]
        if (!item) throw new Error("Logic error")

        const slugValue = item[slugField.id]
        if (!slugValue || typeof slugValue.value !== "string") {
            console.warn(`Skipping item at index ${i} because it doesn't have a valid slug`)
            continue
        }

        const idValue = item[dataSource.idField?.id ?? ""]
        if (!idValue || typeof idValue.value !== "string") {
            console.warn(`Skipping item at index ${i} because it doesn't have a valid id`)
            continue
        }

        unsyncedItems.delete(slugValue.value)

        const fieldData: FieldDataInput = {}
        for (const [fieldName, value] of Object.entries(item)) {
            const field = sanitizedFields.find(field => field.id === fieldName)

            // Field is in the data but skipped based on selected fields.
            if (!field) continue

            // For details on expected field value, see:
            // https://www.framer.com/developers/plugins/cms#collections
            fieldData[field.id] = value
        }

        items.push({
            id: idValue.value,
            slug: createUniqueSlug(slugValue.value, existingSlugs),
            draft: false,
            fieldData,
        })
    }

    await collection.setFields(sanitizedFields)
    await collection.removeItems(Array.from(unsyncedItems))
    await collection.addItems(items)

    await collection.setPluginData(PLUGIN_KEYS.DATA_SOURCE_ID, dataSource.id)
    await collection.setPluginData(PLUGIN_KEYS.SLUG_FIELD_ID, slugField.id)
    await collection.setPluginData(PLUGIN_KEYS.REGION, dataSource.region)
    await collection.setPluginData(PLUGIN_KEYS.SPACE_ID, dataSource.spaceId.toString())
}

export async function syncExistingCollection(
    collection: ManagedCollection,
    {
        previousDataSourceId,
        previousSlugFieldId,
        previousRegion,
        previousSpaceId,
        previousPersonalAccessToken,
    }: {
        previousDataSourceId: string | null
        previousSlugFieldId: string | null
        previousRegion: StoryblokRegion | null
        previousSpaceId: string | null
        previousPersonalAccessToken: string | null
    }
): Promise<{ didSync: boolean }> {
    if (
        !previousDataSourceId ||
        !previousSlugFieldId ||
        !previousRegion ||
        !previousSpaceId ||
        !previousPersonalAccessToken
    ) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    try {
        const dataSource = await getDataSource({
            personalAccessToken: previousPersonalAccessToken,
            region: previousRegion,
            spaceId: previousSpaceId,
            collectionId: previousDataSourceId,
        })
        const existingFields = await collection.getFields()

        const slugField = dataSource.fields.find(field => field.id === previousSlugFieldId)
        if (!slugField) {
            framer.notify(`No field matches the slug field id "${previousSlugFieldId}". Sync will not be performed.`, {
                variant: "error",
            })
            return { didSync: false }
        }

        const fields: ManagedCollectionFieldInput[] = []
        for (const field of existingFields) {
            if (field.type === "multiCollectionReference" || field.type === "collectionReference") {
                fields.push({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    collectionId: field.collectionId,
                })
            } else if (field.type === "enum") {
                fields.push({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    cases: field.cases.map(c => ({
                        id: c.id,
                        name: c.name,
                    })),
                })
            } else if (field.type === "file") {
                fields.push({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    allowedFileTypes: field.allowedFileTypes,
                })
            } else {
                fields.push({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                })
            }
        }

        await syncCollection(collection, dataSource, fields, slugField)
        return { didSync: true }
    } catch (error) {
        console.error(error)
        framer.notify(`Failed to sync collection "${previousDataSourceId}". Check browser console for more details.`, {
            variant: "error",
        })
        return { didSync: false }
    }
}
