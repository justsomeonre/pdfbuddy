import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import * as XLSX from 'xlsx';
import { extractTextFromPdf } from './pdfHelper';

/**
 * Convert extracted PDF text to an editable Microsoft Word document (.docx)
 */
export async function convertPdfToDocx(
  pdfBuffer: ArrayBuffer,
  documentTitle: string = 'Converted Document'
): Promise<Blob> {
  const pages = await extractTextFromPdf(pdfBuffer);

  const sectionsChildren: any[] = [
    new Paragraph({
      text: documentTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    }),
  ];

  for (const p of pages) {
    sectionsChildren.push(
      new Paragraph({
        text: `--- Page ${p.page} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      })
    );

    // Split page text by lines or paragraphs
    const lines = p.text.split(/(?<=\. )|\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      sectionsChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Scanned page or no text detected. Try PDF to OCR for image scans.]',
              italics: true,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    } else {
      for (const line of lines) {
        sectionsChildren.push(
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Convert extracted PDF tabular text to an Excel spreadsheet (.xlsx) or CSV
 */
export async function convertPdfToExcel(
  pdfBuffer: ArrayBuffer,
  format: 'xlsx' | 'csv' = 'xlsx'
): Promise<Blob> {
  const pages = await extractTextFromPdf(pdfBuffer);
  const wb = XLSX.utils.book_new();

  for (const p of pages) {
    // Attempt table detection by splitting lines and commas/tabs/spaces
    const lines = p.text.split('\n').filter((l) => l.trim().length > 0);
    const tableData: string[][] = [];

    for (const line of lines) {
      // Split by tab, multiple spaces, or comma
      const cols = line.split(/\t+|\s{2,}|,/);
      tableData.push(cols.map((c) => c.trim()));
    }

    if (tableData.length === 0) {
      tableData.push(['No structured data detected on this page']);
    }

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${p.page}`);
  }

  const wbout = XLSX.write(wb, {
    bookType: format,
    type: 'array',
  });

  const mimeType =
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

  return new Blob([wbout], { type: mimeType });
}
