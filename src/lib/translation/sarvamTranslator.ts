export async function translateWithSarvam(text: string, targetLanguage: string) {
  try {
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'auto',
        target_language_code: targetLanguage,
        speaker_gender: 'Female',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: false,
        output_script: 'roman',
        numerals_format: 'international'
      })
    });

    if (!response.ok) {
      throw new Error('Sarvam translation failed');
    }

    const data = await response.json();
    return data.translation;
  } catch (error) {
    console.error('Sarvam translation error:', error);
    throw error;
  }
} 