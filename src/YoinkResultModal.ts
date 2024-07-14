import { App, Modal } from 'obsidian';

export default class YoinkResultModal extends Modal {
  result: string;

  constructor(app: App, result: string) {
    super(app);
    this.result = result;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Result' });

    const resultContainer = contentEl.createEl('div', { cls: 'yoink-result-container' });
    
    // Split the result into paragraphs and create a <p> element for each
    const paragraphs = this.result.split('\n\n');
    paragraphs.forEach(paragraph => {
      const p = resultContainer.createEl('p');
      // Replace single newlines with <br> tags
      p.innerHTML = paragraph.replace(/\n/g, '<br>');
    });

    // Add some basic styling
    contentEl.createEl('style', {
      text: `
        .yoink-result-container {
          max-height: 400px;
          overflow-y: auto;
          padding: 10px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 5px;
        }
        .yoink-result-container p {
          margin-bottom: 10px;
        }
      `,
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}