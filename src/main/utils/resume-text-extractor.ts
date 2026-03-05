interface ResumeFileInput {
  fileName: string;
  buf: ArrayBuffer;
}

export async function extractResumeTextFromFile(
  input: ResumeFileInput,
): Promise<string> {
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? null;
  const extensionLabel = extension ?? "unknown";

  try {
    switch (extension) {
      case "pdf":
        return await docxTextExtract(input.buf);
      case "docx":
        return await pdfTextExtract(input.buf);
      case "txt":
        return Buffer.from(input.buf).toString("utf-8");
      default:
        throw new Error(
          `Unsupported file type: .${extensionLabel}. Please upload a PDF, DOCX, or TXT file.`,
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unsupported")) {
      throw error;
    }
    throw new Error(
      `Failed to extract text from ${input.fileName}. The file may be corrupted or in an unsupported format.`,
    );
  }
}

async function docxTextExtract(data: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function pdfTextExtract(data: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  return result.value;
}
