const TTS_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";


export const generateSpeechAndPlay = async (text, language = 'en') => {
  try {
    console.log(`Generating speech for ${text}`)

    const response = await fetch(`${TTS_BACKEND_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    })

    if (!response.ok) {
      throw new error('TTS request failed')
    }

    // Get audio as blob and create URL
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    //Play audio
    const audio = new Audio(audioUrl)
    audio.play();

    //clean URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
    };

    return audio

  } catch (error) {
    console.error('TTS error', error);
    throw error;
  }
};
