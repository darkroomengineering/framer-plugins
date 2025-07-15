import { richTextResolver, type StoryblokRichTextNode } from "@storyblok/richtext"
import type { ManagedCollectionFieldInput } from "framer-plugin"
import { type StoryBlokItem, validateBanner, validateFaqEntry } from "./api-types"
import { findBloksInStories, type StoryblokStory } from "./storyblok"

const { render } = richTextResolver()
export interface StoryBlokDataSource {
    id: string
    name: string
    /**
     * The fields of the data source.
     *
     * The first field is the ID field.
     * The rest of the fields are the fields of the data source.
     */
    fields: readonly StoryBlokField[]
    fetch: (accessToken: string, spaceId: string) => Promise<StoryBlokItem[]>
}
export interface ApiKey {
    id: number
    name: string
    token: string
    access: string
}

async function fetchStoryBlokData(url: string, itemsKey: string): Promise<unknown[]> {
    try {
        const response = await fetch(url)
        const data = await response.json()
        const allItems: StoryblokStory[] = []
        allItems.push(...data.stories)
        const stories = findBloksInStories(allItems, itemsKey)
        const storiesWithId = stories.map(item => ({
            ...item,
            id: item._uid,
        }))
        const items = []
        if (data?.meta?.total_count && data?.meta?.per_page) {
            const pages = Math.ceil(data.meta.total_count / data.meta.per_page)
            for (let i = 0; i < pages; i++) {
                const response = await fetch(`${url}&page=${i + 1}`)
                const data = await response.json()
                const allItems: StoryblokStory[] = []
                allItems.push(...data.stories)
                const stories = findBloksInStories(allItems, itemsKey)
                const storiesWithId = stories.map(item => ({
                    ...item,
                    id: item._uid,
                }))
                items.push(...(storiesWithId as unknown[]))
            }
        } else {
            items.push(...(storiesWithId as unknown[]))
        }
        return items
    } catch (error) {
        console.error("Error fetching StoryBlok data:", error)
        throw error
    }
}

async function getApiKeysForSpace(accessToken: string, spaceId: string): Promise<unknown> {
    try {
        const response = await fetch(`https://api.storyblok.com/v1/spaces/${spaceId}/api_keys`, {
            headers: new Headers({
                Authorization: accessToken,
            }),
        })
        const data = await response.json()
        const apiKeys = data.api_keys as ApiKey[]
        const publicKey = apiKeys.find(key => key.access === "public")
        return publicKey?.token
    } catch (e) {
        console.error("Error fetching StoryBlok API Keys:", error)
        throw error
    }
}

export type StoryBlokField = ManagedCollectionFieldInput &
    (
        | {
              type: Exclude<ManagedCollectionFieldInput["type"], "collectionReference" | "multiCollectionReference">
              /** Used to transform the value of the field. Sometimes the value is inside an object, so we need to extract it. */
              getValue?: <T>(value: T) => unknown
              canBeUsedAsSlug?: boolean
          }
        | {
              type: "collectionReference" | "multiCollectionReference"
              getValue?: never
              dataSourceId: string
              supportedCollections?: { id: string; name: string }[]
          }
    )
const HeadLineDataSource = createDataSource(
    {
        name: "Headline Segment",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "headline-segment")
            return items
        },
    },
    [
        { id: "_uid", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "text", name: "Head Line", type: "string", canBeUsedAsSlug: true },
        { id: "component", name: "Component", type: "string" },
        { id: "highlight", name: "Highlight", type: "string" },
    ]
)
const ArticleOverviewDataSource = createDataSource(
    {
        name: "Article Overview Page",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "article-overview-page")
            return items
        },
    },
    [
        { id: "_uid", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "headline", name: "Head Line", type: "string", canBeUsedAsSlug: true },
        { id: "component", name: "Component", type: "string" },
        { id: "meta_title", name: "Meta Title", type: "string" },
        { id: "meta_description", name: "Meta Description", type: "formattedText" },
    ]
)

const ArticlePageDataSource = createDataSource(
    {
        name: "Article Page",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "article-page")
            return items
        },
    },
    [
        { id: "_uid", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "headline", name: "Head Line", type: "string", canBeUsedAsSlug: true },
        { id: "component", name: "Component", type: "string" },
        {
            id: "image",
            name: "Image",
            type: "string",
            getValue: value => {
                if (typeof value === "object" && value !== null && "filename" in value) {
                    return value.filename
                }
                return null
            },
        },
        { id: "meta_title", name: "Meta Title", type: "string" },
        { id: "meta_description", name: "Meta Description", type: "formattedText" },
    ]
)
const BannerDataSource = createDataSource(
    {
        name: "Banner",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "banner")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "lead", name: "Lead", type: "string" },
        { id: "headline", name: "Head Line", type: "string" },
        { id: "component", name: "Component", type: "string" },
        { id: "text_alignment", name: "Text Alignment", type: "string" },
        { id: "background_color", name: "Background Color", type: "string" },
        {
            id: "background_image",
            name: "Background Image",
            type: "string",
            getValue: value => {
                if (typeof value === "object" && value !== null && "filename" in value) {
                    return value.filename
                }
                return null
            },
        },
        {
            id: "background_video",
            name: "Background Video",
            type: "string",
            getValue: value => {
                if (typeof value === "object" && value !== null && "filename" in value) {
                    return value.filename
                }
                return null
            },
        },
        { id: "background_image_cover", name: "Background Image Cover", type: "boolean" },
        { id: "background_image_width", name: "Background Image Width", type: "string" },
        { id: "background_image_alignment", name: "Background Image Alignment", type: "string" },
    ]
)
const BannerReferenceDataSource = createDataSource(
    {
        name: "Banner (Reference)",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "banner-reference")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        {
            id: "banners",
            name: "Banners",
            type: "multiCollectionReference",
            collectionId: "",
            dataSourceId: BannerDataSource.name,
        },
    ]
)
const ButtonDataSource = createDataSource(
    {
        name: "Button",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "button")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "size", name: "Size", type: "string" },
        { id: "component", name: "Component", type: "string" },
        { id: "label", name: "Label", type: "string" },
        { id: "style", name: "Style", type: "string" },
        { id: "text_color", name: "Text Color", type: "string" },
        { id: "background_color", name: "Background Color", type: "string" },
    ]
)
const CategoryDataSource = createDataSource(
    {
        name: "Category Page",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "category")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "headline", name: "Headline", type: "string" },
        { id: "component", name: "Component", type: "string" },
        { id: "meta_title", name: "Meta Title", type: "string" },
        { id: "meta_description", name: "Meta Description", type: "formattedText" },
        {
            id: "icon",
            name: "Icon",
            type: "string",
            getValue: value => {
                if (typeof value === "object" && value !== null && "filename" in value) {
                    return value.filename
                }
                return null
            },
        },
    ]
)
const ContactFormDataSource = createDataSource(
    {
        name: "Contact Form Section",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "contact-form-section")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "name", name: "Name", type: "string" },
        { id: "component", name: "Component", type: "string" },
        { id: "position", name: "Position", type: "string" },
        { id: "quote", name: "Quote", type: "string" },
        {
            id: "image",
            name: "Image",
            type: "string",
            getValue: value => {
                if (typeof value === "object" && value !== null && "filename" in value) {
                    return value.filename
                }
                return null
            },
        },
        {
            id: "headline",
            name: "Headline",
            type: "multiCollectionReference",
            collectionId: "",
            dataSourceId: HeadLineDataSource.name,
        },
    ]
)
const faqEntryDataSource = createDataSource(
    {
        name: "FAQ Entry",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "faq-entry")
            validateFaqEntry(items)
            return items
        },
    },
    [
        { id: "_uid", name: "Id", type: "string", canBeUsedAsSlug: true },
        { id: "question", name: "Question", type: "string", canBeUsedAsSlug: true },
        { id: "component", name: "Component", type: "string" },
        {
            id: "answer",
            name: "Answer",
            type: "formattedText",
            getValue: value => {
                if (typeof value === "object" && value !== null && "content" in value) {
                    return render(value as StoryblokRichTextNode)
                }
                return null
            },
        },
    ]
)
const FaqSectionDataSource = createDataSource(
    {
        name: "FAQ Section",
        fetch: async (accessToken: string, spaceId: string) => {
            const token = await getApiKeysForSpace(accessToken, spaceId)
            const url = ` https://api.storyblok.com/v1/cdn/spaces/${spaceId}/stories/?token=${token}`
            const items = await fetchStoryBlokData(url, "faq-section")
            return items
        },
    },
    [
        { id: "id", name: "ID", type: "string", canBeUsedAsSlug: true },
        { id: "name", name: "Name", type: "string", canBeUsedAsSlug: true },
    ]
)

export const dataSources = [
    HeadLineDataSource,
    ArticleOverviewDataSource,
    ArticlePageDataSource,
    BannerDataSource,
    BannerReferenceDataSource,
    ButtonDataSource,
    CategoryDataSource,
    ContactFormDataSource,
    faqEntryDataSource,
    FaqSectionDataSource,
] satisfies StoryBlokDataSource[]

function createDataSource(
    {
        name,
        fetch,
    }: {
        name: string
        fetch: (accessToken: string, spaceId: string) => Promise<StoryBlokItem[]>
    },
    [idField, slugField, ...fields]: [StoryBlokField, StoryBlokField, ...StoryBlokField[]]
): StoryBlokDataSource {
    return {
        id: name,
        name,
        fields: [idField, slugField, ...fields],
        fetch,
    }
}

/**
 * Remove StoryBlok-specific keys from the fields. This is used to ensure that the fields are compatible with Framer API.
 *
 * @param fields - The fields to remove the keys from.
 * @returns The fields with the keys removed.
 */
export function removeStoryBlokKeys(fields: StoryBlokField[]): ManagedCollectionFieldInput[] {
    return fields.map(originalField => {
        const field = { ...originalField }
        delete field.getValue
        return field
    })
}
