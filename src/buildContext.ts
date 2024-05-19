import { App, Editor, LinkCache, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { app, contentEl } = this;
    const { metadataCache, workspace } = app;
    const view = workspace.getActiveViewOfType(MarkdownView)
    const data = view?.getViewData();
    
    if (view?.file) {
      const backlinks = metadataCache.getBacklinksForFile(view.file).data as Record<string, LinkCache[]>;
      contentEl.setText(JSON.stringify(backlinks))
      for (const link in Object.keys(backlinks)) {
        console.log(link)
        console.log(typeof link)
        console.log(backlinks.data[link]);
        console.log(typeof backlinks.data[link]);
        // for (const linkCache of backlinks.data[link]) {
        //   console.log(linkCache)
        // }
      }
    } 

    // if (view) {
    //   contentEl.setText(data);
    // }
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
