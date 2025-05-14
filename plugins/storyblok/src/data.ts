import {
    type ManagedCollectionFieldInput,
    type FieldDataInput,
    framer,
    type ManagedCollection,
    type ManagedCollectionItemInput,
} from "framer-plugin"

import StoryblokClient from "storyblok-js-client"

export const PLUGIN_KEYS = {
    DATA_SOURCE_ID: "dataSourceId",
    SLUG_FIELD_ID: "slugFieldId",
} as const

export const STORYBLOK_REGIONS = {
    US: "us",
    EU: "eu",
    CA: "ca",
    AP: "ap",
    CN: "cn",
} as const

export type StoryblokRegion = typeof STORYBLOK_REGIONS[keyof typeof STORYBLOK_REGIONS]

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

export interface StoryblokStory {
    id: number
    name: string
}

export interface StoryblokComponent {
    id: number
    name: string
    description: string
    image: string   
}

export interface StoryblokSpace {
    id: number
    name: string
    domain: string
    version: number
}

export async function getComponents(spaceId: number, region: StoryblokRegion) {
    const token = localStorage.getItem("storyblok_token")

    if (!token) {
        throw new Error("No token found")
    }

    const Storyblok = new StoryblokClient({
        oauthToken: token,
        region: region,
    });

    const response = await Storyblok.get(`spaces/${spaceId}/components/`, {})


    return response.data.components as StoryblokComponent[]
     
}

export async function getStory( spaceId: number, region: StoryblokRegion){
    const token = localStorage.getItem("storyblok_token")

    if (!token) {
        throw new Error("No token found")
    }

    const Storyblok = new StoryblokClient({
        oauthToken: token,
        region: region,
    });

    const response = await Storyblok.get(`spaces/${spaceId}/stories/`, {})

    return response.data.stories as StoryblokStory[]
}

export async function getSpaces(region: StoryblokRegion) {
    const token = localStorage.getItem("storyblok_token")

    if (!token) {
        throw new Error("No token found")
    }

    const Storyblok = new StoryblokClient({
        oauthToken: token,
        region: region,
    });

    const response = await Storyblok.get('spaces/', {})

    return response.data.spaces as StoryblokSpace[]
}


export async function getDataSource(dataSourceId: string): Promise<DataSource> {
    const region = localStorage.getItem("storyblok_region") as StoryblokRegion || STORYBLOK_REGIONS.US
    const spaces = await getSpaces(region)

    // Map your source fields to supported field types in Framer
    const fields: ManagedCollectionFieldInput[] = [
        { id: "id", name: "ID", type: "string" },
        { id: "name", name: "Name", type: "string" },
    ]

    const dataSourceOption = dataSourceOptions.find(option => option.id === dataSourceId)

    const items = spaces.map((space: StoryblokSpace) => {
        const id = space.id.toString()
        return {
            [dataSourceOption?.idFieldId ?? "id"]: { type: "string" as const, value: id },
            name: { type: "string" as const, value: space.name },
        }
    })

    const idField = fields.find(field => field.id === dataSourceOption?.idFieldId) ?? null
    const slugField = fields.find(field => field.id === dataSourceOption?.slugFieldId) ?? null

    return {
        id: dataSourceId,
        idField,
        slugField,
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
    previousSlugFieldId: string | null
): Promise<{ didSync: boolean }> {
    if (!previousDataSourceId) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    try {
        const dataSource = await getDataSource(previousDataSourceId)
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
