import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { analyzePrescription } from '../utils/analysis';
import { savePrescription } from '../utils/storage';

const AnalysisScreen = ({ route, navigation }) => {
    const { data } = route.params; // Prescription Data passed from previous screen
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        if (data) {
            const result = analyzePrescription(data);
            setAnalysis(result);
        }
    }, [data]);

    const handleFinalize = async () => {
        if (analysis) {
            await savePrescription(analysis.structuredOutput);
            alert('Prescription Saved Successfully!');
            navigation.navigate('Prescription'); // Go back to start
        }
    };

    if (!analysis) return null;

    const { score, rating, issues, structuredOutput } = analysis;

    const getScoreColor = (s) => {
        if (s >= 80) return COLORS.success;
        if (s >= 50) return COLORS.warning;
        return COLORS.danger;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Prescription Analysis</Text>

                {/* Score Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Overall Score</Text>
                    <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
                        <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{score}</Text>
                    </View>
                    <Text style={[styles.ratingText, { color: getScoreColor(score) }]}>{rating}</Text>
                </View>

                {/* Issues List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Guardrails & Alerts</Text>
                    {issues.length === 0 ? (
                        <Text style={{ color: COLORS.success, fontStyle: 'italic' }}>No issues detected. Good job!</Text>
                    ) : (
                        issues.map((issue, index) => (
                            <View key={index} style={styles.issueItem}>
                                <Text style={{
                                    color: issue.type === 'critical' ? COLORS.danger : COLORS.warning,
                                    fontWeight: 'bold'
                                }}>
                                    {issue.type === 'critical' ? '⚠️ CRITICAL' : '⚠️ WARNING'}
                                </Text>
                                <Text style={styles.issueText}>{issue.message}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Structured Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Structured Output Preview</Text>
                    <Text style={styles.jsonText}>
                        {JSON.stringify(structuredOutput, null, 2)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.primary }]}
                    onPress={handleFinalize}
                >
                    <Text style={styles.buttonText}>Finalize & Save</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    title: {
        fontSize: SIZES.h1,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SIZES.padding,
        textAlign: 'center'
    },
    card: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        alignItems: 'center',
        marginBottom: SIZES.padding,
        elevation: 2,
    },
    cardTitle: {
        fontSize: SIZES.h3,
        color: COLORS.secondary,
        marginBottom: 10,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    ratingText: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: SIZES.padding,
    },
    sectionTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
    },
    issueItem: {
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: SIZES.borderRadius,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.danger,
    },
    issueText: {
        color: COLORS.text,
        marginTop: 4,
    },
    jsonText: {
        fontFamily: 'monospace',
        fontSize: 10,
        backgroundColor: '#333',
        color: '#0f0',
        padding: 10,
        borderRadius: SIZES.borderRadius,
    },
    button: {
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: SIZES.h3,
        fontWeight: 'bold',
    }
});

export default AnalysisScreen;
