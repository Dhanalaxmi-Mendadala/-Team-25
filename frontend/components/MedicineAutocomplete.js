import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    Platform
} from 'react-native';
import Fuse from 'fuse.js';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { MEDICINES_DATA } from '../constants/medicines';

const MedicineAutocomplete = ({ onAddMedicine }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Selected medicine details
    const [selectedMed, setSelectedMed] = useState(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');

    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(MEDICINES_DATA, {
        keys: ['name'],
        threshold: 0.3,
    });

    const handleSearch = (text) => {
        setQuery(text);
        if (text.length > 1) {
            const results = fuse.search(text);
            setSuggestions(results.map(result => result.item));
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectMedicine = (med) => {
        setSelectedMed(med);
        setQuery(med.name);
        setSuggestions([]);
        setShowModal(true); // Open modal to add details
    };

    const handleConfirmAdd = () => {
        if (selectedMed) {
            onAddMedicine({
                ...selectedMed,
                dosage,
                frequency,
                duration,
                notes
            });
            // Reset
            setQuery('');
            setSelectedMed(null);
            setDosage('');
            setFrequency('');
            setDuration('');
            setNotes('');
            setShowModal(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchWrapper}>
                <MaterialCommunityIcons name="pill" size={20} color={COLORS.secondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search medicine (e.g. Paracetamol)..."
                    placeholderTextColor={COLORS.muted}
                    value={query}
                    onChangeText={handleSearch}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
                        <MaterialCommunityIcons name="close" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {suggestions.length > 0 && (
                <View style={styles.suggestionsList}>
                    {suggestions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectMedicine(item)}
                        >
                            <View style={styles.suggestionIcon}>
                                <MaterialCommunityIcons name="medical-bag" size={16} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.suggestionText}>{item.name}</Text>
                                <Text style={styles.suggestionType}>{item.type}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Modal for Dosage Details */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <MaterialCommunityIcons name="pill" size={28} color={COLORS.primary} />
                            <Text style={styles.modalTitle}>{selectedMed?.name}</Text>
                        </View>
                        <Text style={styles.modalSubtitle}>Enter Dosage Details</Text>

                        <View style={styles.modalInputWrapper}>
                            <MaterialCommunityIcons name="needle" size={20} color={COLORS.secondary} style={styles.modalInputIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Dosage (e.g. 500mg)"
                                placeholderTextColor={COLORS.muted}
                                value={dosage}
                                onChangeText={setDosage}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.modalInputWrapper, { flex: 1, marginRight: 10 }]}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.secondary} style={styles.modalInputIcon} />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Freq (1-0-1)"
                                    placeholderTextColor={COLORS.muted}
                                    value={frequency}
                                    onChangeText={setFrequency}
                                />
                            </View>
                            <View style={[styles.modalInputWrapper, { flex: 1 }]}>
                                <MaterialCommunityIcons name="calendar-range" size={20} color={COLORS.secondary} style={styles.modalInputIcon} />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Days (5)"
                                    placeholderTextColor={COLORS.muted}
                                    value={duration}
                                    onChangeText={setDuration}
                                />
                            </View>
                        </View>

                        <View style={styles.modalInputWrapper}>
                            <MaterialCommunityIcons name="note-text-outline" size={20} color={COLORS.secondary} style={styles.modalInputIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Notes (e.g. After food)"
                                placeholderTextColor={COLORS.muted}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowModal(false)}>
                                <Text style={[styles.btnText, { color: COLORS.secondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.addBtn]} onPress={handleConfirmAdd}>
                                <Text style={styles.btnText}>Add Medicine</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 10,
        marginBottom: 10
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 2
    },
    searchIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 10
    },
    suggestionsList: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        ...SHADOWS.medium,
        zIndex: 20,
        maxHeight: 200,
        paddingVertical: 5
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.light,
    },
    suggestionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    suggestionText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text
    },
    suggestionType: {
        fontSize: 12,
        color: COLORS.secondary
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.medium
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        gap: 10
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        marginBottom: 20
    },
    row: {
        flexDirection: 'row',
        marginBottom: 15
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        marginBottom: 15
    },
    modalInputIcon: {
        marginRight: 10
    },
    modalInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: COLORS.light,
    },
    addBtn: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.small
    },
    btnText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.white
    }
});

export default MedicineAutocomplete;
