import {
    type ManagedCollectionFieldInput,
    type FieldDataInput,
    framer,
    type ManagedCollection,
    type ManagedCollectionItemInput,
} from "framer-plugin"
import { findComponentInContent } from "./storyblok"
import type { StoryblokStory } from "./storyblok"

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

// Find an item in an array using an async callback: https://stackoverflow.com/questions/55601062/using-an-async-function-in-array-find
// async function findAsync<T>(arr: T[], asyncCallback: (item: T) => Promise<boolean>) {
//     const promises = arr.map(asyncCallback)
//     const results = await Promise.all(promises)
//     const index = results.findIndex(result => result)
//     return arr[index]
// }


export async function getDataSource(dataSourceId: string, stories: StoryblokStory[]): Promise<DataSource> {
    console.log('Processing stories:', stories)
    console.log('Processing dataSourceId:', dataSourceId)

    // Initialize with just the id field
    const fields: ManagedCollectionFieldInput[] = [
        {id: 'id', name: 'id', type: 'string'} as ManagedCollectionFieldInput,
    ]

    const items = stories.map(story => {
        const item: FieldDataInput = {
            id: {
                value: story.id.toString(),
                type: 'string'
            }
        }

        const dataSourceComponent = findComponentInContent(story.content, dataSourceId)
        if (dataSourceComponent) {
            // Add all fields from the dataSourceComponent to the item
            for (const [key, value] of Object.entries(dataSourceComponent)) {
                // Skip component, _uid fields from the component
                if (key !== 'component' && key !== '_uid') {
                    
                    if (!fields.some(field => field.id === key)) {
                        const type = typeof value === 'string' ? 'string' : 
                                   typeof value === 'number' ? 'number' :
                                   typeof value === 'boolean' ? 'boolean' : 'string'
                        
                        fields.push({
                            id: key,
                            name: key,
                            type
                        } as ManagedCollectionFieldInput)
                    }

                    if (typeof value === 'string') {
                        item[key] = {
                            value: value,
                            type: 'string'
                        }
                    } else if (typeof value === 'number') {
                        item[key] = {
                            value: value,
                            type: 'number'
                        }
                    } else if (typeof value === 'boolean') {
                        item[key] = {
                            value: value,
                            type: 'boolean'
                        }
                    } else {
                        // For objects, null, or undefined, convert to string
                        item[key] = {
                            value: value === null || value === undefined ? '' : JSON.stringify(value),
                            type: 'string'
                        }
                    }
                }
            }
        }

        return item
    })

    const idField = fields.find(field => field.id === "id") ?? null

    return {
        id: dataSourceId,
        idField,
        slugField: null,
        fields,
        items,
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
            draft: false,
            fieldData,
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
    stories: StoryblokStory[]
): Promise<{ didSync: boolean }> {
    if (!previousDataSourceId) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    try {
        const dataSource = await getDataSource(previousDataSourceId, stories)
        const existingFields = await collection.getFields()

        const slugField = dataSource.fields.find(field => field.id === previousSlugFieldId)
        if (!slugField) {
            framer.notify(`No field matches the slug field id "${previousSlugFieldId}". Sync will not be performed.`, {
                variant: "error",
            })
            return { didSync: false }
        }

        await syncCollection(collection, dataSource, existingFields as ManagedCollectionFieldInput[], slugField)
        return { didSync: true }
    } catch (error) {
        console.error(error)
        framer.notify(`Failed to sync collection "${previousDataSourceId}". Check browser console for more details.`, {
            variant: "error",
        })
        return { didSync: false }
    }
}

