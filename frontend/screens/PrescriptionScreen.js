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
    FlatList
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
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
        // 1. Validate Patient Info
        if (!patientName || !age || !sex) {
            Alert.alert('Missing Patient Info', 'Please fill in Name, Age, and Sex.');
            return;
        }

        // 2. Validate Vitals
        if (!temperature || !bp || !weight || !pulse) {
            Alert.alert('Missing Vitals', 'Please fill in all medical measurements (Temp, BP, Weight, Pulse).');
            return;
        }

        // 3. Validate Medicines
        if (medicines.length === 0) {
            Alert.alert('Empty Prescription', 'Please add at least one medicine.');
            return;
        }

        // Propagate data to Analysis
        const prescriptionData = {
            patient: { name: patientName, age, sex },
            vitals: { temperature, bp, weight, pulse },
            medicines
        };

        navigation.navigate('Analysis', { data: prescriptionData });
    };

    const handleReset = async () => {
        Alert.alert(
            "Reset App",
            "Are you sure? This will clear your clinic profile.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        navigation.replace('Onboarding');
                    }
                }
            ]
        );
    };

    const renderMedicineItem = ({ item }) => (
        <View style={styles.medicineCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{item.name} <Text style={styles.medType}>({item.type})</Text></Text>
                <Text style={styles.medDetails}>{item.dosage} | {item.frequency} | {item.duration}</Text>
                {item.notes ? <Text style={styles.medNotes}>Note: {item.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => removeMedicine(item.id)}>
                <Text style={{ color: COLORS.danger }}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>New Prescription</Text>
                        <TouchableOpacity onPress={handleReset}>
                            <Text style={{ color: COLORS.danger }}>Reset App</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Patient Details Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Patient Details</Text>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={patientName}
                                    onChangeText={setPatientName}
                                    placeholder="Patient Name"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Age"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Sex (M/F/O)</Text>
                            <TextInput
                                style={styles.input}
                                value={sex}
                                onChangeText={setSex}
                                placeholder="Sex"
                            />
                        </View>
                    </View>

                    {/* Medical Vitals Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Medical Vitals</Text>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Temp (°F)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={temperature}
                                    onChangeText={setTemperature}
                                    placeholder="98.6"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>BP (mmHg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bp}
                                    onChangeText={setBP}
                                    placeholder="120/80"
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="70"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Pulse (bpm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={pulse}
                                    onChangeText={setPulse}
                                    placeholder="72"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Medicine Entry Section */}
                    <View style={[styles.section, { zIndex: 100 }]}>
                        <Text style={styles.sectionTitle}>Prescription</Text>
                        <MedicineAutocomplete onAddMedicine={addMedicine} />

                        <View style={{ marginTop: 15 }}>
                            {medicines.map((item) => (
                                <View key={item.id} style={{ marginBottom: 10 }}>
                                    {renderMedicineItem({ item })}
                                </View>
                            ))}
                            {medicines.length === 0 && (
                                <Text style={{ color: COLORS.secondary, textAlign: 'center', marginTop: 10 }}>No medicines added yet.</Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                        <Text style={styles.analyzeButtonText}>Analyze Prescription</Text>
                    </TouchableOpacity>

                </ScrollView>
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
        paddingBottom: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.padding,
    },
    title: {
        fontSize: SIZES.h1,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    section: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        marginBottom: SIZES.padding,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
        marginBottom: SIZES.padding,
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: SIZES.small,
        color: COLORS.secondary,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.borderRadius,
        padding: 10,
        fontSize: SIZES.body,
        backgroundColor: COLORS.light,
    },
    analyzeButton: {
        backgroundColor: COLORS.success,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        alignItems: 'center',
        marginTop: SIZES.padding,
    },
    analyzeButtonText: {
        color: COLORS.white,
        fontSize: SIZES.h3,
        fontWeight: 'bold',
    },
    medicineCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 10,
        borderRadius: SIZES.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    medName: {
        fontWeight: 'bold',
        fontSize: SIZES.body,
        color: COLORS.text,
    },
    medType: {
        fontWeight: 'normal',
        fontSize: SIZES.small,
        color: COLORS.secondary,
    },
    medDetails: {
        fontSize: SIZES.small,
        color: COLORS.secondary,
        marginTop: 2
    },
    medNotes: {
        fontSize: 10,
        color: COLORS.info,
        marginTop: 2,
        fontStyle: 'italic'
    }
});

export default PrescriptionScreen;
