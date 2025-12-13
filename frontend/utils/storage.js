import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    USER_PROFILE: 'user_profile',
    PRESCRIPTIONS: 'prescriptions',
};

// Save user profile data (Clinic/Doctor details)
export const saveUserProfile = async (profileData) => {
    try {
        const jsonValue = JSON.stringify(profileData);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, jsonValue);
        return true;
    } catch (e) {
        console.error('Error saving user profile:', e);
        return false;
    }
};

// Get user profile data
export const getUserProfile = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error reading user profile:', e);
        return null;
    }
};

// Check if user is onboarded
export const isUserOnboarded = async () => {
    const profile = await getUserProfile();
    return profile !== null;
};

// Save a new prescription
export const savePrescription = async (prescription) => {
    try {
        const existingPrescriptions = await getPrescriptions();
        const updatedPrescriptions = [...existingPrescriptions, { ...prescription, id: Date.now().toString(), date: new Date().toISOString() }];
        const jsonValue = JSON.stringify(updatedPrescriptions);
        await AsyncStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, jsonValue);
        return true;
    } catch (e) {
        console.error('Error saving prescription:', e);
        return false;
    }
};

// Get all prescriptions
export const getPrescriptions = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error getting prescriptions:', e);
        return [];
    }
};

// Clear all data (Dev utility)
export const clearAllData = async () => {
    try {
        await AsyncStorage.clear();
    } catch (e) {
        console.error('Error clearing data:', e);
    }
};
