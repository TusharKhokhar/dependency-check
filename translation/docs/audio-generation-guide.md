# Audio Generation Feature Guide

This document provides instructions on how to enable and test the audio generation feature in the translation service.

## Enabling Audio Generation

To enable audio generation for a translation job, set the `GenerateAudio` flag to `true` in your job request:

```json
{
  "CustomerID": "your-customer-id",
  "SourceLanguage": "en",
  "TargetLanguage": "es",
  "GenerateAudio": true,
  "JobList": [
    {
      "OriginalFileNameWithExt": "your-document.pdf",
      "NewFileNameWithExt": "your-document-translated.pdf"
    }
  ],
  "DeliveryMethod": {
    "EmailAddress": "recipient@example.com"
  }
}
```

## Text Extraction and Processing

The service extracts text from PDF documents using the following process:

1. **PDF Text Extraction**: Uses the `pdf-parse` library to extract text directly from PDF files
   - Text is extracted locally without sending the document to cloud services
   - This approach improves performance and reduces external API dependencies

2. **Text Chunking**: The extracted text is split into chunks of maximum 5000 characters
   - Chunks are created at natural breaks (paragraphs, sentences, or spaces)
   - This ensures that Azure TTS processes text in manageable segments

3. **Audio Generation**: Each text chunk is converted to speech using Azure TTS
   - Audio buffers are collected for each chunk
   - All audio segments are concatenated into a single MP3 file

4. **Output Storage**: The final MP3 file is uploaded to S3
   - A download link is generated and included in the response
   - The download link is also included in notification emails

## Audio File URLs

Audio files are made available through long-lived signed URLs (valid for 7 days by default). The service:

1. Creates audio files in the S3 path: `PublicUploads/TranslationService/{CustomerId}/Audio/{uuid}-{filename}.mp3`
2. Generates pre-signed URLs using a specialized function for audio files
3. Includes these URLs in both the API response and email notifications

### File Naming Strategy

To prevent filename conflicts and ensure uniqueness, the service uses a UUID-based naming strategy:

1. Each audio file is assigned a unique UUID as a prefix
2. The original filename (without extension) is preserved after the UUID
3. The file extension is always `.mp3`

For example:
- Original file: `document.pdf`
- Generated audio file: `550e8400-e29b-41d4-a716-446655440000-document.mp3`

This approach prevents conflicts when multiple files with the same name are processed. While the actual filename in S3 contains the UUID, users will still see the original filename in emails and the user interface.

### URL Generation Process

The audio URL generation process follows these steps:

1. The S3 key for the audio file is determined from the customer ID and filename
2. IAM credentials are obtained for the S3 bucket
3. A pre-signed URL is generated with a 7-day expiration period
4. The signed URL is included in the response and email notifications

To troubleshoot URL issues, you can use the test utility:

```bash
node tools/test-audio-url.js <customerId> <jobId> <filename>
```

You can also test the UUID generation for audio filenames:

```bash
node tools/test-uuid-audio.js <filename1> [filename2] [filename3]
```

## Testing the Feature Locally

To test the audio generation feature locally:

1. Install the required dependencies:
   ```bash
   npm install
   ```

2. Make sure your Azure credentials are properly configured in AWS Secrets Manager or in a local configuration.

3. Run the test specifically for the audio feature:
   ```bash
   npm run test:audio
   ```

4. To test with a sample payload:
   ```bash
   node -e "const lambda = require('./index'); lambda.handler(require('./tests/payload-with-audio.json'))"
   ```

## Configuration

You can customize the audio generation settings in the `config/audioConfig.js` file:

- `MAX_TTS_CHUNK_SIZE`: Maximum text chunk size for processing (default: 5000 characters)
- `AUDIO_FORMAT`: Output audio format (default: 'audio-24khz-96kbitrate-mono-mp3')
- `VOICE_MAP`: Mapping of language codes to voice configurations
- `RETRY_CONFIG`: Settings for retry logic

## Troubleshooting

Common issues and solutions:

1. **Audio generation fails but translation succeeds**
   - Check Azure Speech Service credentials
   - Verify that the document has extractable text
   - Check S3 permissions for audio file uploads

2. **Text extraction works but speech generation fails**
   - Verify Azure Speech Service region and key
   - Check for unsupported characters in the text
   - Ensure the target language is supported by Azure TTS

3. **Low quality audio**
   - Adjust the `AUDIO_FORMAT` in audioConfig.js for higher quality
   - Use neural voices (already configured as default)

## Monitoring

Audio generation progress is tracked in the MongoDB database with the following fields:

- `AudioGenerationStatus`: Current status (processing, completed, failed)
- `AudioGenerationStartTime`: When the generation process started
- `AudioGenerationEndTime`: When the generation process completed
- `AudioFiles`: List of generated audio files with their original names and UUID-based filenames
- `AudioGenerationError`: Error message if generation failed
