import { AuthGuard } from "@/components/AuthGuard";
import ExercisePicker from "@/components/ExercisePicker";
import { useSupabaseSession } from "@/context/SupabaseProvider";
import { Exercise, supabase } from "@/lib/supabase";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Search,
  Target,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  Weight,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  resistanceValue: string;
  isBodyWeight: boolean;
  isRepRange: boolean;
  repsMin: string;
  repsMax: string;
  isCollapsed: boolean;
}

export default function CreateWorkoutTab() {
  const session = useSupabaseSession();

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const addExercise = (exercise: Exercise) => {
    console.log("Adding exercise...");
    const newExercise: WorkoutExercise = {
      id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: "",
      resistanceValue: "",
      isBodyWeight: false,
      isRepRange: false,
      repsMin: "",
      repsMax: "",
      isCollapsed: false,
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const toggleExerciseCollapse = (exerciseId: string) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return { ...exercise, isCollapsed: !exercise.isCollapsed };
        }
        return exercise;
      })
    );
  };

  const updateExercise = (
    exerciseId: string,
    field: keyof WorkoutExercise,
    value: any
  ) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return { ...exercise, [field]: value };
        }
        return exercise;
      })
    );
  };

  const toggleBodyWeight = (exerciseId: string) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            isBodyWeight: !exercise.isBodyWeight,
            weight: !exercise.isBodyWeight ? "" : exercise.resistanceValue,
          };
        }
        return exercise;
      })
    );
  };

  const toggleRepRange = (exerciseId: string) => {
    setExercises(
      exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            isRepRange: !exercise.isRepRange,
            reps: !exercise.isRepRange ? "" : exercise.reps,
            repsMin: !exercise.isRepRange ? exercise.reps : "",
            repsMax: !exercise.isRepRange ? "" : "",
          };
        }
        return exercise;
      })
    );
  };

  const getRepDisplay = (exercise: WorkoutExercise) => {
    if (exercise.isRepRange) {
      const min = exercise.repsMin || "—";
      const max = exercise.repsMax || "—";
      return `${min}-${max}`;
    }
    return exercise.reps || "—";
  };

  const getExerciseSummary = (exercise: WorkoutExercise) => {
    const reps = getRepDisplay(exercise);
    const weight = exercise.isBodyWeight
      ? "BW"
      : exercise.resistanceValue || "—";
    return `${exercise.sets} sets × ${reps} × ${weight}`;
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return;
    }

    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: session?.user.id, name: workoutName })
      .select()
      .single();

    if (error || !workout) {
      Alert.alert("Error", "Failed to save workout");
      return;
    }

    const exercisePayload = exercises.map((exercise, idx) => ({
      workout_id: workout.id,
      exercise_id: exercise.id,
      position: idx,
      sets: exercise.sets,
      reps: exercise.isRepRange ? null : exercise.reps,
      reps_min: exercise.isRepRange ? exercise.repsMin : null,
      reps_max: exercise.isRepRange ? exercise.repsMax : null,
      resistance_value: exercise.isBodyWeight ? null : exercise.resistanceValue,
      is_bodyweight: exercise.isBodyWeight,
    }));

    const { error: exerciseError } = await supabase
      .from("workout_exercises")
      .insert(exercisePayload);

    console.log("Exercise error", exerciseError);

    if (exerciseError) {
      Alert.alert("Error", "Failed to save exercises");
      return;
    }

    Alert.alert("Success", "Workout saved successfully!", [
      {
        text: "OK",
        onPress: () => {
          setWorkoutName("");
          setExercises([]);
        },
      },
    ]);
  };

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Workout</Text>
            <Text style={styles.subtitle}>
              Design your perfect training session
            </Text>
          </View>
          <View style={styles.content}>
            {/* Workout Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Name</Text>
              <TextInput
                style={styles.workoutNameInput}
                placeholder="Enter workout name"
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {/* Add Exercise */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Exercise</Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setShowExercisePicker(true)}
              >
                <Search size={20} color="#3B82F6" />
                <Text style={styles.addExerciseButtonText}>
                  Choose from library or add custom
                </Text>
                <Plus size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {/* Exercises List */}
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <TouchableOpacity
                  style={styles.exerciseHeader}
                  onPress={() => toggleExerciseCollapse(exercise.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseIcon}>
                    <Target size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {/* <Text style={styles.exerciseCategory}>
                      {exercise.exercise.category} •{" "}
                      {exercise.exercise.muscle_groups}
                    </Text> */}
                    {exercise.isCollapsed && (
                      <Text style={styles.exerciseSummary}>
                        {getExerciseSummary(exercise)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.exerciseActions}>
                    <TouchableOpacity
                      style={styles.removeExerciseButton}
                      onPress={() => removeExercise(exercise.id)}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <View style={styles.collapseButton}>
                      {exercise.isCollapsed ? (
                        <ChevronDown size={20} color="#6B7280" />
                      ) : (
                        <ChevronUp size={20} color="#6B7280" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                {!exercise.isCollapsed && (
                  <View style={styles.exerciseDetails}>
                    {/* Exercise Instructions */}
                    {/* {exercise.exercise.instructions && (
                      <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>
                          Instructions
                        </Text>
                        <Text style={styles.instructionsText}>
                          {exercise.exercise.instructions}
                        </Text>
                      </View>
                    )} */}
                    {/* Sets Control */}
                    <View style={styles.controlRow}>
                      <Text style={styles.controlLabel}>Sets</Text>
                      <View style={styles.setsControl}>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() =>
                            updateExercise(
                              exercise.id,
                              "sets",
                              Math.max(1, exercise.sets - 1)
                            )
                          }
                        >
                          <Text style={styles.controlButtonText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.controlDisplay}>
                          <Text style={styles.controlNumber}>
                            {exercise.sets}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() =>
                            updateExercise(
                              exercise.id,
                              "sets",
                              exercise.sets + 1
                            )
                          }
                        >
                          <Text style={styles.controlButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Rep Range Toggle */}
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>Rep Range</Text>
                      <TouchableOpacity
                        style={styles.toggle}
                        onPress={() => toggleRepRange(exercise.id)}
                      >
                        {exercise.isRepRange ? (
                          <ToggleRight size={24} color="#3B82F6" />
                        ) : (
                          <ToggleLeft size={24} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {/* Reps Input */}
                    <View style={styles.inputsRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          {exercise.isRepRange ? "Rep Range" : "Reps"}
                        </Text>
                        {exercise.isRepRange ? (
                          <View style={styles.rangeContainer}>
                            <View style={styles.rangeInputContainer}>
                              <TextInput
                                style={styles.rangeInput}
                                placeholder="8"
                                value={exercise.repsMin}
                                onChangeText={(value) =>
                                  updateExercise(exercise.id, "repsMin", value)
                                }
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                              />
                            </View>
                            <Text style={styles.rangeSeparator}>to</Text>
                            <View style={styles.rangeInputContainer}>
                              <TextInput
                                style={styles.rangeInput}
                                placeholder="12"
                                value={exercise.repsMax}
                                onChangeText={(value) =>
                                  updateExercise(exercise.id, "repsMax", value)
                                }
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                              />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.input}
                              placeholder="12"
                              value={exercise.reps}
                              onChangeText={(value) =>
                                updateExercise(exercise.id, "reps", value)
                              }
                              keyboardType="numeric"
                              placeholderTextColor="#9CA3AF"
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Weight</Text>
                        <View
                          style={[
                            styles.inputContainer,
                            exercise.isBodyWeight && styles.bodyWeightContainer,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.bodyWeightToggle}
                            onPress={() => toggleBodyWeight(exercise.id)}
                          >
                            {exercise.isBodyWeight ? (
                              <User size={16} color="#059669" />
                            ) : (
                              <Weight size={16} color="#6B7280" />
                            )}
                          </TouchableOpacity>
                          {exercise.isBodyWeight ? (
                            <Text style={styles.bodyWeightText}>
                              Body Weight
                            </Text>
                          ) : (
                            <TextInput
                              style={styles.input}
                              placeholder="135 lbs"
                              value={exercise.resistanceValue}
                              onChangeText={(value) =>
                                updateExercise(
                                  exercise.id,
                                  "resistanceValue",
                                  value
                                )
                              }
                              keyboardType="numeric"
                              placeholderTextColor="#9CA3AF"
                            />
                          )}
                        </View>
                      </View>
                    </View>
                    {/* Sets Preview */}
                    <View style={styles.setsPreview}>
                      <Text style={styles.setsPreviewTitle}>Sets Preview</Text>
                      <View style={styles.setsGrid}>
                        {Array.from({ length: exercise.sets }, (_, index) => (
                          <View key={index} style={styles.setPreview}>
                            <Text style={styles.setPreviewNumber}>
                              {index + 1}
                            </Text>
                            <Text style={styles.setPreviewText}>
                              {getRepDisplay(exercise)} ×{" "}
                              {exercise.isBodyWeight
                                ? "BW"
                                : exercise.resistanceValue || "—"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
            {/* Save Button */}
            {exercises.length > 0 && (
              <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        {/* Exercise Picker Modal */}
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onSelectExercise={addExercise}
        />
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 24,
    paddingTop: 0,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  workoutNameInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addExerciseButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  exerciseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  // exerciseCategory: {
  //   fontSize: 14,
  //   color: "#6B7280",
  //   marginBottom: 4,
  // },
  exerciseSummary: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeExerciseButton: {
    padding: 4,
  },
  collapseButton: {
    padding: 4,
  },
  exerciseDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  // instructionsContainer: {
  //   backgroundColor: "#F8FAFC",
  //   padding: 12,
  //   borderRadius: 8,
  //   borderLeftWidth: 3,
  //   borderLeftColor: "#3B82F6",
  // },
  // instructionsTitle: {
  //   fontSize: 14,
  //   fontWeight: "600",
  //   color: "#374151",
  //   marginBottom: 4,
  // },
  // instructionsText: {
  //   fontSize: 14,
  //   color: "#6B7280",
  //   lineHeight: 20,
  // },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  setsControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  controlDisplay: {
    minWidth: 40,
    alignItems: "center",
  },
  controlNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3B82F6",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  toggle: {
    padding: 4,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 16,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bodyWeightContainer: {
    backgroundColor: "#ECFDF5",
    borderColor: "#D1FAE5",
  },
  bodyWeightToggle: {
    padding: 2,
  },
  bodyWeightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rangeInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  rangeSeparator: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    paddingHorizontal: 4,
  },
  setsPreview: {
    gap: 12,
  },
  setsPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  setsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setPreview: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  setPreviewNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 2,
  },
  setPreviewText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
