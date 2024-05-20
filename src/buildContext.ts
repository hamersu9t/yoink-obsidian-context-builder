import { App, LinkCache, MarkdownView, Modal, TFile } from 'obsidian';

interface NoteRelevance {
  content: string;
  count: number;
  dateUpdated: number;
  minDistance: number;
}

function replaceEmbedLinksWithContent() {
  // TODO
}

function formatDateLocale(unixTimestamp: number): string {
  const date = new Date(unixTimestamp); // Convert seconds to milliseconds
  const today = new Date();

  // Calculate the difference in days
  const differenceInTime = today.getTime() - date.getTime();
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

  // Return the difference as a string
  return `${differenceInDays} days ago`;
}

function createContextNote(sortedNotes: [string, NoteRelevance][]) {
  const [primaryNote, ...restNotes] = sortedNotes;
  
  let noteContent = "This context is pulled from my Obsidian notes. It represents my network of linked notes based on the Obsidian graph. " 
    + "The context is sorted by most relevant to least relevant based on the proximity to the main note, the number of times it was linked, "
    + "and the date it was last updated. Links within a note link to other notes using the [[note title]] syntax. Here is the primary note, "
    + "please treat it as the most relevant for the conversation that will follow: \n\n"
    + "START CONTEXT FOR CONVERSATION\n"
    + "PRIMARY NOTE HAS PATH: " + primaryNote[0] + "\n"
    + "METADATA: this is the main note, number of times linked: " + primaryNote[1].count + ", date updated: " 
    + formatDateLocale(primaryNote[1].dateUpdated) + "\n\n"
    + "PRIMARY NOTE CONTENT:\n" + primaryNote[1].content + "\n\n";
  for (const note of restNotes) {
    noteContent += "--------------------------- LINKED NOTE: ---------------------------\n\n"
      + "PATH: " + note[0] + "\n"
      + "METADATA: distance from main note: " + note[1].minDistance + ", number of times linked: " 
      + note[1].count + ", date updated: " + formatDateLocale(note[1].dateUpdated) + "\n"
      + "NOTE CONTENT:\n" + note[1].content + "\n\n"
  }
  noteContent += "END CONTEXT FOR CONVERSATION\n"
  noteContent += "Please use the above context for the following conversation. Please be reminded that the context is sorted from most "
    + "relevant to least relevant."
  return noteContent
}

/**
 * Sort the NoteRelevance objects first by minDistance, then count, then dateUpdated
 */
function sortNoteRelevance(linkMap: { [key: string]: NoteRelevance }) {
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

  async countLinks(linkTitle: string, linkMap: { [key: string]: NoteRelevance }, depth: number, maxDepth: number) {
    const { metadataCache, vault } = this.app;
    if (depth > maxDepth) return;

    if (linkMap[linkTitle]) {
      linkMap[linkTitle].count += 1;
      linkMap[linkTitle].minDistance = Math.min(linkMap[linkTitle].minDistance, depth);
    } else {
      const file = vault.getAbstractFileByPath(linkTitle);
      if (file instanceof TFile) {
        const content = await vault.read(file);
        linkMap[linkTitle] = { content, count: 1, minDistance: depth, dateUpdated: file.stat.mtime };
        const backlinks = metadataCache.getBacklinksForFile(file).data as Record<string, LinkCache[]>;
        for (const link in backlinks) {
          await this.countLinks(link, linkMap, depth + 1, maxDepth);
        }
        for (const link of metadataCache.getFileCache(file)?.links || []) {
          const linkMatch = metadataCache.getFirstLinkpathDest(link.link, "");
          if (linkMatch) {
            await this.countLinks(linkMatch?.path, linkMap, depth + 1, maxDepth);
          }
        }
      } else {
          console.error("File not found or not a markdown/text file", linkTitle);
      }
    }
  }

	async onOpen() {
    const { workspace } = this.app;
    const view = workspace.getActiveViewOfType(MarkdownView)
    const linkMap: { [key: string]: NoteRelevance } = {};
    const maxDepth = 2;

    
    if (view?.file) {
      await this.countLinks(view.file.path, linkMap, 0, maxDepth);
    } 

    console.log(linkMap)
    // if (view) {
    //   this.contentEl.setText(data);
    // }
    console.log(createContextNote(sortNoteRelevance(linkMap)));
	}


	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export function buildContext() {
  new SampleModal(this.app).open();

  /**
   * 1. Get current note
   * 2. Get all linked notes in
   * 3. Get all linked notes out
   * 4. Build a queue of linked notes and a dictionary of linked notes -> note content
   * 5. Build a dictionary of note title -> number of links
   * 6. Go through the queue, recursively adding to the content dictionary and adding to the queue with all linked notes,
   *  checking the dictionary to see if we've already added the note
   * 7. Build a giant note out of the content dictionary using the number of links to determine the order
   */
  return
}
