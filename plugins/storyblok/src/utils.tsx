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
