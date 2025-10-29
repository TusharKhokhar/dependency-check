# Text-to-Speech Integration Guide

This document provides guidance on how to use the text extraction and audio generation features to convert translated files into speech.

## Overview

The translation service now supports generating audio files from translated PDF documents. This feature works by:

1. Extracting text from translated PDFs using the local pdf-parse library
2. Splitting the text into manageable chunks (≤ 5000 characters each)
3. Converting each chunk to speech using Azure Text-to-Speech service
4. Concatenating the audio chunks into a single MP3 file
5. Storing the audio file in AWS S3
6. Providing download links in the response

## How to Enable Audio Generation

Audio generation is controlled by the `GenerateAudio` flag in the translation job data. When set to `true`, the system will automatically extract text from translated files and generate audio once translation is complete.

### Example Job Configuration

```json
{
  "CustomerID": "123456",
  "SourceLanguage": "en",
  "TargetLanguage": "es",
  "GenerateAudio": true,
  "JobList": [
    {
      "OriginalFileNameWithExt": "document.pdf",
      "NewFileNameWithExt": "document_translated.pdf"
    }
  ],
  "DeliveryMethod": {
    "EmailAddress": "user@example.com"
  }
}
```

## Technical Implementation

### Text Extraction Process

The text extraction process uses the `pdf-parse` library to extract text from PDF files locally. The process follows these steps:

1. The translated PDF file is accessed via a signed URL
2. The PDF is downloaded as a buffer
3. The `pdf-parse` library extracts text content from all pages
4. The text is processed into a clean, continuous format suitable for TTS

This approach eliminates the dependency on cloud-based document processing services, improving performance and reducing costs.

### Text-to-Speech Process

The TTS process uses Azure's Speech Services to convert text to high-quality audio:

1. The extracted text is split into chunks of ≤ 5000 characters
   - Chunks are split at natural boundaries (end of paragraphs, sentences)
2. For each chunk:
   - The appropriate voice is selected based on the target language
   - An SSML (Speech Synthesis Markup Language) payload is created
   - The text is submitted to Azure Speech Service for conversion
   - The resulting audio data is returned as a buffer
3. All audio chunks are concatenated into a single MP3 file
4. The final MP3 file is uploaded to AWS S3

### Storage Location

Audio files are stored in the following S3 path:
```
PublicUploads/TranslationService/{CustomerID}/Audio/{uuid}-{filename}.mp3
```

Where:
- `{CustomerID}` is the unique identifier for the customer
- `{uuid}` is a randomly generated UUID v4 to ensure filename uniqueness
- `{filename}` is the original filename (without extension)

This UUID-based naming strategy prevents filename conflicts when multiple files with the same name are processed, while still preserving the association with the original document.

## Database Updates

When audio generation is processed, the following fields are added/updated in the MongoDB document:

- `AudioGenerationStatus`: Status of the generation process (processing/completed/failed)
- `AudioGenerationStartTime`: When generation began
- `AudioGenerationEndTime`: When generation completed
- `AudioFiles`: Array of objects containing:
  - `fileName`: The UUID-based filename stored in S3
  - `originalFileName`: The original filename (for display to users)
- `AudioGenerationError`: Error message if generation failed (only present on failure)

## Language and Voice Support

The system dynamically selects the most appropriate voice based on the target language of the translation. This is done by:

1. Querying the Azure TTS API for all available voices (`https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list`)
2. Filtering voices to match the target language
3. Prioritizing neural voices for better quality
4. Preferring female voices when available

This dynamic voice selection ensures:
- Support for all languages available in Azure TTS
- Automatic use of the best quality voices
- No need to maintain a static mapping of languages to voices
- Immediate access to new voices as they become available on the Azure platform

The voice selection algorithm:
1. First tries to find an exact match for the language code (e.g., 'en-US')
2. If no exact match, looks for voices with the same base language (e.g., 'en')
3. Defaults to an English voice if no appropriate voice is found
| tr | tr-TR-EmelNeural | Turkish (Turkey) female voice |

## Error Handling

If audio generation fails for any file, the system will:

1. Log the error
2. Update the database with the failure status
3. Continue processing other files (if any)
4. Complete the normal file delivery process

The translation job will still be considered successful even if audio generation fails, ensuring that users always receive their translated files.

## Azure Speech Service Configuration

To use this feature, make sure the following Azure settings are configured:

1. Add Speech Services in Azure
2. Update the secrets with:
   - `speechRegion`: Your Azure Speech Service region
   - `speechKey`: Your subscription key