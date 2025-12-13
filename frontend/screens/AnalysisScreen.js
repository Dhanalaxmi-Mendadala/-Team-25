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
    StatusBar
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { analyzePrescriptionWithAI } from '../utils/analysis';
import { savePrescription } from '../utils/storage';

const AnalysisScreen = ({ route, navigation }) => {
    const { data } = route.params;
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing Prescription...</Text>
                <Text style={styles.loadingSubText}>Checking interactions & safety doses</Text>
            </View>
        );
    }

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
                                    <Text style={styles.medDose}>{med.strength}</Text>
                                </View>
                                <View style={styles.tagRow}>
                                    <View style={styles.tag}><Text style={styles.tagText}>{med.frequency}</Text></View>
                                    <View style={styles.tag}><Text style={styles.tagText}>{med.timing}</Text></View>
                                    <View style={styles.tag}><Text style={styles.tagText}>{med.duration}</Text></View>
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

                <TouchableOpacity style={styles.approveButton} onPress={handleFinalize}>
                    <Text style={styles.approveButtonText}>Approve & Save</Text>
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
    approveButton: {
        backgroundColor: COLORS.primary, // Teal
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium
    },
    approveButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default AnalysisScreen;
