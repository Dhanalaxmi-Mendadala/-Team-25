import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { clearAllData } from '../utils/storage';
import MedicineAutocomplete from '../components/MedicineAutocomplete';

const PrescriptionScreen = ({ navigation }) => {
    const [patientName, setPatientName] = useState('');
    const [age, setAge] = useState('');
    const [sex, setSex] = useState('');

    const [temperature, setTemperature] = useState('');
    const [bp, setBP] = useState('');
    const [weight, setWeight] = useState('');
    const [pulse, setPulse] = useState('');

    const [medicines, setMedicines] = useState([]);

    const addMedicine = (med) => {
        setMedicines([...medicines, { ...med, id: Date.now().toString() }]);
    };

    const removeMedicine = (id) => {
        setMedicines(medicines.filter(m => m.id !== id));
    };

    const handleAnalyze = () => {
        if (!patientName || !age || !sex) {
            Alert.alert('Missing Incomplete', 'Please fill in Patient Name, Age, and Sex.');
            return;
        }
        if (medicines.length === 0) {
            Alert.alert('No Medicines', 'Please add at least one medicine to the prescription.');
            return;
        }

        const prescriptionData = {
            patient: { name: patientName, age, sex },
            vitals: { temperature, bp, weight, pulse },
            medicines
        };

        navigation.navigate('Analysis', { data: prescriptionData });
    };

    const handleReset = () => {
        Alert.alert(
            "Clear Data",
            "This will clear the current form data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        setPatientName(''); setAge(''); setSex('');
                        setTemperature(''); setBP(''); setWeight(''); setPulse('');
                        setMedicines([]);
                    }
                }
            ]
        );
    };

    const renderMedicineItem = ({ item }) => (
        <View style={styles.medicineCard}>
            <View style={styles.medIcon}>
                <Text style={{ fontSize: 20 }}>💊</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medDetails}>{item.dosage} • {item.frequency} • {item.duration}</Text>
                {item.notes ? <Text style={styles.medNotes}>📝 {item.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => removeMedicine(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.subtitle}>Welcome back,</Text>
                            <Text style={styles.title}>Dr. Smith</Text>
                        </View>
                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Patient Info Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Patient Information</Text>
                        <View style={styles.inputRow}>
                            <View style={[styles.inputWrapper, { flex: 2, marginRight: 10 }]}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={patientName}
                                    onChangeText={setPatientName}
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor={COLORS.muted}
                                />
                            </View>
                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Yrs"
                                    keyboardType="numeric"
                                    placeholderTextColor={COLORS.muted}
                                />
                            </View>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderRow}>
                                {['Male', 'Female', 'Other'].map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[styles.genderChip, sex === option && styles.genderChipActive]}
                                        onPress={() => setSex(option)}
                                    >
                                        <Text style={[styles.genderText, sex === option && styles.genderTextActive]}>{option}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Vitals Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Vital Signs</Text>
                        <View style={styles.gridRow}>
                            {/* Reusing a helper for grid items could be better, but keeping it explicit here */}
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>BP</Text>
                                <TextInput style={styles.input} value={bp} onChangeText={setBP} placeholder="120/80" placeholderTextColor={COLORS.muted} />
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Temp (°F)</Text>
                                <TextInput style={styles.input} value={temperature} onChangeText={setTemperature} placeholder="98.6" keyboardType="numeric" placeholderTextColor={COLORS.muted} />
                            </View>
                        </View>
                        <View style={[styles.gridRow, { marginTop: 10 }]}>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="70" keyboardType="numeric" placeholderTextColor={COLORS.muted} />
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Pulse (bpm)</Text>
                                <TextInput style={styles.input} value={pulse} onChangeText={setPulse} placeholder="72" keyboardType="numeric" placeholderTextColor={COLORS.muted} />
                            </View>
                        </View>
                    </View>

                    {/* Prescription Section */}
                    <View style={styles.prescriptionSection}>
                        <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Prescription</Text>
                        <MedicineAutocomplete onAddMedicine={addMedicine} />

                        <View style={styles.medicineList}>
                            {medicines.map((item) => (
                                <View key={item.id} style={{ marginBottom: 12 }}>
                                    {renderMedicineItem({ item })}
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Floating Action Button for Analysis */}
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                        <Text style={styles.analyzeButtonText}>✨ Analyze with AI</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SIZES.padding,
        paddingBottom: 100, // Space for FAB
    },
    header: {
        marginBottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        fontWeight: '500'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    resetButton: {
        padding: 5,
    },
    resetButtonText: {
        color: COLORS.danger,
        fontWeight: '600'
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: SIZES.borderRadius,
        marginBottom: 20,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.white, // Or faint border
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 15
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15
    },
    gridItem: {
        flex: 1
    },
    inputWrapper: {
        marginBottom: 5
    },
    label: {
        fontSize: 12,
        color: COLORS.secondary,
        marginBottom: 6,
        fontWeight: '600'
    },
    input: {
        backgroundColor: COLORS.light,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5
    },
    genderChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.light,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    genderChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    genderText: {
        color: COLORS.secondary,
        fontWeight: '500'
    },
    genderTextActive: {
        color: COLORS.white
    },
    prescriptionSection: {
        marginBottom: 20
    },
    medicineList: {
        marginTop: 15
    },
    medicineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        ...SHADOWS.small,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary
    },
    medIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.light,
        justifyContent: 'center',
        alignItems: 'center'
    },
    medName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text
    },
    medDetails: {
        fontSize: 14,
        color: COLORS.secondary,
        marginTop: 2
    },
    medNotes: {
        fontSize: 12,
        color: COLORS.info,
        marginTop: 4
    },
    deleteButton: {
        padding: 10,
    },
    deleteText: {
        fontSize: 24,
        color: COLORS.muted,
        fontWeight: '300',
        lineHeight: 24
    },
    fabContainer: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        ...SHADOWS.medium
    },
    analyzeButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10
    },
    analyzeButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default PrescriptionScreen;
