import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    LayoutAnimation,
    Platform,
    Keyboard
} from 'react-native';
import Fuse from 'fuse.js';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { MEDICINES_DATA } from '../constants/medicines';
import { COMMON_DOSAGES, COMMON_FREQUENCIES, COMMON_DURATIONS, COMMON_INSTRUCTIONS } from '../constants/commonOptions';
import { API_BASE_URL } from '../constants/config';

const MedicineAutocomplete = ({ onAddMedicine }) => {
    // Search State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Entry Mode State (when a medicine is selected)
    const [selectedMed, setSelectedMed] = useState(null);
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('5'); // Default 5 days
    const [durationUnit, setDurationUnit] = useState('Days'); // Days | Weeks
    const [notes, setNotes] = useState('');

    const inputRef = useRef(null);

    // Configure Fuse.js
    const fuse = new Fuse(MEDICINES_DATA, {
        keys: ['name'],
        threshold: 0.3,
    });

    // Handle Search Text
    const handleSearch = async (text) => {
        setQuery(text);

        if (selectedMed) {
            resetEntry();
        }

        if (text.length > 1) {
            setIsSearching(true);
            try {
                // Try fetching from API first
                const response = await fetch(`${API_BASE_URL}/api/medicines/search?q=${encodeURIComponent(text)}`);
                if (response.ok) {
                    const apiResults = await response.json();

                    if (apiResults.length > 0) {
                        // Map API results to our format
                        const mappedResults = apiResults.map((item, index) => ({
                            id: `api_${index}_${item.name}`,
                            name: item.name,
                            type: item.category || 'Medicine',
                            // Add metadata for display
                            manufacturer: item.manufacturer,
                            category: item.category,
                            strength: item.strength
                        }));
                        setSuggestions(mappedResults);
                    } else {
                        // Fallback to local Fuse search if API returns nothing (or mix them?)
                        // For now, let's just use local if API is empty, or just show empty.
                        // Actually, falling back to local is good for offline or unlisted common meds.
                        const fuseResults = fuse.search(text).slice(0, 5).map(r => r.item);
                        setSuggestions(fuseResults);
                    }
                } else {
                    // API fail, fallback to local
                    const fuseResults = fuse.search(text).slice(0, 5).map(r => r.item);
                    setSuggestions(fuseResults);
                }
            } catch (error) {
                console.log("Search error", error);
                // Fallback to local on error
                const fuseResults = fuse.search(text).slice(0, 5).map(r => r.item);
                setSuggestions(fuseResults);
            }
        } else {
            setSuggestions([]);
            setIsSearching(false);
        }
    };

    // Select a Medicine
    const handleSelectMedicine = (med) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedMed(med);
        setQuery(med.name); // Set input to name
        setSuggestions([]); // Hide suggestions
        setIsSearching(false);
        Keyboard.dismiss();
    };

    // Clear everything
    const resetEntry = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedMed(null);
        setQuery('');
        setSuggestions([]);
        setFrequency('');
        setDuration('5');
        setNotes('');
        setIsSearching(false);
    };

    const handleAdd = () => {
        if (!selectedMed) return;

        // Basic validation
        if (!frequency) {
            // Just let them add partial info for flexibility
        }

        const finalDuration = duration ? `${duration} ${durationUnit}` : '';

        onAddMedicine({
            ...selectedMed,
            frequency: frequency || 'SOS',
            duration: finalDuration,
            notes
        });
        resetEntry();
    };

    // Render Components
    return (
        <View style={styles.container}>
            {/* 1. Search Bar */}
            <View style={[styles.searchWrapper, selectedMed && styles.searchWrapperActive]}>
                <MaterialCommunityIcons
                    name={selectedMed ? "check-circle" : "magnify"}
                    size={22}
                    color={selectedMed ? COLORS.primary : COLORS.secondary}
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Search medicine (e.g. Dolo)..."
                    placeholderTextColor={COLORS.muted}
                    value={query}
                    onChangeText={handleSearch}
                />
                {(query.length > 0 || selectedMed) && (
                    <TouchableOpacity onPress={resetEntry}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* 2. Suggestions List (Absolute or Inline) */}
            {suggestions.length > 0 && isSearching && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectMedicine(item)}
                        >
                            <View style={styles.suggestionIconWrapper}>
                                <MaterialCommunityIcons name={item.type === 'Syrup' ? 'bottle-tonic' : 'pill'} size={16} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.suggestionText}>{item.name}</Text>
                                <Text style={styles.suggestionType} numberOfLines={1}>
                                    {item.manufacturer || item.category || item.type}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {/* Allow adding custom medicine if not found */}
                    <TouchableOpacity
                        style={[styles.suggestionItem, { borderBottomWidth: 0 }]}
                        onPress={() => handleSelectMedicine({ id: Date.now().toString(), name: query, type: 'Custom' })}
                    >
                        <View style={[styles.suggestionIconWrapper, { backgroundColor: COLORS.light }]}>
                            <MaterialCommunityIcons name="plus" size={16} color={COLORS.dark} />
                        </View>
                        <Text style={styles.suggestionText}>Add "{query}" as new</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 3. Expanded Entry Card (Visible only when medicine selected) */}
            {selectedMed && (
                <View style={styles.entryCard}>
                    {/* Frequency Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Frequency</Text>
                        <View style={styles.freqGrid}>
                            {COMMON_FREQUENCIES.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                                    onPress={() => setFrequency(f)}
                                >
                                    <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Duration & Notes Row */}
                    <View style={[styles.row, { gap: 10 }]}>
                        {/* Duration Stepper */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>Duration</Text>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity onPress={() => setDuration(prev => Math.max(1, parseInt(prev || 0) - 1).toString())} style={styles.stepBtn}>
                                    <MaterialCommunityIcons name="minus" size={16} color={COLORS.dark} />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.durationInput}
                                    value={duration}
                                    keyboardType="numeric"
                                    onChangeText={setDuration}
                                />
                                <TouchableOpacity onPress={() => setDuration(prev => (parseInt(prev || 0) + 1).toString())} style={styles.stepBtn}>
                                    <MaterialCommunityIcons name="plus" size={16} color={COLORS.dark} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.unitToggle}
                                    onPress={() => setDurationUnit(prev => prev === 'Days' ? 'Weeks' : 'Days')}
                                >
                                    <Text style={styles.unitText}>{durationUnit}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Instruction Chips - simplified to drop down or scroll? lets do horizontal scroll notes */}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Instructions</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                            {COMMON_INSTRUCTIONS.map(ins => (
                                <TouchableOpacity
                                    key={ins}
                                    style={[styles.chip, notes === ins && styles.chipActive]}
                                    onPress={() => setNotes(ins)}
                                >
                                    <Text style={[styles.chipText, notes === ins && styles.chipTextActive]}>{ins}</Text>
                                </TouchableOpacity>
                            ))}
                            <TextInput
                                style={[styles.chipInput, { minWidth: 100, marginLeft: 5 }]}
                                placeholder="Type note..."
                                value={COMMON_INSTRUCTIONS.includes(notes) ? '' : notes}
                                onChangeText={setNotes}
                            />
                        </ScrollView>
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                        <Text style={styles.addButtonText}>ADD MEDICINE</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        zIndex: 10
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Taller touch target
        ...SHADOWS.small
    },
    searchWrapperActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#F0F7FF'
    },
    searchIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        height: 40 // explicit height
    },
    suggestionsContainer: {
        backgroundColor: COLORS.white,
        marginTop: 5,
        borderRadius: 12,
        ...SHADOWS.medium,
        maxHeight: 250,
        overflow: 'hidden'
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.light
    },
    suggestionIconWrapper: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    suggestionText: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.text
    },
    suggestionType: {
        fontSize: 11,
        color: COLORS.secondary
    },
    // Entry Card Styles
    entryCard: {
        marginTop: 10,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: COLORS.light,
        ...SHADOWS.light
    },
    section: {
        marginBottom: 12
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.secondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    chipsScroll: {
        gap: 8,
        paddingRight: 10
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: COLORS.light,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    chipText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500'
    },
    chipTextActive: {
        color: COLORS.white
    },
    inputChip: {
        paddingVertical: 0, // Reset for input
        minWidth: 80,
        justifyContent: 'center'
    },
    chipInput: {
        fontSize: 13,
        color: COLORS.text,
        paddingVertical: 4,
        paddingHorizontal: 5
    },
    freqGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    freqBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: COLORS.light,
        borderWidth: 1,
        borderColor: 'transparent',
        minWidth: '22%',
        alignItems: 'center'
    },
    freqBtnActive: {
        backgroundColor: '#E6F0FF',
        borderColor: COLORS.primary
    },
    freqText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text
    },
    freqTextActive: {
        color: COLORS.primary
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        borderRadius: 8,
        padding: 4
    },
    stepBtn: {
        padding: 8,
        backgroundColor: COLORS.white,
        borderRadius: 6,
        ...SHADOWS.small
    },
    durationInput: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text
    },
    unitToggle: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.secondary,
        borderRadius: 6,
        marginLeft: 5
    },
    unitText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: 'bold'
    },
    addButton: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        ...SHADOWS.medium
    },
    addButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default MedicineAutocomplete;
