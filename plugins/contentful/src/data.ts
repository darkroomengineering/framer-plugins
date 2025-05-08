import {
    type ManagedCollectionFieldInput,
    type FieldDataInput,
    type ManagedCollection,
    type ManagedCollectionItemInput,
    type FieldDataEntryInput,
    framer,
} from "framer-plugin"
import type { ContentType } from "contentful"
import {
    type Credential,
    type ExtendedManagedCollectionField,
    getFramerFieldFromContentfulField,
    mapContentfulValueToFramerValue,
} from "./lib/utils"
import { getEntriesForContentType } from "./lib/space"
import { initContentful, getContentTypes } from "./lib/space"

export const PLUGIN_KEYS = {
    DATA_SOURCE_ID: "dataSourceId",
    SLUG_FIELD_ID: "slugFieldId",
} as const

export interface DataSource {
    id: string
    fields: readonly ManagedCollectionFieldInput[]
    items: FieldDataInput[]
    idField: ManagedCollectionFieldInput | null // to be used as id field
    slugField: ManagedCollectionFieldInput | null // to be used as slug field
    name: string
}

const slugs = new Map<string, number>()
function slugify(text: string) {
    let newText = text
    newText = newText.trim()
    newText = newText.slice(0, 60) // limit to 60 characters

    if (slugs.has(newText)) {
        const count = slugs.get(newText) ?? 0
        slugs.set(newText, count + 1)
        newText = `${newText} ${count + 1}`
    } else {
        slugs.set(newText, 0)
    }

    const slug = newText
        .replace(/^\s+|\s+$/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/-+/g, "-")
    return slug
}

export async function getDataSource(dataSource: ContentType): Promise<DataSource> {
    // First get entries from Contentful
    const entries = await getEntriesForContentType(dataSource?.sys?.id)

    // Force id field as there is none in Contentful fields
    const fields: ManagedCollectionFieldInput[] = [
        {id: 'id', name: 'id', type: 'string'} as ManagedCollectionFieldInput,
        ...(await Promise.all(
            dataSource.fields.map(field => getFramerFieldFromContentfulField(field))
        ))
    ]

    const items = entries.map(entry => {
        const item: Record<string, FieldDataEntryInput> = {};

        fields.forEach(field => {
            if (field.id === 'id') {
                item[field.id] = {
                    value: entry.sys.id, // use entry id as id value
                    type: 'string',
                }
            } else {
                const value = entry.fields?.[field.id]

                if (value !== undefined) {
                    const mappedValue = mapContentfulValueToFramerValue(
                        value as unknown as ContentType,
                        field as ExtendedManagedCollectionField
                    )

                    item[field.id] = {
                        value: mappedValue,
                        type: field.type,
                    }
                }
            }
        })

        return item
    })

    const idField = fields.find(field => field.id === "id") ?? null
    const slugField = fields.find(field => field.type === "string") ?? null

    return {
        id: dataSource.sys.id,
        idField,
        slugField,
        fields,
        items,
        name: dataSource.name,
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
            slug: slugify(slugValue.value),
            fieldData,
            draft: false,
        })
    }

    await collection.setFields(sanitizedFields)
    await collection.removeItems(Array.from(unsyncedItems))
    await collection.addItems(items)
    await collection.setPluginData(PLUGIN_KEYS.DATA_SOURCE_ID, dataSource.id)
    await collection.setPluginData(PLUGIN_KEYS.SLUG_FIELD_ID, slugField.id)
}

export async function syncExistingCollection(
    collection: ManagedCollection,
    previousDataSourceId: string | null,
    previousSlugFieldId: string | null,
    storedCredentials: Credential
): Promise<{ didSync: boolean }> {
    if (!previousDataSourceId) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    try {
        const { spaceId, accessToken } = storedCredentials

        initContentful({
            spaceId,
            accessToken,
        })

        const contentTypes = await getContentTypes()
        const contentType = contentTypes.find(contentType => contentType.sys.id === previousDataSourceId)
        if (!contentType) throw new Error("Content type not found")

        const dataSource = await getDataSource(contentType)
        const existingFields = await collection.getFields() as ManagedCollectionFieldInput[]
        const slugField = dataSource.fields.find(field => field.id === previousSlugFieldId)

        if (!slugField) {
            framer.notify(`No field matches the slug field id "${previousSlugFieldId}". Sync will not be performed.`, {
                variant: "error",
            })
            return { didSync: false }
        }

        await syncCollection(collection, dataSource, existingFields, slugField)
        return { didSync: true }
    } catch (error) {
        console.error(error)
        framer.notify(`Failed to sync collection "${previousDataSourceId}". Check browser console for more details.`, {
            variant: "error",
        })
        return { didSync: false }
    }
}
