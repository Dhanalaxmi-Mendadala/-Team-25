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
    StatusBar,
    LayoutAnimation
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { z } from 'zod';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import MedicineAutocomplete from '../components/MedicineAutocomplete';

// --- Validation Schema ---
const prescriptionSchema = z.object({
    patientName: z.string().min(2, "Name is too short"),
    age: z.coerce.number().min(0, "Invalid Age").max(120, "Invalid Age"),
    sex: z.enum(["Male", "Female", "Other"], { errorMap: () => ({ message: "Select Gender" }) }),
    temperature: z.coerce.number().min(90, "Unusual Temp").max(110, "Unusual Temp").optional().or(z.literal('')),
    bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: 120/80").optional().or(z.literal('')),
    weight: z.coerce.number().min(1, "Invalid Weight").max(300, "Invalid Weight").optional().or(z.literal('')),
    pulse: z.coerce.number().min(30, "Invalid Pulse").max(200, "Invalid Pulse").optional().or(z.literal('')),
    diagnosis: z.string().optional(),
});

const InputWithIcon = ({ label, icon, error, ...props }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, error && styles.inputError]}>
            <MaterialCommunityIcons name={icon} size={20} color={COLORS.secondary} style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholderTextColor={COLORS.muted}
                {...props}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const PrescriptionScreen = ({ navigation }) => {
    // Form State
    const [form, setForm] = useState({
        patientName: '',
        age: '',
        sex: '',
        temperature: '',
        bp: '',
        weight: '',
        pulse: '',
        diagnosis: ''
    });

    const [medicines, setMedicines] = useState([]);
    const [errors, setErrors] = useState({});

    // Collapsible State
    const [isPatientCollapsed, setIsPatientCollapsed] = useState(false);
    const [isVitalsCollapsed, setIsVitalsCollapsed] = useState(false);

    // Track if we have already auto-collapsed to avoid fighting the user
    const hasAutoCollapsedPatient = React.useRef(false);
    const hasAutoCollapsedVitals = React.useRef(false);

    // Auto-collapse Patient Info
    React.useEffect(() => {
        const isPatientComplete = form.patientName && form.age && form.sex;
        if (isPatientComplete && !hasAutoCollapsedPatient.current) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsPatientCollapsed(true);
            hasAutoCollapsedPatient.current = true;
        }
    }, [form.patientName, form.age, form.sex]);

    // Auto-collapse Vitals
    React.useEffect(() => {
        // Vitals are technically optional, but we collapse if the main ones are filled
        // Or if the user enters a specific set. Let's use a "completeness" check.
        // If at least 3 fields are filled, we can consider it "fully entered" enough for auto-collapse?
        // Or strictly if ALL 4 are filled. The user said "fully entered". Let's assume all 4 for now.
        const isVitalsComplete = form.bp && form.temperature && form.weight && form.pulse;
        if (isVitalsComplete && !hasAutoCollapsedVitals.current) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsVitalsCollapsed(true);
            hasAutoCollapsedVitals.current = true;
        }
    }, [form.bp, form.temperature, form.weight, form.pulse]);

    const togglePatient = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPatientCollapsed(!isPatientCollapsed);
    };

    const toggleVitals = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsVitalsCollapsed(!isVitalsCollapsed);
    };

    // Handlers
    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear error when typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const addMedicine = (med) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMedicines([...medicines, { ...med, id: Date.now().toString() }]);
    };

    const removeMedicine = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMedicines(medicines.filter(m => m.id !== id));
    };

    const handleReset = () => {
        Alert.alert(
            "Clear Data",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        setForm({
                            patientName: '', age: '', sex: '',
                            temperature: '', bp: '', weight: '', pulse: '',
                            diagnosis: ''
                        });
                        setMedicines([]);
                        setErrors({});
                    }
                }
            ]
        );
    };

    const handleAnalyze = () => {
        // 1. Zod Validation
        const result = prescriptionSchema.safeParse(form);

        if (!result.success) {
            const fieldErrors = {};
            // Use issues or errors depending on Zod version/environment
            const zodErrors = result.error.issues || result.error.errors || [];

            let hasPatientError = false;
            let hasVitalsError = false;

            zodErrors.forEach(err => {
                const path = err.path[0];
                if (path) {
                    fieldErrors[path] = err.message;

                    // Check which section this error belongs to
                    if (['patientName', 'age', 'sex'].includes(path)) {
                        hasPatientError = true;
                    }
                    if (['temperature', 'bp', 'weight', 'pulse'].includes(path)) {
                        hasVitalsError = true;
                    }
                }
            });

            setErrors(fieldErrors);

            // Auto-expand sections with errors
            if (hasPatientError) {
                setIsPatientCollapsed(false);
            }
            if (hasVitalsError) {
                setIsVitalsCollapsed(false);
            }

            // Layout animation for smooth expansion
            if (hasPatientError || hasVitalsError) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }

            Alert.alert("Validation Error", "Please check the highlighted fields.");
            return;
        }

        // 2. Medicine Validation
        if (medicines.length === 0) {
            Alert.alert('No Medicines', 'Please add at least one medicine.');
            return;
        }

        // 3. Navigation
        const prescriptionData = {
            patient: { name: form.patientName, age: form.age, sex: form.sex },
            vitals: {
                temperature: form.temperature,
                bp: form.bp,
                weight: form.weight,
                pulse: form.pulse
            },
            diagnosis: form.diagnosis,
            medicines
        };

        navigation.navigate('Analysis', { data: prescriptionData });
    };

    const renderMedicineItem = ({ item }) => (
        <View style={styles.medicineCard}>
            <View style={styles.medIcon}>
                <MaterialCommunityIcons name="pill" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medDetails}>{item.frequency} • {item.duration}</Text>
                {item.notes ? <Text style={styles.medNotes}>📝 {item.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => removeMedicine(item.id)} style={styles.deleteButton}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={COLORS.muted} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.subtitle}>CONSULTATION CONFIG</Text>
                            <Text style={styles.title}>New Prescription</Text>
                        </View>
                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Patient Info Card */}
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.cardHeaderRow} onPress={togglePatient} activeOpacity={0.7}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                                <MaterialCommunityIcons name="account-details" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Patient Details</Text>
                            </View>
                            {isPatientCollapsed && (
                                <Text style={styles.summaryText} numberOfLines={1}>
                                    {form.patientName}, {form.age} {form.sex === 'Male' ? 'M' : form.sex === 'Female' ? 'F' : form.sex}
                                </Text>
                            )}
                            <MaterialCommunityIcons
                                name={isPatientCollapsed ? "chevron-down" : "chevron-up"}
                                size={24}
                                color={COLORS.secondary}
                            />
                        </TouchableOpacity>

                        {!isPatientCollapsed && (
                            <View>
                                <View style={styles.row}>
                                    <View style={{ flex: 2, marginRight: 10 }}>
                                        <InputWithIcon
                                            label="Full Name"
                                            icon="account"
                                            placeholder="John Doe"
                                            value={form.patientName}
                                            onChangeText={(t) => handleChange('patientName', t)}
                                            error={errors.patientName}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <InputWithIcon
                                            label="Age"
                                            icon="calendar-account"
                                            placeholder="Yrs"
                                            keyboardType="numeric"
                                            value={form.age}
                                            onChangeText={(t) => handleChange('age', t)}
                                            error={errors.age}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={[styles.genderRow, errors.sex && { borderColor: COLORS.danger, borderWidth: 1, borderRadius: 8, padding: 4 }]}>
                                        {['Male', 'Female', 'Other'].map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={[styles.genderChip, form.sex === option && styles.genderChipActive]}
                                                onPress={() => handleChange('sex', option)}
                                            >
                                                <MaterialCommunityIcons
                                                    name={option === 'Male' ? 'gender-male' : option === 'Female' ? 'gender-female' : 'gender-transgender'}
                                                    size={16}
                                                    color={form.sex === option ? COLORS.white : COLORS.secondary}
                                                    style={{ marginRight: 5 }}
                                                />
                                                <Text style={[styles.genderText, form.sex === option && styles.genderTextActive]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Vitals Card */}
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.cardHeaderRow} onPress={toggleVitals} activeOpacity={0.7}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                                <MaterialCommunityIcons name="heart-pulse" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Vitals</Text>
                            </View>
                            {isVitalsCollapsed && (
                                <Text style={styles.summaryText} numberOfLines={1}>
                                    {form.bp || '-'} • {form.temperature ? `${form.temperature}°` : '-'} • {form.weight ? `${form.weight}kg` : '-'}
                                </Text>
                            )}
                            <MaterialCommunityIcons
                                name={isVitalsCollapsed ? "chevron-down" : "chevron-up"}
                                size={24}
                                color={COLORS.secondary}
                            />
                        </TouchableOpacity>

                        {!isVitalsCollapsed && (
                            <View>
                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <InputWithIcon label="BP" icon="gauge" placeholder="120/80" value={form.bp} onChangeText={(t) => handleChange('bp', t)} error={errors.bp} />
                                    </View>
                                    <View style={styles.gridItem}>
                                        <InputWithIcon label="Temp (°F)" icon="thermometer" placeholder="98.6" keyboardType="numeric" value={form.temperature} onChangeText={(t) => handleChange('temperature', t)} error={errors.temperature} />
                                    </View>
                                </View>
                                <View style={[styles.gridRow, { marginTop: 10 }]}>
                                    <View style={styles.gridItem}>
                                        <InputWithIcon label="Weight (kg)" icon="weight-kilogram" placeholder="70" keyboardType="numeric" value={form.weight} onChangeText={(t) => handleChange('weight', t)} error={errors.weight} />
                                    </View>
                                    <View style={styles.gridItem}>
                                        <InputWithIcon label="Pulse (bpm)" icon="heart-flash" placeholder="72" keyboardType="numeric" value={form.pulse} onChangeText={(t) => handleChange('pulse', t)} error={errors.pulse} />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Diagnosis Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Diagnosis Notes</Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="stethoscope" size={20} color={COLORS.secondary} style={[styles.inputIcon, { marginTop: 12 }]} />
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Enter diagnosis or clinical notes..."
                                placeholderTextColor={COLORS.muted}
                                multiline
                                numberOfLines={3}
                                value={form.diagnosis}
                                onChangeText={(t) => handleChange('diagnosis', t)}
                            />
                        </View>
                    </View>

                    {/* Prescription Section */}
                    <View style={styles.prescriptionSection}>
                        <View style={styles.cardHeaderRow}>
                            <MaterialCommunityIcons name="prescription" size={20} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Rx / Medicines</Text>
                        </View>

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

                {/* Floating Action Button */}
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                        <MaterialCommunityIcons name="robot-outline" size={24} color={COLORS.white} />
                        <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
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
        flexGrow: 1,
        padding: SIZES.padding,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    resetButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFE5E5',
        borderRadius: 20
    },
    resetButtonText: {
        color: COLORS.danger,
        fontWeight: '600',
        fontSize: 12
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        ...SHADOWS.light,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8, // Added padding to separate from content if expanded
        justifyContent: 'space-between'
    },
    summaryText: {
        fontSize: 12,
        color: COLORS.secondary,
        marginRight: 10,
        maxWidth: '50%',
        textAlign: 'right'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        marginTop: 5 // Added overlap adjustment
    },
    inputContainer: {
        marginBottom: 15
    },
    label: {
        fontSize: 12,
        color: COLORS.secondary,
        marginBottom: 6,
        fontWeight: '600'
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.danger,
        backgroundColor: '#FFF5F5'
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 11,
        marginTop: 4,
        marginLeft: 2
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5
    },
    genderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
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
        fontWeight: '500',
        fontSize: 13
    },
    genderTextActive: {
        color: COLORS.white
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15
    },
    gridItem: {
        flex: 1
    },
    prescriptionSection: {
        marginBottom: 20
    },
    medicineList: {
        marginTop: 5
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
        fontSize: 13,
        color: COLORS.secondary,
        marginTop: 2
    },
    medNotes: {
        fontSize: 12,
        color: COLORS.info,
        marginTop: 4,
        fontStyle: 'italic'
    },
    deleteButton: {
        padding: 5,
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
        paddingVertical: 16,
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
