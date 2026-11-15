import { extname } from 'node:path';
import { inflateRawSync } from 'node:zlib';

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const FILE_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function checkDocxArchive(bytes) {
  // Check ZIP metadata before decompressing attacker-controlled documents.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new InputError('This DOCX file is damaged. Please upload it again.');
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  let unpacked = 0;
  let hasDocument = false;
  if (count > 3000 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) {
    throw new InputError('This DOCX archive is too complex. Please export it as a PDF.');
  }
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) {
      throw new InputError('This DOCX file is damaged. Please export it again.');
    }
    const size = bytes.readUInt32LE(offset + 24);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const method = bytes.readUInt16LE(offset + 10);
    const nameSize = bytes.readUInt16LE(offset + 28);
    const extraSize = bytes.readUInt16LE(offset + 30);
    const commentSize = bytes.readUInt16LE(offset + 32);
    unpacked += size;
    if (unpacked > 20 * 1024 * 1024 || (bytes.readUInt16LE(offset + 8) & 1)) {
      throw new InputError('This DOCX is encrypted or too large to read. Please export it as a PDF.');
    }
    if (offset + 46 + nameSize + extraSize + commentSize > bytes.length) {
      throw new InputError('This DOCX file is damaged. Please export it again.');
    }
    if (![0, 8].includes(method) || localOffset + 30 > bytes.length || bytes.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new InputError('This DOCX archive is unsupported. Please export it again.');
    }
    const start = localOffset + 30 + bytes.readUInt16LE(localOffset + 26) + bytes.readUInt16LE(localOffset + 28);
    if (start + compressedSize > bytes.length) throw new InputError('This DOCX file is damaged. Please export it again.');
    const compressed = bytes.subarray(start, start + compressedSize);
    // ZIP size metadata is untrusted. Bound actual decompression before handing
    // the archive to Word's parser, including deliberately false size fields.
    const expanded = method === 8 ? inflateRawSync(compressed, { maxOutputLength: Math.max(1, 20 * 1024 * 1024 - (unpacked - size)) }) : compressed;
    if (expanded.length !== size) throw new InputError('This DOCX file is damaged. Please export it again.');
    const name = bytes.subarray(offset + 46, offset + 46 + nameSize).toString('utf8');
    if (name === 'word/document.xml') hasDocument = true;
    offset += 46 + nameSize + extraSize + commentSize;
  }
  if (!hasDocument) throw new InputError('Please upload a Word DOCX document, PDF, or plain text file.');
}

export async function readBrief(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || !file.name) throw new InputError('Choose a policy brief to upload.');
  if (!file.size || file.size > MAX_FILE_BYTES) throw new InputError('Your brief must be between 1 byte and 4 MB.');
  const extension = extname(file.name).toLowerCase();
  const contentType = FILE_TYPES[extension];
  if (!contentType) throw new InputError('Please upload a PDF, DOCX, or TXT policy brief.');
  const bytes = Buffer.from(await file.arrayBuffer());
  let text;
  try {
    if (extension === '.pdf') {
      if (!bytes.subarray(0, 8).toString().startsWith('%PDF-')) throw new InputError('This file is not a valid PDF.');
      const { getDocumentProxy, extractText } = await import('unpdf');
      const document = await getDocumentProxy(new Uint8Array(bytes));
      try {
        if (document.numPages > 80) throw new InputError('Please upload a policy brief of80 pages or fewer.');
        const result = await extractText(document, { mergePages: true });
        text = result.text;
      } finally { await document.loadingTask.destroy(); }
    } else if (extension === '.docx') {
      if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) throw new InputError('This file is not a valid DOCX document.');
      checkDocxArchive(bytes);
      const mammoth = await import('mammoth');
      text = (await mammoth.extractRawText({ buffer: bytes }, { externalFileAccess: false })).value;
    } else {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (text.includes('\0')) throw new InputError('Please upload a plain UTF-8 text file.');
    }
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('We could not read this document. Please export an unlocked PDF, DOCX, or UTF-8 TXT file.');
  }
  text = text.replace(/\r\n?/g, '\n').trim();
  if (text.length > 200000) throw new InputError('This document is too long to process. Please upload only your policy brief.');
  const filename = file.name.replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(-180);
  return { bytes, text, filename, contentType };
}
