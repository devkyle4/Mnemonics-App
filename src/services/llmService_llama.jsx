const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";


// Rate limiting helper (keep for frontend throttling)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Throttling: waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
};

export const instantiateGenome = async (genome, topicContext) => {
    try {
        await waitForRateLimit();

        const termsToRemember = genome.map(g => g.originalTerm).join(', ');
        const letters = genome.map(g => g.letter).join('');

        const genomeData = genome.map((slot, idx) => ({
            index: idx,
            letter: slot.letter,
            role: slot.role,
            originalTerm: slot.originalTerm
        }));

        console.log('Calling backend API...');

        // Call your backend server

        const response = await fetch(`${BACKEND_URL}/api/generate-mnemonic`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                genome: genomeData,
                topicContext: topicContext,
                termsToRemember: termsToRemember,
                letters: letters
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Backend API error:', errorData);
            throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();

        console.log('Backend response:', result);

        return {
            sentence: result.sentence || genome.map(g => `${g.letter}word`).join(' '),
            words: result.words || genome.map(g => `${g.letter}word`),
            memorability: result.memorability_score || 50,
            coherence: result.coherence_score || 50
        };
    } catch (error) {
        console.error('LLM error:', error);

        // Fallback
        return {
            sentence: genome.map(g => `${g.letter}word`).join(' '),
            words: genome.map(g => `${g.letter}word`),
            memorability: 0,
            coherence: 0
        };
    }
};

