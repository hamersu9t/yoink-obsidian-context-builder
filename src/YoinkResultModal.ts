import { App, Modal, Notice, setIcon } from 'obsidian';

export interface YoinkResult {
  content: string;
  depth: number;
  linkedNotesCount: number;
  wordCount: number;
}

export class YoinkResultModal extends Modal {
  result: YoinkResult;

  constructor(app: App, result: YoinkResult) {
    super(app);
    this.result = result;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const modalContent = `
      <div class="yoink-modal">
        <div class="yoink-modal-header">
          <div class="yoink-modal-title-container">
            <h2>Yoink Result</h2>
            <div class="yoink-modal-subtitle">
              Flattened ${this.result.linkedNotesCount} other notes (words: ${this.result.wordCount} | depth: ${this.result.depth})
            </div>
          </div>
          <button class="yoink-copy-button" aria-label="Copy to clipboard"></button>
        </div>
        <div class="yoink-result-container">
          ${this.formatContent(this.result.content)}
        </div>
      </div>
    `;

    contentEl.innerHTML = modalContent;

    // Add icon to the copy button
    const copyButton = contentEl.querySelector('.yoink-copy-button');
    if (copyButton) {
      setIcon(copyButton as HTMLElement, 'documents');
      copyButton.addEventListener('click', this.copyToClipboard.bind(this));
    }

    this.addStyles();
  }

  formatContent(content: string): string {
    // Split the content into paragraphs and wrap each in a <p> tag
    return content.split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.result.content);
    // Optional: Show a notice that the content was copied
    new Notice('Content copied to clipboard');
  }

  addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .yoink-modal {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .yoink-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 20px;
        margin-top: 10px;
      }
      .yoink-modal-header h2 {
        margin: 0;
      }
      .yoink-modal-title-container {
        display: flex;
        flex-direction: column;
      }
      .yoink-modal-subtitle {
        font-size: 0.8em;
        color: var(--text-muted);
      }
      .yoink-copy-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
      }
      .yoink-result-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
      }
      .yoink-result-container p {
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(styleElement);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}