import { API_BASE_URL } from '../constants/config';

// Logic to analyze prescription quality and safety via AI Backend

export const analyzePrescriptionWithAI = async (data) => {
    try {
        const { medicines, vitals, patient, diagnosis } = data;

        // 1. Convert structured data to natural language text for the AI
        let promptText = `Patient: ${patient.name}, ${patient.age}, ${patient.sex}. `;
        promptText += `Vitals: Temp ${vitals.temperature}, BP ${vitals.bp}, Weight ${vitals.weight}, Pulse ${vitals.pulse}. `;
        if (diagnosis) promptText += `Diagnosis: ${diagnosis}. `;
        promptText += `Medicines: `;
        medicines.forEach(m => {
            promptText += `${m.name} ${m.dosage || ''} ${m.frequency || ''} ${m.duration || ''} (${m.notes || ''}) | `;
        });

        // 2. Call Backend API
        const response = await fetch(`${API_BASE_URL}/api/analyze-prescription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: promptText }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Analysis Error:", error);
        return {
            error: true,
            message: "Failed to connect to analysis server. Please try again."
        };
    }
};

// Fallback local logic (deprecated, kept for reference if needed)
export const analyzePrescriptionLocal = (data) => {
    // ... existing local logic ...
    return { error: true, message: "Local analysis deprecated" };
};
