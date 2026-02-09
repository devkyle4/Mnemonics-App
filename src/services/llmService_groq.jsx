// llmService.jsx - Fixed version with aggressive rate limiting and error handling

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const instantiateBatch = async (genomes, topicContext, retryCount = 0) => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!GROQ_API_KEY) throw new Error('Groq API Key Missing');

  // Construct a detailed prompt for the batch
  const batchDetails = genomes.map((genome, i) => {
    const sequence = genome.map(g => `${g.letter} (${g.role.replace('_', ' ')})`).join(' -> ');
    return `Mnemonic #${i + 1}: Sequence: ${sequence}`;
  }).join('\n');

  const prompt = `Create exactly ${genomes.length} mnemonic sentences for the topic: "${topicContext}".

Strict Requirements for each Mnemonic:
1. Follow the letter sequence provided.
2. Words MUST match the assigned semantic roles.
3. Be vivid and memorable.

${batchDetails}

Return ONLY a JSON object with a "mnemonics" key containing an array:
{
  "mnemonics": [
    {
      "sentence": "The complete sentence",
      "words": ["word1", "word2", "word3"],
      "memorability_score": 85,
      "coherence_score": 90
    }
  ]
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "You are a mnemonic expert that outputs ONLY valid JSON. Do not include introductory text." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    // Check for rate limiting
    if (response.status === 429) {
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        // More aggressive exponential backoff: 4s, 8s, 16s
        const waitTime = Math.pow(2, retryCount + 1) * 2000;
        console.warn(`Rate limited. Retrying in ${waitTime/1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
        await delay(waitTime);
        return instantiateBatch(genomes, topicContext, retryCount + 1);
      } else {
        console.error("Max retries reached for rate limiting");
        throw new Error("Rate limit exceeded after retries");
      }
    }

    // Check for other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid API response structure");
    }

    const content = JSON.parse(data.choices[0].message.content);
    
    // Validate that we got the expected number of mnemonics
    if (!content.mnemonics || !Array.isArray(content.mnemonics)) {
      console.error("Response missing mnemonics array:", content);
      throw new Error("Response missing mnemonics array");
    }

    // Ensure each mnemonic has proper scores (default to 50 if missing)
    const validatedMnemonics = content.mnemonics.map((mnemonic, idx) => ({
      sentence: mnemonic.sentence || genomes[idx].map(slot => `${slot.letter}...`).join(' '),
      words: mnemonic.words || [],
      memorability_score: Number(mnemonic.memorability_score) || 50,
      coherence_score: Number(mnemonic.coherence_score) || 50
    }));

    // If we got fewer mnemonics than expected, pad with fallbacks
    while (validatedMnemonics.length < genomes.length) {
      const idx = validatedMnemonics.length;
      validatedMnemonics.push({
        sentence: genomes[idx].map(slot => `${slot.letter}...`).join(' '),
        words: [],
        memorability_score: 50,
        coherence_score: 50
      });
    }

    return validatedMnemonics.slice(0, genomes.length);
    
  } catch (error) {
    console.error("Batch LLM Error:", error);
    
    // Fallback: Return valid phenotypes with middle-range scores so fitness can be calculated
    return genomes.map(g => ({
      sentence: g.map(slot => `${slot.letter}...`).join(' '),
      words: [],
      memorability_score: 50,
      coherence_score: 50
    }));
  }
};