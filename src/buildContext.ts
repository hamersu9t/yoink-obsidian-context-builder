import { App, LinkCache, MarkdownView, Modal, TFile } from 'obsidian';
import { isUnsupportedEmbedType, formatDateLocale, formatEmbedReplacements, sortNoteRelevance } from './helpers';
import { NoteRelevance } from './types';

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
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
    console.log(await this.createContextNote(sortNoteRelevance(linkMap)));
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
