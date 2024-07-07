import { NoteRelevance } from './types';

export function isUnsupportedEmbedType(embeddedBlockReference:string) {
  return embeddedBlockReference.includes('.png') || !embeddedBlockReference.includes('#^');
}

export function formatDateLocale(unixTimestamp: number): string {
  const date = new Date(unixTimestamp); // Convert seconds to milliseconds
  const today = new Date();

  // Calculate the difference in days
  const differenceInTime = today.getTime() - date.getTime();
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

  // Return the difference as a string
  return `${differenceInDays} days ago`;
}

/**
 * Sort the NoteRelevance objects first by minDistance, then count, then dateUpdated
 */
export function sortNoteRelevance(linkMap: { [key: string]: NoteRelevance }) {
  const entries = Object.entries(linkMap);
  if (entries.length === 0) {
    return [];
  }

  return entries.sort((a, b) => {
    if (a[1].minDistance === b[1].minDistance) {
      if (a[1].count === b[1].count) {
        return a[1].dateUpdated - b[1].dateUpdated;
      }
      return b[1].count - a[1].count;
    }
    return a[1].minDistance - b[1].minDistance;
  });
}

export function formatEmbedReplacements(content: string, reference: string, blockContent: string) {
  if (isUnsupportedEmbedType(reference)) return content;

  const referenceName = reference.slice(3, -2);
  const matchToReplace = content.includes(`\n${reference}`) ? `\n${reference}` : reference;
  return content.replace(matchToReplace, `\n> [!quote from ${referenceName}]\n> ${blockContent}`);
}
