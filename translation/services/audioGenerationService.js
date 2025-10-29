const axios = require('axios');
const { Buffer } = require('buffer');
const awsService = require('../awsService');
const textExtractionService = require('./textExtractionService');
const {getDb} = require("../config/dbHandler");
const {getObjectId: ObjectId} = require("../helpers/objectIdConverter");
const {bucketNameConverted, Stage, domainName} = require("../config/config");
const config = require("../config/config");
const audioConfig = require("../config/audioConfig");
const {v4: uuidv4} = require("uuid");

// Cache for available voices to minimize API calls
let voicesCache = {
    voices: null,
    timestamp: null,
    region: null,
    ttl: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

/**
 * Generates speech from text using Azure Text-to-Speech API
 * @param {string} text - The text to convert to speech
 * @param {object} azureKeys - Azure credentials and configuration
 * @param {object} options - TTS options (voice, language, etc.)
 * @returns {Promise<Buffer>} - Audio data as a Buffer
 */
const generateSpeechFromText = async (text, azureKeys, options = {}) => {
    try {
        if (!text || typeof text !== 'string' || text.trim() === '') {
            console.warn('Empty text provided for speech generation, returning empty buffer');
            return Buffer.from([]);
        }
        
        // Get access token for Azure TTS
        const token = await getAzureTtsToken(azureKeys);
        
        // Prepare TTS request
        const url = `https://${azureKeys.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
        
        // Set default options if not provided
        const voice = options.voice || 'en-US-JennyNeural';
        const language = options.language || 'en-US';
        const outputFormat = options.outputFormat || audioConfig.AUDIO_FORMAT;
        
        console.log(`Generating speech with voice: ${voice}, language: ${language}, format: ${outputFormat}`);
        
        // Create SSML payload
        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
                <voice name="${voice}">
                    ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}
                </voice>
            </speak>
        `;
        
        const response = await axios({
            method: 'post',
            url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': outputFormat,
                'Ocp-Apim-Subscription-Key': azureKeys.speechKey,
                'User-Agent': 'TranslationService'
            },
            data: ssml,
            responseType: 'arraybuffer'
        });
        
        if (!response.data || response.data.length === 0) {
            throw new Error('Empty response from Azure TTS API');
        }
        
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error generating speech:', error);
        
        // Provide more specific error messages based on error type
        if (error.response) {
            console.error(`Azure TTS API error: Status ${error.response.status}: ${error.response.statusText}`);
            
            if (error.response.data) {
                try {
                    // Try to parse error response if it's JSON
                    const errorData = JSON.parse(error.response.data.toString());
                    console.error('Error details:', errorData);
                } catch (e) {
                    // If not JSON, just log as string
                    console.error('Error response:', error.response.data.toString());
                }
            }
        }
        
        throw new Error(`Speech generation failed: ${error.message}`);
    }
};

/**
 * Gets an access token for Azure TTS API
 * @param {object} azureKeys - Azure credentials and configuration
 * @returns {string} - Access token
 */
const getAzureTtsToken = async (azureKeys) => {
    try {
        const response = await axios({
            method: 'post',
            url: `https://${azureKeys.speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
            headers: {
                'Ocp-Apim-Subscription-Key': azureKeys.speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response?.data;
    } catch (error) {
        console.error('Error getting Azure TTS token:', error);
        throw error;
    }
};

/**
 * Fetches available voices from Azure TTS API
 * @param {object} azureKeys - Azure credentials and configuration
 * @returns {Promise<Array>} - List of available voices
 */
const getAvailableVoices = async (azureKeys) => {
    try {
        const now = Date.now();
        const region = azureKeys.speechRegion;
        
        // Check if we have valid cached voices for this region
        if (voicesCache.voices && 
            voicesCache.region === region && 
            voicesCache.timestamp && 
            (now - voicesCache.timestamp < voicesCache.ttl)) {
            console.log('Using cached voices list');
            return voicesCache.voices;
        }
        
        console.log('Fetching voices from Azure TTS API...');
        
        // Get access token for Azure TTS
        const token = await getAzureTtsToken(azureKeys);
        
        // Call the voices list API
        const response = await axios({
            method: 'get',
            url: `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Ocp-Apim-Subscription-Key': azureKeys.speechKey
            }
        });
        
        // Update cache
        voicesCache = {
            voices: response.data,
            timestamp: now,
            region: region,
            ttl: 24 * 60 * 60 * 1000 // 24 hours
        };
        
        console.log(`Retrieved ${response.data.length} voices from Azure TTS API`);
        return response.data;
    } catch (error) {
        console.error('Error fetching available voices:', error);
        
        // If we have cached voices, return them as fallback
        if (voicesCache.voices) {
            console.log('Using cached voices as fallback after API error');
            return voicesCache.voices;
        }
        
        throw error;
    }
};

/**
 * Finds the best matching voice for a given language
 * @param {string} languageCode - Target language code (e.g., 'en-US', 'es')
 * @param {Array} availableVoices - List of available voices from Azure
 * @returns {object} - Voice configuration with name and locale
 */
const findBestVoiceForLanguage = (languageCode, availableVoices) => {
    try {
        if (!availableVoices || !Array.isArray(availableVoices) || availableVoices.length === 0) {
            console.warn('No available voices provided, using default voice');
            return { voice: 'en-US-JennyNeural', language: 'en-US' };
        }
        
        // Normalize language code for matching
        const normalizedLanguageCode = (languageCode || '').toLowerCase();
        const baseLanguageCode = normalizedLanguageCode.substring(0, 2);
        
        console.log(`Finding best voice for language: ${normalizedLanguageCode} (base: ${baseLanguageCode})`);
        
        // Try to find an exact match first (Neural voices only)
        let matchingVoices = availableVoices.filter(voice => 
            voice.Locale.toLowerCase() === normalizedLanguageCode && 
            voice.VoiceType === 'Neural'
        );
        
        // If no exact match, try with just the base language code (Neural voices only)
        if (matchingVoices.length === 0) {
            console.log(`No exact match for ${normalizedLanguageCode}, trying base language ${baseLanguageCode}`);
            matchingVoices = availableVoices.filter(voice => 
                voice.Locale.toLowerCase().startsWith(baseLanguageCode) && 
                voice.VoiceType === 'Neural'
            );
        }
        
        // If still no neural voice match, try any voice type with exact locale
        if (matchingVoices.length === 0) {
            console.log(`No neural voice for ${baseLanguageCode}, trying any voice type`);
            matchingVoices = availableVoices.filter(voice => 
                voice.Locale.toLowerCase() === normalizedLanguageCode
            );
            
            // Try base language if still no match
            if (matchingVoices.length === 0) {
                matchingVoices = availableVoices.filter(voice => 
                    voice.Locale.toLowerCase().startsWith(baseLanguageCode)
                );
            }
        }
        
        // If still no match, default to English
        if (matchingVoices.length === 0) {
            console.log('No matching voice found, defaulting to English');
            matchingVoices = availableVoices.filter(voice => 
                voice.Locale.toLowerCase().startsWith('en') && 
                voice.VoiceType === 'Neural'
            );
            
            // If no English neural voice (unlikely but possible), get any English voice
            if (matchingVoices.length === 0) {
                matchingVoices = availableVoices.filter(voice => 
                    voice.Locale.toLowerCase().startsWith('en')
                );
            }
        }
        
        // Prefer female voices if available
        const femaleVoices = matchingVoices.filter(voice => 
            voice.Gender === 'Female'
        );
        
        // Select the best voice (prefer female, then just take the first available)
        const selectedVoice = femaleVoices.length > 0 ? femaleVoices[0] : matchingVoices[0];
        
        // If no voice found at all (very unlikely), use a default
        if (!selectedVoice) {
            console.warn('No voice found in entire list, using default voice');
            return { voice: 'en-US-JennyNeural', language: 'en-US' };
        }
        
        console.log(`Selected voice: ${selectedVoice.ShortName} (${selectedVoice.Gender}, ${selectedVoice.Locale}, ${selectedVoice.VoiceType})`);
        
        return {
            voice: selectedVoice.ShortName,
            language: selectedVoice.Locale
        };
    } catch (error) {
        console.error('Error selecting voice:', error);
        // Return a default voice in case of any error
        return { voice: 'en-US-JennyNeural', language: 'en-US' };
    }
};

/**
 * Concatenates multiple audio buffers into a single MP3 file
 * Note: Simple concatenation works for MP3 files but may not be ideal for all formats
 * For production use, consider using a library like ffmpeg or mp3cat
 * @param {Array<Buffer>} audioBuffers - Array of audio buffers to concatenate
 * @returns {Buffer} - Concatenated audio buffer
 */
const concatenateAudioBuffers = (audioBuffers) => {
    // Simple concatenation approach for MP3
    return Buffer.concat(audioBuffers);
};

/**
 * Processes a text for audio generation and uploads the result to S3
 * @param {string} jobId - Job ID
 * @param {string} text - Text to convert to speech
 * @param {string} customerId - Customer ID
 * @param {string} fileName - Base file name
 * @param {object} azureKeys - Azure credentials
 * @param {object} ttsOptions - TTS options
 * @returns {string} - S3 path to the generated audio file
 */
const processTextToSpeech = async (jobId, text, customerId, fileName, azureKeys, ttsOptions = {}) => {
    try {
        // Update database with audio generation in progress
        const db = await getDb();
        await db.collection('TranslationUploads').updateOne(
            { _id: ObjectId.createFromHexString(jobId) },
            {
                $set: {
                    AudioGenerationStatus: 'processing',
                    AudioGenerationStartTime: new Date()
                }
            }
        );
        
        // Get available voices from Azure if no specific voice is requested
        let voiceOptions = ttsOptions;
        if (!ttsOptions.voice || !ttsOptions.language) {
            console.log('No specific voice requested, fetching available voices from Azure...');
            const availableVoices = await getAvailableVoices(azureKeys);
            
            // Determine target language from ttsOptions or use default
            const targetLanguage = ttsOptions.language || 'en-US';
            
            // Find the best voice for the target language
            voiceOptions = findBestVoiceForLanguage(targetLanguage, availableVoices);
            console.log(`Selected voice for ${targetLanguage}: ${voiceOptions.voice}`);
        }
        
        // Split text into chunks (max 5000 characters per chunk for Azure TTS)
        const textChunks = textExtractionService.splitTextIntoChunks(text, audioConfig.MAX_TTS_CHUNK_SIZE);
        console.log(`Split text into ${textChunks.length} chunks for TTS processing`);
        
        // Generate audio for each chunk
        const audioBuffers = [];
        for (let i = 0; i < textChunks.length; i++) {
            console.log(`Processing chunk ${i+1}/${textChunks.length}`);
            const audioBuffer = await generateSpeechFromText(textChunks[i], azureKeys, voiceOptions);
            audioBuffers.push(audioBuffer);
        }
        
        // Concatenate audio chunks
        const fullAudio = concatenateAudioBuffers(audioBuffers);
        
        // Create unique audio file name using UUID
        // We'll keep the original extension (replaced with mp3) for reference but prefix with UUID
        const originalBasename = fileName.replace(/\.[^/.]+$/, '');
        const audioFileName = `${uuidv4()}-${originalBasename}.mp3`;
        
        // Upload to S3
        const s3Key = `PublicUploads/TranslationService/${customerId}/Audio/${audioFileName}`;
        await awsService.uploadBufferToS3(fullAudio, bucketNameConverted, s3Key, 'audio/mpeg');
        
        // Update database with success
        await db.collection('TranslationUploads').updateOne(
            { _id: ObjectId.createFromHexString(jobId) },
            {
                $set: {
                    AudioGenerationStatus: 'completed',
                    AudioGenerationEndTime: new Date()
                }
            }
        );
        
        return s3Key;
    } catch (error) {
        console.error('Error processing text to speech:', error);
        
        // Update database with failure
        const db = await getDb();
        await db.collection('TranslationUploads').updateOne(
            { _id: ObjectId.createFromHexString(jobId) },
            {
                $set: {
                    AudioGenerationStatus: 'failed',
                    AudioGenerationError: error.message
                }
            }
        );
        
        throw error;
    }
};

/**
 * Generates a pre-signed URL for downloading the audio file
 * @param {string} s3Key - S3 key of the audio file
 * @param {string} customerId - Customer ID
 * @param {string} originalFileName - Original file name for display (optional)
 * @returns {object} - Object containing the pre-signed URL, expiry time, and display filename
 */
const getAudioDownloadUrl = async (s3Key, customerId, originalFileName = null) => {
    try {
        console.log(`Generating download URL for audio file: ${s3Key}, customer: ${customerId}`);
        
        // Get IAM credentials for longer-lived URLs
        const iamCredentials = await awsService.getIamCredentials(config.region, Stage, domainName);
        
        // Use the specialized method for audio files
        const signedUrlResult = await awsService.getAudioFileSignedUrl(s3Key, customerId, iamCredentials);
        
        // Add display filename to the result if provided
        if (originalFileName) {
            signedUrlResult.displayFileName = originalFileName;
        }
        
        console.log(`Generated signed URL with expiry: ${signedUrlResult.expiryTime} seconds`);
        return signedUrlResult;
    } catch (error) {
        console.error('Error generating audio download URL:', error);
        throw error;
    }
};

module.exports = {
    generateSpeechFromText,
    processTextToSpeech,
    getAudioDownloadUrl,
    getAvailableVoices,
    findBestVoiceForLanguage,
    // Export cache for potential external management
    getVoicesCache: () => voicesCache,
    clearVoicesCache: () => {
        voicesCache = {
            voices: null,
            timestamp: null,
            region: null,
            ttl: 24 * 60 * 60 * 1000
        };
        console.log('Voices cache cleared');
    }
};
