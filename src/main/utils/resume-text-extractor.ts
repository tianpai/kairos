interface ResumeFileInput {
  fileName: string;
  data: ArrayBuffer;
}

async function extractTextFromPDF(data: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function extractTextFromDOCX(data: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  return result.value;
}

function extractTextFromTXT(data: ArrayBuffer): string {
  return Buffer.from(data).toString("utf-8");
}

function getExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext ?? null;
}

export async function extractResumeTextFromFile(
  input: ResumeFileInput,
): Promise<string> {
  const extension = getExtension(input.fileName);
  const extensionLabel = extension ?? "unknown";

  try {
    switch (extension) {
      case "pdf":
        return await extractTextFromPDF(input.data);
      case "docx":
        return await extractTextFromDOCX(input.data);
      case "txt":
        return extractTextFromTXT(input.data);
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
