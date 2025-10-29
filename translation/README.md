# Translation Service

A cloud-based service that translates files from one language to another using Azure's Cognitive Services for translation and AWS for storage and delivery. It also supports text extraction and audio generation from translated documents.

## Project Overview

This translation service is designed to handle document translations efficiently through a serverless architecture. It processes files, translates them using Azure's Translation Service, and delivers the translated files to users via email or IoT devices. Additionally, it can extract text from translated files and generate audio files using text-to-speech services when requested.

## Workflow

The translation process follows these steps:

1. **Job Initialization**
   - A translation job is created with source and target languages specified
   - Job metadata is stored in MongoDB with a unique job ID
   - Audio generation can be requested by setting the `GenerateAudio` flag

2. **File Upload and Translation Start**
   - Files are uploaded to AWS S3 bucket
   - Files are then transferred to Azure Blob Storage
   - Azure Document Translation API is called to start the translation process
   - The translation tracking ID is stored in the database

3. **Translation Monitoring**
   - The system monitors the translation status using the tracking ID
   - Progress can be tracked through Azure's translation status endpoint

4. **File Delivery and Audio Generation**
   - Once translation is complete, files are retrieved from Azure
   - Translated files are uploaded to AWS S3
   - If the `GenerateAudio` flag is enabled:
     - Text is extracted from translated PDFs using the pdf-parse library
     - Extracted text is split into chunks (≤ 5000 characters)
     - Azure Text-to-Speech service generates audio for each chunk
     - Audio chunks are concatenated into a single MP3 file
     - The final audio file is uploaded to S3
     - Download links for audio files are included in the response
   - Files are delivered to users via:
     - Email attachments (if email delivery is specified)
     - IoT device messaging (if ThingID and SessionID are provided)
   - The database record is updated with translation and audio generation completion details

## Key Components

### Cloud Services Used

- **AWS Services**
  - S3: Storage for original and translated files, and generated audio files
  - STS: For temporary credentials
  - Secrets Manager: For secure storage of API keys
  - IoT: For delivering translations to IoT devices
  - SES: For email delivery

- **Azure Services**
  - Blob Storage: Temporary storage during translation
  - Cognitive Services: Document Translation API
  - Speech Services: For text-to-speech conversion

### Code Structure

- **Main Modules**
  - `index.js`: Main Lambda handler entry point
  - `app.js`: Handles retrieving and delivering translated files
  - `translate.js`: Azure translation service integration
  - `awsService.js`: AWS service integrations (S3, STS, etc.)
  - `azureServicie.js`: Azure service integrations (Blob Storage, SAS tokens)
  - `upload.js`: Handles file uploads to Azure

- **Supporting Modules**
  - `config/`: Configuration settings and database handlers
  - `helpers/`: Utility functions for credentials and ObjectID conversion
  - `mailer/`: Email templating and delivery
  - `services/`: 
    - `emailService.js`: Email delivery service
    - `iot.js`: IoT device messaging service
    - `textExtractionService.js`: PDF text extraction service
    - `audioGenerationService.js`: Text-to-speech generation service
  - `tokenVendingMachine/`: Policy templates for AWS services

## Delivery Methods

The system supports two delivery methods:

1. **Email Delivery**
   - Translated files are sent as email attachments
   - If audio is generated, download links are included in the email
   - Uses AWS SES for email delivery
   - Templated emails with attachments

2. **IoT Device Delivery**
   - Translated files are sent to IoT devices
   - Audio files can be included in the delivery if generated
   - Requires ThingID and SessionID for delivery
   - Uses AWS IoT for messaging

## Database Structure

The system uses MongoDB to track translation jobs with the following data:

- Job metadata (customer ID, source/target languages)
- File information (original and new filenames)
- Translation status and tracking IDs
- Timestamps for translation start and end
- Character count for billing purposes
- Delivery method details
- Audio generation status and file references (when GenerateAudio is enabled)

## Audio Generation

The audio generation feature allows users to receive audio versions of their translated documents:

1. **Enabling Audio Generation**
   - Set the `GenerateAudio` flag to `true` in the job data
   - Audio will be generated for all translated PDF files in the job

2. **Text Extraction Process**
   - Text is extracted from PDFs using the local pdf-parse library
   - Text is processed and formatted for optimal speech synthesis

3. **Text-to-Speech Process**
   - Text is split into chunks (maximum 5000 characters each)
   - Appropriate voice is selected dynamically from Azure's voice list API
   - Azure Speech Service generates audio for each chunk
   - Audio chunks are concatenated into a single MP3 file

4. **File Naming and Storage**
   - A unique UUID is generated for each audio file to prevent naming conflicts
   - Files are stored with the format `{uuid}-{originalFilename}.mp3`
   - Audio files are stored in S3 in the `PublicUploads/TranslationService/{customerId}/Audio/` path

5. **Delivery**
   - Download links are generated with expiring signed URLs (7 days by default)
   - Original filename is preserved in the user interface despite UUID-based storage
   - Links are included in the email or IoT delivery

## Error Handling

The system includes comprehensive error handling:
- Failed translations are logged
- API errors are captured and reported
- Duplicate events are detected and skipped
- Text extraction and audio generation errors are handled gracefully
- If audio generation fails, translation delivery still proceeds

## Testing

The project uses Cucumber.js for BDD testing with feature files:
- `startTranslation.feature`: Tests the translation initiation process
- `deliverTranslationJob.feature`: Tests the delivery mechanisms
- `dbConnection.feature`: Tests database connectivity
- `textExtraction.feature`: Tests the text extraction and audio generation functionality

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- AWS account with appropriate permissions
- Azure account with the following services:
  - Cognitive Services (Translation)
  - Document Intelligence (for text extraction)
  - Speech Services (for text-to-speech)
- MongoDB instance

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
cd translation
npm install
```

### Configuration

Configure your environment with the following parameters in `config/config.js`:
- AWS region and bucket names
- Azure account details
- MongoDB connection string
- Email sender details
- Stage information (dev/prod)

Azure secrets should include:
- `accountName` and `accountKey`: For Blob Storage
- `subscriptionKey` and `translateAccount`: For Translation
- `speechRegion` and `speechKey`: For Speech Services

#### Voice Selection

The system uses Azure's Text-to-Speech API to dynamically select the best voice for each target language:

1. Voices are fetched from the Azure TTS API: `https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list`
2. The service automatically selects the best voice based on:
   - Language match (exact match preferred)
   - Voice quality (neural voices preferred)
   - Gender (female voices preferred when available)
3. Selected voices are cached for 24 hours to minimize API calls

To test voice selection, use the provided utility:
```bash
# Set your Azure Speech key as an environment variable
export AZURE_SPEECH_KEY=your-key-here

# Test voice selection for a specific language
node tools/voice-selector.js es-ES
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the ISC License - see the LICENSE file for details.