import type { ManagedCollectionFieldInput } from "framer-plugin"
import { ManagedCollection } from "framer-plugin"

export type StoryblokField = ManagedCollectionFieldInput &
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
              supportedCollections?: { id: string; name: string }[]
          }
    ) & {
        collectionsOptions?: ManagedCollection[]
    }

/**
 * Remove StoryBlok-specific keys from the fields. This is used to ensure that the fields are compatible with Framer API.
 *
 * @param fields - The fields to remove the keys from.
 * @returns The fields with the keys removed.
 */
export function removeStoryblokKeys(fields: StoryblokField[]): ManagedCollectionFieldInput[] {
    return fields.map(originalField => {
        const { getValue, ...field } = originalField
        return field
    })
}
