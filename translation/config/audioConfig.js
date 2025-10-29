/**
 * Configuration file for audio generation features
 */

// Maximum chunk size for text-to-speech processing
const MAX_TTS_CHUNK_SIZE = 15000;

// Default audio format configuration
const AUDIO_FORMAT = 'audio-24khz-96kbitrate-mono-mp3';

// Retry configuration for audio generation
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    backoffFactor: 2    // exponential backoff
};

module.exports = {
    MAX_TTS_CHUNK_SIZE,
    AUDIO_FORMAT,
    RETRY_CONFIG
};
