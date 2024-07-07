import { App, LinkCache, MarkdownView, Notice, TFile } from 'obsidian';
import { isUnsupportedEmbedType, formatDateLocale, formatEmbedReplacements, sortNoteRelevance } from './helpers';
import { NoteRelevance } from './types';

class ContextBuilder {
  app: App;

	constructor(app: App) {
    this.app = app;
	}

  async findFileByName(fileName: string) {
    const files = this.app.vault.getFiles();
    for (const file of files) {
      if (file.name === `${fileName}.md`) {
        return file;
      }
    }

    console.log('file not found', files, fileName);
    return null;
  }

  async getBlockContent(embeddedBlockReference: string) {
    if (isUnsupportedEmbedType(embeddedBlockReference)) {
      console.log('TODO: embeddedBlockReference unsupported type', embeddedBlockReference);
      return embeddedBlockReference;
    }

    // Remove the `![[` and `]]` parts
    const strippedLink = embeddedBlockReference.slice(3, -2);
    const [noteName, blockId] = strippedLink.split('#^');

    const { vault } = this.app;
    const file = await this.findFileByName(noteName);

    if (!file || !(file instanceof TFile)) {
      console.log('embeddedBlockReference file not found', noteName);
      return embeddedBlockReference;
    }

    const noteContent = await vault.read(file);

    if (!noteContent) {
      console.log('embeddedBlockReference content not found', noteName);
      return embeddedBlockReference;
    }

    const lines = noteContent.split('\n');
    for (const line of lines) {
      if (line.includes(`^${blockId}`)) return line;
    }

    return embeddedBlockReference;
  }

   async replaceEmbeddedBlocksWithContent(note: [string, NoteRelevance]) {
    const { content } = note[1];
    const embeddedBlockReferences = content.match(/!\[\[(.*?)\]\]/g);
  
    if (!embeddedBlockReferences) return note;

    for (const reference of embeddedBlockReferences) {
      note[1].content = formatEmbedReplacements(note[1].content, reference, await this.getBlockContent(reference));
    }

    return  note
  }

  /**
   * Up to the specified depth, builds a map of linked notes to their content, number of times linked, and distance from the main note
   */
  async buildLinkMap(linkTitle: string, linkMap: { [key: string]: NoteRelevance }, curDepth: number, maxDepth: number) {
    const { metadataCache, vault } = this.app;
    if (curDepth > maxDepth) return;

    if (linkMap[linkTitle]) {
      linkMap[linkTitle].count += 1;
      linkMap[linkTitle].minDistance = Math.min(linkMap[linkTitle].minDistance, curDepth);
    } else {
      const file = vault.getAbstractFileByPath(linkTitle);

      if (!(file instanceof TFile)) {
        console.error("File not found or not a markdown/text file", linkTitle);
        return;
      }

      const content = await vault.read(file);
      linkMap[linkTitle] = { content, count: 1, minDistance: curDepth, dateUpdated: file.stat.mtime };
      const backlinks = metadataCache.getBacklinksForFile(file).data as Record<string, LinkCache[]>;

      // Recursively build build the link map using the backlinks of the current note
      for (const backlink in backlinks) {
        await this.buildLinkMap(backlink, linkMap, curDepth + 1, maxDepth);
      }
      // Recursively build the link map using the links in the current note
      for (const forwardLink of metadataCache.getFileCache(file)?.links || []) {
        const forwardLinkMatch = metadataCache.getFirstLinkpathDest(forwardLink.link, "");
        if (forwardLinkMatch) {
          await this.buildLinkMap(forwardLinkMatch?.path, linkMap, curDepth + 1, maxDepth);
        }
      }
    }
  }

  async createContextNote(sortedNotes: [string, NoteRelevance][]) {
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
      const expandedNote = await this.replaceEmbeddedBlocksWithContent(note);
      noteContent += "--------------------------- LINKED NOTE: ---------------------------\n\n"
        + "PATH: " + expandedNote[0] + "\n"
        + "METADATA: distance from main note: " + expandedNote[1].minDistance + ", number of times linked: " 
        + expandedNote[1].count + ", date updated: " + formatDateLocale(expandedNote[1].dateUpdated) + "\n"
        + "NOTE CONTENT:\n" + expandedNote[1].content + "\n\n"
    }
    noteContent += "END CONTEXT FOR CONVERSATION\n"
    noteContent += "Please use the above context for the following conversation. Please be reminded that the context is sorted from most "
      + "relevant to least relevant."
    return noteContent
  }

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
	async build() {
    const { workspace } = this.app;
    const view = workspace.getActiveViewOfType(MarkdownView)
    const linkMap: { [key: string]: NoteRelevance } = {};
    const maxDepth = 2; // <- TODO: make this configurable

    
    if (view?.file) {
      await this.buildLinkMap(view.file.path, linkMap, 0, maxDepth);
    } 

    console.log(linkMap)
    // if (view) {
    //   this.contentEl.setText(data);
    // }
    console.log(await this.createContextNote(sortNoteRelevance(linkMap)));
    new Notice('Yoinked!');
	}
}

export function buildContext() {
  new ContextBuilder(this.app).build();
  return
}
