import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal
} from 'react-native';
import Fuse from 'fuse.js';
import { COLORS, SIZES } from '../constants/theme';
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
            <Text style={styles.label}>Add Medicine</Text>
            <TextInput
                style={styles.input}
                placeholder="Type medicine name (e.g. Paracetamol)..."
                value={query}
                onChangeText={handleSearch}
            />

            {suggestions.length > 0 && (
                <View style={styles.suggestionsList}>
                    {suggestions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectMedicine(item)}
                        >
                            <Text>{item.name} <Text style={{ fontSize: 10, color: '#888' }}>({item.type})</Text></Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Modal for Dosage Details */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedMed?.name}</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Dosage (e.g. 500mg)"
                            value={dosage}
                            onChangeText={setDosage}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Frequency (e.g. 1-0-1)"
                            value={frequency}
                            onChangeText={setFrequency}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Duration (e.g. 3 days)"
                            value={duration}
                            onChangeText={setDuration}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Notes (e.g. After food)"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.secondary }]} onPress={() => setShowModal(false)}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={handleConfirmAdd}>
                                <Text style={styles.btnText}>Add</Text>
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
        zIndex: 10, // Ensure suggestions float on top
    },
    label: {
        fontSize: SIZES.small,
        color: COLORS.secondary,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: SIZES.borderRadius,
        padding: 10,
        backgroundColor: COLORS.white,
    },
    suggestionsList: {
        position: 'absolute',
        top: 65,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.borderRadius,
        elevation: 5,
        zIndex: 20,
        maxHeight: 150,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.light,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SIZES.padding,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.borderRadius,
    },
    modalTitle: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        marginBottom: SIZES.padding,
        color: COLORS.primary,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.borderRadius,
        padding: 10,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: SIZES.borderRadius,
        marginLeft: 10,
    },
    btnText: {
        color: COLORS.white,
        fontWeight: 'bold',
    }

});

export default MedicineAutocomplete;
