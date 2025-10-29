const awsService = require("./awsService");
const config = require("./config/config");
const {Stage, domainName, senderEmail} = require("./config/config");
const {getDb} = require("./config/dbHandler");
const {getObjectId: ObjectId} = require("./helpers/objectIdConverter");
const translationService = require("./translate");
const emailService = require("./services/emailService");
const textExtractionService = require("./services/textExtractionService");
const audioGenerationService = require("./services/audioGenerationService");


module.exports.retrieveFilesAndDeliverJobs = async (event, azureKeys) => {
    try {
        const db = await getDb()
        const date = new Date()
        const now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
          date.getUTCDate(), date.getUTCHours(),
          date.getUTCMinutes(), date.getUTCSeconds())
        const {
            status, summary
        } = await translationService.getTranslationStatus(event.jobData.TranslationTrackID, azureKeys.subscriptionKey, azureKeys.translateAccount)
        await db.collection('TranslationUploads').updateOne({_id: ObjectId.createFromHexString(event.jobData._id)},
          {$set: {
                  TranslationEndTime: new Date(now_utc),
                  TranslationStatus: status,
                  IsTranslated: true,
                  TotalCharacterCharged: summary.totalCharacterCharged
              }}
        )
        for (let job of event.jobData.JobList) {
            const folder = `${Stage}/${event.jobData.CustomerID.toString()}/${event.jobData._id.toString()}/${job.NewFileNameWithExt}`
            await awsService.uploadToS3(event, azureKeys, folder, event.jobData.CustomerID, job.NewFileNameWithExt)
        }
        const fetchIamCred = await awsService.getIamCredentials(config.region, Stage, domainName)
        const response = await awsService.getSignedUrls(event.jobData, event.jobData.CustomerID, true, fetchIamCred)
        
        // Process audio generation if enabled
        if (event.jobData.GenerateAudio) {
            console.log('Audio generation requested, processing files...');
            
            // Loop through each translated file
            for (const file of response) {
                try {
                    console.log(`Processing audio generation for file: ${file.originalFileName}`);
                    
                    // Step 1: Extract text from the PDF using local pdf-parse library
                    // const extractedText = 'आप कैसे है मुझे अच्छा लगा आपसे मिलकर'
                    const extractedText = await textExtractionService.extractTextFromPdf(
                        file.signedAccessLink.signedUrl,
                        azureKeys
                    );
                    
                    // Step 2: Process the text (function can now handle direct text)
                    const processedText = textExtractionService.getTextFromExtractionResult(extractedText);
                    
                    // Step 3: Pass the target language code to the TTS service
                    // We'll let the service fetch available voices from Azure
                    const targetLanguage = event.jobData.TargetLanguage;
                    
                    // Step 4: Process the text to speech and get the S3 key of the audio file
                    const audioS3Key = await audioGenerationService.processTextToSpeech(
                        event.jobData._id,
                        processedText,
                        event.jobData.CustomerID,
                        file.originalFileName,
                        azureKeys,
                        { language: targetLanguage }
                    );
                    
                    // Step 5: Generate a download URL for the audio file
                    // Pass the original filename for display purposes
                    const audioUrl = await audioGenerationService.getAudioDownloadUrl(
                        audioS3Key,
                        event.jobData.CustomerID,
                        file.originalFileName.replace(/\.[^/.]+$/, '.mp3')
                    );
                    
                    // Add audio URL to the response
                    file.audioUrl = audioUrl.signedUrl;
                    file.audioDisplayName = audioUrl.displayFileName || file.originalFileName.replace(/\.[^/.]+$/, '.mp3');
                    
                    console.log(`Successfully generated audio for ${file.originalFileName}`);
                } catch (error) {
                    console.error(`Error generating audio for ${file.originalFileName}:`, error);
                    // Continue with other files even if one fails
                }
            }
        }
        
        if (event?.jobData?.DeliveryMethod?.EmailAddress) {
            await emailService.sendEmailAttachments(response, senderEmail, event.jobData.DeliveryMethod.EmailAddress, 'Translation Job')
        }
        if (event.jobData.DeliveryMethod.ThingID && event.jobData.DeliveryMethod.SessionID) {
            await awsService.sendMessageToIoTThing(event, response)
        }
    } catch (err) {
        console.log('error found while processing: ',err);
    }
};