import { App, Modal, Notice, setIcon } from 'obsidian';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface YoinkResult {
  content: string;
  depth: number;
  linkedNotesCount: number;
  primaryNoteName: string;
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
              Flattened ${this.result.linkedNotesCount} other note${this.result.linkedNotesCount !== 1 ? 's' : ''} (words: ${this.result.wordCount} | depth: ${this.result.depth})
              <br>(Adjust the template and link depth in settings)
            </div>
          </div>
          <div class="yoink-button-container">
            <button class="yoink-action-button yoink-copy-button" aria-label="Copy to clipboard" title="Copy to clipboard"></button>
            <button class="yoink-action-button yoink-pdf-button" aria-label="Download as PDF" title="Download as PDF"></button>
          </div>
        </div>
        <div class="yoink-result-container">
          ${this.formatContent(this.result.content)}
        </div>
      </div>
    `;

    contentEl.innerHTML = modalContent;

    // Add icons and event listeners to the buttons
    const copyButton = contentEl.querySelector('.yoink-copy-button');
    const pdfButton = contentEl.querySelector('.yoink-pdf-button');

    if (copyButton) {
      setIcon(copyButton as HTMLElement, 'copy');
      copyButton.addEventListener('click', this.copyToClipboard.bind(this));
    }

    if (pdfButton) {
      setIcon(pdfButton as HTMLElement, 'download');
      pdfButton.addEventListener('click', this.downloadAsPdf.bind(this));
    }

    this.addStyles();
  }

  formatContent(content: string): string {
    return content.split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.result.content).then(() => {
      new Notice('Content copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
      new Notice('Failed to copy content');
    });
  }

  downloadAsPdf() {
    const doc = new jsPDF();
    const title = 'Yoink Result';
    const subtitle = `Flattened ${this.result.linkedNotesCount} other note${this.result.linkedNotesCount !== 1 ? 's' : ''} (words: ${this.result.wordCount} | depth: ${this.result.depth})`;

    // Add a Unicode font
    doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    // Set font size and add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add subtitle
    doc.setFontSize(12);
    doc.text(subtitle, 20, 30);

    // Prepare content
    const lines = this.result.content.split('\n');
    const content = lines.map(line => [line]);

    // Add content using autoTable
    (doc as any).autoTable({
      startY: 40,
      head: [],
      body: content,
      theme: 'plain',
      styles: { font: 'Roboto', fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 170 } },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 0) {
          const text = data.cell.raw;
          if (text.startsWith('-') || text.startsWith('•')) {
            doc.setFontSize(10);
            doc.text('•', data.cell.x + 1, data.cell.y + 4);
          }
        }
      },
    });

    // Generate filename
    const date = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD
    const sanitizedNoteName = this.result.primaryNoteName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `yoink_flattened_${sanitizedNoteName}_${date}.pdf`;

    doc.save(filename);
    new Notice('PDF downloaded');
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
        align-items: flex-end;
        margin-bottom: 20px;
      }
      .yoink-modal-header h2 {
        margin: 0;
        line-height: 1.2;
      }
      .yoink-modal-title-container {
        display: flex;
        flex-direction: column;
      }
      .yoink-modal-subtitle {
        font-size: 0.8em;
        color: var(--text-muted);
        margin-top: 5px;
      }
      .yoink-button-container {
        display: flex;
        gap: 10px;
      }
      .yoink-action-button {
        background-color: var(--interactive-normal);
        border: none;
        border-radius: 4px;
        color: var(--text-normal);
        cursor: pointer;
        padding: 6px 10px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }
      .yoink-action-button:hover {
        background-color: var(--interactive-hover);
      }
      .yoink-result-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        background-color: var(--background-primary);
      }
      .yoink-result-container p {
        margin-bottom: 15px;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(styleElement);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}