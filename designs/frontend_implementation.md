Implementation Plan - Medical Prescription App
Goal Description
Develop a React Native mobile application for doctors to manage prescriptions. Key features include a one-time setup for clinic details, a prescription entry interface with offline AI-assisted medicine autocomplete, and a prescription analysis tool to score safety and completeness.

User Review Required
IMPORTANT

Dataset: The app requires a "Kaggle medicine dataset". I will currently use a small mock JSON list of medicines for development. The actual dataset integration will need to be handled when the file is provided. AI/RAG: "Local embeddings for offline RAG support" is computationally intensive for a basic React Native app without native modules. I will implement a robust keyword-based search (Fuzzy Search) initially which is performant and works offline. True RAG with embeddings would require react-native-fast-tflite or similar and model files.

Proposed Changes
Tech Stack
Framework: React Native (via Expo)
Navigation: React Navigation (Stack)
Storage: AsyncStorage (for simple key-value/JSON clinic data) or Expo SQLite (if structured queries are needed, likely start with AsyncStorage for simplicity unless relational data is complex).
Styling: StyleSheet / Standard React Native styling.
Search: fuse.js or similar for offline fuzzy search of medicine names.
Validation: zod or simple JS validation.
Architecture
Directory Structure
frontend/
  app/                 # Expo Router or Screens
  components/          # Reusable UI components
  constants/           # Colors, Layout, Mock Data
  hooks/               # Custom hooks (usePrescription, etc.)
  utils/               # Helper functions (analysis logic, storage)
  assets/              # Images, Fonts
1. Initial Setup
Screen: SetupScreen
Fields: Doctor Name, Clinic Name, Address, Contact, Logo (ImagePicker).
Logic: On app start, check AsyncStorage for user_profile. If missing, show SetupScreen. If present, navigate to PrescriptionScreen.
2. Prescription Page
Screen: PrescriptionScreen
State: Manage form state for Patient and Medical Vitals.
Validation: Ensure numbers for stats (BP, Weight), non-empty for Name.
3. Prescription Entry (AI-Assisted)
Component: MedicineAutocomplete
Data Source: Load medicines.json (placeholder).
Logic: Filter list based on input text using fuzzy matching.
Fields: Medicine Name, Dosage, Frequency, Duration. FlatList to show added medicines.
4. Prescription Analysis
Screen: AnalysisScreen
Logic:
Formatting: Convert current form state + medicine list into a JSON object.
Guardrails:
Check if frequency or dosage is missing.
Check if medicine name exists in the known dataset.
Scoring: Calculate a score (0-100) based on filled fields and lack of "unknown" medicines.
Display result with a clean UI.
Verification Plan
Manual Verification
Setup Flow: clear storage, launch app, fill setup, restart app -> should go straight to Prescription.
Autocomplete: Type "Para" -> should suggest "Paracetamol".
Analysis: Add a medicine without dosage -> Click Analyze -> Should see warning/lower score.
Medical Prescription App - Task List
1. Project Initialization
 Initialize React Native (Expo) project
 Set up project structure (screens, components, utils, assets)
 Install necessary dependencies (navigation, storage, UI library)
2. Initial Setup (One-Time Input)
 Create OnboardingScreen for Doctor/Clinic details
 Implement Local Storage (AsyncStorage/SQLite) for user profile
 Implement logic to check if setup is complete on app launch
3. Prescription Page
 Create PrescriptionScreen UI
 Implement Patient Info inputs (Name, Age, Sex)
 Implement Medical Info inputs (Temp, BP, Weight, Pulse)
 Add validation for required fields
4. Prescription Entry (AI-Assisted)
 Create MedicineInput component with Autocomplete
 Integrate Medicine Dataset (Mock/Placeholder initially)
 Implement offline search/suggestion logic (RAG placeholder)
 Add fields for Dosage, Frequency, Duration, Notes
5. Prescription Analysis
 Create AnalysisScreen UI
 Implement "Analyze" button logic
 Implement prescription converting to structured format
 Implement basic guardrails (Missing info, Unknown meds)
 Compute and display Prescription Score
6. Verification & Polish
 Verify navigation flows
 Test offline capabilities
 Polish UI/UX (Styles, Animations)