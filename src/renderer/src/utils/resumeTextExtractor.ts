/**
 * Extract text content from resume files (PDF, DOCX, TXT)
 * FRONTEND WILL NOT SEND BINARY FILE
 */

/**
 * Extract text from a PDF file using unpdf
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf')

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
  const { text } = await extractText(pdf, { mergePages: true })

  return text
}

/**
 * Extract text from a DOCX file using mammoth
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * Extract text from a plain text file
 */
async function extractTextFromTXT(file: File): Promise<string> {
  return await file.text()
}

/**
 * Extract text from a resume file based on its extension
 * Supports: .pdf, .docx, .txt
 *
 * @param file - The resume file to extract text from
 * @returns Extracted text content
 * @throws Error if file type is unsupported or extraction fails
 */
export async function extractResumeText(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()

  try {
    switch (fileExtension) {
      case 'pdf':
        return await extractTextFromPDF(file)

      case 'docx':
        return await extractTextFromDOCX(file)

      case 'txt':
        return await extractTextFromTXT(file)

      default:
        throw new Error(
          `Unsupported file type: .${fileExtension}. Please upload a PDF, DOCX, or TXT file.`,
        )
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported')) {
      throw error
    }
    throw new Error(
      `Failed to extract text from ${file.name}. The file may be corrupted or in an unsupported format.`,
    )
  }
}
