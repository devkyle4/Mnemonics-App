// llmService.jsx - Gemini Fix
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const instantiateBatch = async (genomes, topicContext, targetWords = []) => {
    console.log(`Genome: ${genomes}`)
    console.log(`Genome Length: ${genomes.length}`)

    try {
        // UPDATED: Using the most stable model identifier
        const model = genAI.getGenerativeModel({
            model: "gemma-3-27b-it",
            responseMimeType: "application/json",
            temperature: 0.4
        });

        const planetList = targetWords.length > 0 ? targetWords.join(", ") : "the items";

        const prompt = `

        You are a Mnemonic Specialist. Create a high-cue ${genomes.length} sentences for: "${topicContext}".

        Targets: ${planetList}.

        CORE OBJECTIVES:
        
        1. Try as much as possible to make sure the predicted words have a 
        2. ORTHOGRAPHIC SIMILARITY: Choose words that share at least 2-3 letters with the target (e.g., 'Mercury' -> 'Merchant', 'Venus' -> 'Ventriloquist').
        2. VISUAL COHERENCE AND MEANING: The sentence must describe a vivid, imaginable scene and should be grammatically meaningful. It should NOT be a random list of words.


        Constraint: Match these letters and roles:

        ${genomes.map((g, i) => `[${i + 1}]: ${g.map(s => `${s.letter}(${s.role})`).join(" ")}`).join("\n")}


        Return JSON: { "mnemonics": [ { "sentence": "...", "words": [] } ] 
        `;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Safety: Remove markdown blocks if Gemini accidentally includes them
        const cleanText = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanText);

        return data.mnemonics;

    } catch (error) {
        console.error("Gemini Batch Error:", error);
        // Return fallback so the GA doesn't crash on 404
        return genomes.map(g => ({
            sentence: "Model connection issue - check API Key/Model",
            words: g.map(slot => slot.letter),
        }));
    }
};


export const generateMnemonicImage = async (sentence, topic) => {
    try {
        console.log('Generating image for mnemonic...');

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-image"
        });

        const imagePrompt = `Create a vivid, educational illustration for this mnemonic sentence about ${topic}:

"${sentence}"

Style: Colorful, clear, memorable educational illustration. Each key word should be visually represented. Make it look like a textbook illustration that helps students remember the concept.`;

        const result = await model.generateContent([imagePrompt]);
        const response = await result.response;


        console.warn('Gemini 2.0 Flash does not support image generation. Use Imagen API or external service.');
        return null;

    } catch (error) {
        console.error("Image generation error:", error);
        return null;
    }
};

export const debugModels = async () => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${import.meta.env.VITE_GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Allowed Models for this key:", data);
};