import type { StoryblokField } from "./dataSources"

export function decodeHtml(html: string): string {
    const textarea = document.createElement("textarea")
    textarea.innerHTML = html
    return textarea.value
}

export function isCollectionReference(
    field: StoryblokField
): field is Extract<StoryblokField, { type: "collectionReference" | "multiCollectionReference" }> {
    return field.type === "collectionReference" || field.type === "multiCollectionReference"
}

export function isMissingReferenceField(field: StoryblokField): boolean {
    if (!isCollectionReference(field)) {
        return false
    }

    return !field.collectionId || field.supportedCollections?.length === 0
}

export function assertNever(x: never, error?: unknown): never {
    throw error || new Error((x as unknown) ? `Unexpected value: ${x}` : "Application entered invalid state")
}

export function capitalizeFirstLetter(val: string) {
    return val.charAt(0).toUpperCase() + val.slice(1)
}

export async function filterAsync<T>(arr: T[], asyncCallback: (item: T) => Promise<boolean>) {
    const promises = arr.map(asyncCallback)
    const results = await Promise.all(promises)
    return arr.filter((_, index) => results[index])
}

function slugify(text: string) {
    return text
        .trim()
        .slice(0, 60)
        .replace(/^\s+|\s+$/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
}

export function createUniqueSlug(text: string, existingSlugs: Map<string, number>) {
    const slug = slugify(text)
    let count = 0
    if (existingSlugs.has(slug)) {
        count = existingSlugs.get(slug) ?? 1
        count++
        existingSlugs.set(slug, count)
    } else {
        existingSlugs.set(slug, 0)
    }
    if (count === 0) {
        return slug
    }
    return `${slug}-${count}`
}
