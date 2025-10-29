const axios = require('axios');
const {getDb} = require("../config/dbHandler");
const {getObjectId: ObjectId} = require("../helpers/objectIdConverter");

/**
 * Extracts text from a PDF file using pdf-parse library
 * @param {string} sourceUrl - Signed URL to the PDF file
 * @param {object} [azureKeys] - Azure credentials (kept for backward compatibility)
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromPdf = async (sourceUrl, azureKeys) => {
    try {
        const pdfParse = require('pdf-parse');
        console.log(`Extracting text from PDF at URL: ${sourceUrl}`);

        // Download the PDF file
        const response = await axios.get(sourceUrl, { responseType: 'arraybuffer' });
        const pdfBuffer = Buffer.from(response.data);

        // Extract text using pdf-parse
        const pdfData = await pdfParse(pdfBuffer);
        const cleanedText = pdfData.text.replace(/\s+/g, ' ').trim();
        console.log(`Successfully extracted ${cleanedText.length} characters from PDF`);
        return cleanedText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
};

/**
 * Extracts text from PDF extraction results
 * This function now supports both legacy Azure Document Intelligence results
 * and direct text output from pdf-parse
 * @param {object|string} extractionResult - Either the result from Azure Document Intelligence or direct text
 * @returns {string} - The extracted text content
 */
const getTextFromExtractionResult = (extractionResult) => {
    // If the result is already a string, return it directly (pdf-parse output)
    if (typeof extractionResult === 'string') {
        return extractionResult;
    }
    
    // Handle legacy Azure Document Intelligence format
    if (extractionResult && extractionResult.content) {
        return extractionResult.content;
    }
    
    // Handle other potential formats from Azure
    if (extractionResult && extractionResult.analyzeResult && extractionResult.analyzeResult.content) {
        return extractionResult.analyzeResult.content;
    }
    
    // If no valid format is found, return empty string and log warning
    console.warn('Unrecognized text extraction result format:', 
        typeof extractionResult === 'object' ? JSON.stringify(extractionResult).substring(0, 100) + '...' : extractionResult);
    return '';
};

/**
 * Updates the database with text extraction status
 * @param {string} jobId - The job ID
 * @param {string} status - The status of text extraction
 * @param {object} additionalData - Any additional data to update
 * @returns {Promise<void>}
 */
const updateTextExtractionStatus = async (jobId, status, additionalData = {}) => {
    try {
        const db = await getDb();
        await db.collection('TranslationUploads').updateOne(
            { _id: ObjectId.createFromHexString(jobId) },
            { 
                $set: { 
                    TextExtractionStatus: status,
                    TextExtractionTime: new Date(),
                    ...additionalData
                } 
            }
        );
    } catch (error) {
        console.error('Error updating text extraction status:', error);
        throw error;
    }
};

/**
 * Splits text into chunks of specified maximum length
 * @param {string} text - The text to split
 * @param {number} maxChunkSize - Maximum characters per chunk
 * @returns {Array<string>} - Array of text chunks
 */
const splitTextIntoChunks = (text, maxChunkSize = 5000) => {
    // If text is shorter than max size, return as is
    if (text.length <= maxChunkSize) {
        return [text];
    }
    
    const chunks = [];
    let currentPosition = 0;
    
    while (currentPosition < text.length) {
        // Find a good break point (end of sentence or paragraph)
        let endPosition = Math.min(currentPosition + maxChunkSize, text.length);
        
        // If we're not at the end, try to find a good break point
        if (endPosition < text.length) {
            // Look for paragraph breaks first
            const paragraphBreak = text.lastIndexOf('\n\n', endPosition);
            if (paragraphBreak > currentPosition && paragraphBreak > endPosition - 200) {
                endPosition = paragraphBreak + 2; // Include the newlines
            } else {
                // Look for sentence breaks (., !, ?)
                for (const char of ['.', '!', '?']) {
                    const sentenceBreak = text.lastIndexOf(char, endPosition);
                    if (sentenceBreak > currentPosition && sentenceBreak > endPosition - 100) {
                        endPosition = sentenceBreak + 1;
                        break;
                    }
                }
                
                // If no good break found, at least try to break at a space
                if (endPosition === currentPosition + maxChunkSize) {
                    const spaceBreak = text.lastIndexOf(' ', endPosition);
                    if (spaceBreak > currentPosition) {
                        endPosition = spaceBreak + 1;
                    }
                }
            }
        }
        
        // Extract the chunk and add it to our array
        chunks.push(text.substring(currentPosition, endPosition));
        currentPosition = endPosition;
    }
    
    return chunks;
};

module.exports = {
    extractTextFromPdf,
    getTextFromExtractionResult,
    updateTextExtractionStatus,
    splitTextIntoChunks
};