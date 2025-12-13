import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { saveUserProfile } from '../utils/storage';

const OnboardingScreen = ({ navigation }) => {
    const [doctorName, setDoctorName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [clinicAddress, setClinicAddress] = useState('');
    const [contactInfo, setContactInfo] = useState('');

    const handleSave = async () => {
        if (!doctorName || !clinicName) {
            Alert.alert('Missing Information', 'Please fill in at least the Doctor Name and Clinic Name.');
            return;
        }

        const profile = {
            doctorName,
            clinicName,
            clinicAddress,
            contactInfo,
        };

        const success = await saveUserProfile(profile);

        if (success) {
            navigation.replace('Prescription');
        } else {
            Alert.alert('Error', 'Failed to save details. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome, Doctor</Text>
                        <Text style={styles.subtitle}>Let's set up your clinic profile.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Doctor Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Dr. John Doe"
                                value={doctorName}
                                onChangeText={setDoctorName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Clinic Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="City Health Clinic"
                                value={clinicName}
                                onChangeText={setClinicName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Clinic Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="123 Wellness Ave, Medtown"
                                value={clinicAddress}
                                onChangeText={setClinicAddress}
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contact Info</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                value={contactInfo}
                                onChangeText={setContactInfo}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleSave}>
                            <Text style={styles.buttonText}>Get Started</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SIZES.padding * 1.5,
    },
    header: {
        marginBottom: SIZES.padding * 2,
        marginTop: SIZES.padding,
    },
    title: {
        fontSize: SIZES.h1,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SIZES.padding / 2,
    },
    subtitle: {
        fontSize: SIZES.body,
        color: COLORS.secondary,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: SIZES.padding * 1.5,
    },
    label: {
        fontSize: SIZES.body,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        fontSize: SIZES.body,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
        alignItems: 'center',
        marginTop: SIZES.padding,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: SIZES.h3,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;
