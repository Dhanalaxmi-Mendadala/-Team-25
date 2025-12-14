import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { analyzePrescriptionWithAI } from '../utils/analysis';
import { savePrescription } from '../utils/storage';
import { API_BASE_URL } from '../constants/config';
import { encode } from 'base-64';

const AnalysisScreen = ({ route, navigation }) => {
    const { data } = route.params;
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (data) {
                try {
                    setLoading(true);
                    const result = await analyzePrescriptionWithAI(data);

                    if (result.error) {
                        Alert.alert("Analysis Failed", result.message);
                        navigation.goBack();
                        return;
                    }

                    setAnalysis(result);
                } catch (err) {
                    Alert.alert("Error", "Something went wrong.");
                    navigation.goBack();
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAnalysis();
    }, [data]);

    const handleFinalize = async () => {
        if (analysis && analysis.structured_prescription) {
            await savePrescription(analysis.structured_prescription);
            Alert.alert('Success', 'Prescription Saved to Records!');
            navigation.navigate('Prescription');
        }
    };

    const handleExportPdf = async () => {
        if (!analysis) {
            Alert.alert("No Analysis", "Please define a prescription first.");
            return;
        }

        try {
            setExporting(true);
            const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(analysis),
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Extract useful error info if possible
                let friendlyError = "Something went wrong on the server.";
                try {
                    const errObj = JSON.parse(errorText);
                    if (errObj.detail) friendlyError = errObj.detail;
                } catch (e) {
                    friendlyError = errorText.substring(0, 100); // Limit length
                }
                throw new Error(`Server Error: ${friendlyError}`);
            }

            const data = await response.json();

            if (data.pdf_base64) {
                const filename = `Prescription_Report_${Date.now()}.pdf`;
                const fileUri = FileSystem.documentDirectory + filename;

                await FileSystem.writeAsStringAsync(fileUri, data.pdf_base64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert("Saved", `PDF saved to ${fileUri}`);
                }
            } else {
                throw new Error("Received invalid data from server (missing PDF).");
            }

        } catch (error) {
            console.error("Export API Error:", error);
            Alert.alert("Export Failed", error.message || "Could not export PDF. Please check your connection.");
        } finally {
            setExporting(false);
        }
    };

    const handleFinalize = async () => {
        if (analysis && analysis.structured_prescription) {
            await savePrescription(analysis.structured_prescription);
            Alert.alert('Success', 'Prescription Saved to Records!');
            navigation.navigate('Prescription');
        }
    };
    
  if (!analysis) return null;

    const score = analysis.score || 0;
    const rating = analysis.evaluation?.overall_rating || 'Unknown';
    const structuredOutput = analysis.structured_prescription || [];
    const evaluation = analysis.evaluation || {};

    const getScoreColor = (s) => {
        if (s >= 80) return COLORS.success;
        if (s >= 50) return COLORS.warning;
        return COLORS.danger;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Analysis Report</Text>

                {data.diagnosis && (
                    <View style={styles.diagnosisBox}>
                        <Text style={styles.diagnosisLabel}>Diagnosis Provided:</Text>
                        <Text style={styles.diagnosisText}>{data.diagnosis}</Text>
                    </View>
                )}

                {/* Score Dashboard */}
                <View style={styles.scoreCard}>
                    <View style={[styles.scoreRing, { borderColor: getScoreColor(score) }]}>
                        <Text style={[styles.scoreVal, { color: getScoreColor(score) }]}>{score}</Text>
                        <Text style={styles.scoreLabel}>/100</Text>
                    </View>
                    <View style={styles.scoreInfo}>
                        <Text style={[styles.ratingTitle, { color: getScoreColor(score) }]}>{rating}</Text>
                        <Text style={styles.ratingDesc}>Based on clinical guidelines</Text>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Safety</Text>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{evaluation.safety}%</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Completeness</Text>
                        <Text style={[styles.statValue, { color: COLORS.info }]}>{evaluation.completeness}%</Text>
                    </View>
                </View>


                {/* Summary Section - New */}
                {analysis.summary && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>📋 Analysis Summary</Text>
                        <Text style={styles.summaryText}>{analysis.summary}</Text>
                    </View>
                )}

                {/* Drug Interactions Warning - New */}
                {analysis.drug_interactions && analysis.drug_interactions.length > 0 && (
                    <View style={styles.interactionsCard}>
                        <Text style={styles.interactionsTitle}>⚠️ Drug Interactions</Text>
                        {analysis.drug_interactions.map((interaction, idx) => (
                            <Text key={idx} style={styles.interactionText}>• {interaction}</Text>
                        ))}
                    </View>
                )}

                {/* Recommendations Section - New */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <View style={styles.recommendationsCard}>
                        <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
                        {analysis.recommendations.map((rec, idx) => (
                            <Text key={idx} style={styles.recommendationText}>• {rec}</Text>
                        ))}
                    </View>
                )}

                {/* Detailed Analysis */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Prescription Breakdown</Text>
                    {structuredOutput.length === 0 ? (
                        <Text style={styles.emptyText}>No medicines processed.</Text>
                    ) : (
                        structuredOutput.map((med, index) => (
                            <View key={index} style={styles.medItem}>
                                <View style={styles.medHeader}>
                                    <Text style={styles.medName}>{med.medicine_name}</Text>
                                    {med.strength && <Text style={styles.medDose}>{med.strength}</Text>}
                                </View>
                                {med.formulation && (
                                    <Text style={styles.medFormulation}>📦 {med.formulation}</Text>
                                )}
                                <View style={styles.tagRow}>
                                    {med.frequency && <View style={styles.tag}><Text style={styles.tagText}>{med.frequency}</Text></View>}
                                    {med.timing && <View style={styles.tag}><Text style={styles.tagText}>{med.timing}</Text></View>}
                                    {med.duration && <View style={styles.tag}><Text style={styles.tagText}>{med.duration}</Text></View>}
                                </View>
                                {med.warnings && med.warnings.length > 0 && (
                                    <View style={styles.warningBox}>
                                        {med.warnings.map((w, i) => (
                                            <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleExportPdf} disabled={exporting}>
                        {exporting ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.exportButtonText}>📄 Export PDF</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={handleFinalize}>
                        <Text style={styles.approveButtonText}>Approve & Save</Text>
                    </TouchableOpacity>
                </View>

                {/* Debug / Raw Output Section */}
                <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={styles.debugToggle}>
                    <Text style={styles.debugToggleText}>{showDebug ? "Hide Raw Data" : "Show Raw AI Response"}</Text>
                </TouchableOpacity>

                {showDebug && (
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugText}>{JSON.stringify(analysis, null, 2)}</Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark
    },
    loadingSubText: {
        marginTop: 5,
        color: COLORS.secondary,
        fontSize: 14
    },
    scrollContent: {
        padding: SIZES.padding,
        paddingBottom: 40
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 20,
        textAlign: 'center'
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        ...SHADOWS.medium
    },
    scoreRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20
    },
    scoreVal: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: -5
    },
    scoreInfo: {
        flex: 1
    },
    ratingTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5
    },
    ratingDesc: {
        fontSize: 14,
        color: COLORS.secondary,
        lineHeight: 20
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 16,
        marginBottom: 25,
        ...SHADOWS.light
    },
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    divider: {
        width: 1,
        backgroundColor: COLORS.border
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    section: {
        marginBottom: 30
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 15,
        marginLeft: 5
    },
    medItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        ...SHADOWS.small
    },
    medHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    medName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text
    },
    medDose: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600'
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 5
    },
    tag: {
        backgroundColor: COLORS.light,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6
    },
    tagText: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '500'
    },
    warningBox: {
        marginTop: 12,
        backgroundColor: '#FFF5F5',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.danger
    },
    warningText: {
        color: COLORS.danger,
        fontSize: 13,
        lineHeight: 18
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.secondary,
        fontStyle: 'italic',
        marginTop: 10
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20
    },
    actionButton: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.medium
    },
    approveButton: {
        backgroundColor: COLORS.primary,
    },
    approveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    exportButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    exportButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    diagnosisBox: {
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info
    },
    diagnosisLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    diagnosisText: {
        fontSize: 15,
        color: COLORS.dark,
        fontStyle: 'italic'
    },
    debugToggle: {
        alignItems: 'center',
        padding: 10,
        marginBottom: 10
    },
    debugToggleText: {
        color: COLORS.secondary,
        textDecorationLine: 'underline',
        fontSize: 12
    },
    debugContainer: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 20
    },
    debugText: {
        fontFamily: 'monospace',
        fontSize: 10,
        color: '#333'
    }
});

export default AnalysisScreen;
