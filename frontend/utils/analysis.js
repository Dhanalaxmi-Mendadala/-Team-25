// Logic to analyze prescription quality and safety

export const analyzePrescription = (data) => {
    let score = 100;
    let issues = [];
    let rating = 'Good';

    const { medicines, vitals, patient } = data;

    // 1. Check for Medicine Completeness
    medicines.forEach((med, index) => {
        let medIssues = [];
        if (!med.dosage) medIssues.push('Missing Dosage');
        if (!med.frequency) medIssues.push('Missing Frequency');
        if (!med.duration) medIssues.push('Missing Duration');

        if (medIssues.length > 0) {
            score -= (10 * medIssues.length);
            issues.push({
                type: 'critical',
                message: `${med.name}: ${medIssues.join(', ')}`
            });
        }
    });

    // 2. Check for Vitals (Sanity Checks)
    // Example: High BP check
    if (vitals.bp) {
        const [systolic, diastolic] = vitals.bp.split('/').map(n => parseInt(n));
        if (systolic > 140 || diastolic > 90) {
            issues.push({
                type: 'warning',
                message: `High Blood Pressure detected (${vitals.bp}). Verify medication.`
            });
            // Warning doesn't impact "completeness" score but flags safety
            score -= 5;
        }
    }

    // 3. Polypharmacy Check (Too many medicines)
    if (medicines.length > 5) {
        score -= 5;
        issues.push({
            type: 'warning',
            message: 'Polypharmacy: More than 5 medicines prescribed.'
        });
    }

    // Clamp score
    if (score < 0) score = 0;

    // Determine Rating
    if (score >= 80) rating = 'Good';
    else if (score >= 50) rating = 'Moderate';
    else rating = 'Needs Correction';

    // Structured Format logic (Already structured, but ensuring cleanup)
    const structuredOutput = {
        meta: {
            timestamp: new Date().toISOString(),
            score,
            rating
        },
        patient,
        vitals,
        medicines: medicines.map(m => ({
            name: m.name,
            type: m.type,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            notes: m.notes || 'N/A'
        }))
    };

    return {
        score,
        rating,
        issues,
        structuredOutput
    };
};
