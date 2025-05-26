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

// Find an item in an array using an async callback: https://stackoverflow.com/questions/55601062/using-an-async-function-in-array-find
export async function findAsync<T>(arr: T[], asyncCallback: (item: T) => Promise<boolean>) {
    const promises = arr.map(asyncCallback)
    const results = await Promise.all(promises)
    const index = results.findIndex(result => result)
    return arr[index]
}

export function isEmptyArray(arr: unknown[] | readonly unknown[]) {
    if (!arr) return true
    if (arr.length === 0) return true
    return false
}