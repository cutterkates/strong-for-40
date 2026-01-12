import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { cacheStorage, CacheKeys } from '../lib/cache';
import { getTodayDate, formatDate } from '../lib/utils';
import * as Haptics from 'expo-haptics';

interface Exercise {
  id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  current_weight: number;
  weight_increment: number;
  failed_attempts: number;
  sort_order: number;
}

interface Workout {
  id: string;
  name: string;
  description: string | null;
  exercises: Exercise[];
}

interface WorkoutSession {
  id: string;
  workout_id: string;
  session_date: string;
}

interface ExerciseSet {
  set_number: number;
  reps_completed: number;
  weight_used: number;
  rpe?: number;
}

export default function TrainingScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, ExerciseSet[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editWeight, setEditWeight] = useState('');

  const loadWorkouts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch workouts with exercises
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          description,
          exercises (
            id,
            name,
            target_sets,
            target_reps,
            current_weight,
            weight_increment,
            failed_attempts,
            sort_order
          )
        `)
        .eq('user_id', user.id)
        .order('sort_order');

      if (workoutsError) throw workoutsError;

      const formattedWorkouts = (workoutsData || []).map((workout: any) => ({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: Exercise, b: Exercise) => a.sort_order - b.sort_order
        ),
      }));

      setWorkouts(formattedWorkouts);
      await cacheStorage.set(CacheKeys.WORKOUTS, formattedWorkouts);

      // Check for active session today
      const today = getTodayDate();
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;

      if (sessionData) {
        setActiveSession(sessionData);
        const workout = formattedWorkouts.find(w => w.id === sessionData.workout_id);
        setCurrentWorkout(workout || null);

        // Load exercise sets for this session
        const { data: setsData, error: setsError } = await supabase
          .from('exercise_sets')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('set_number');

        if (setsError) throw setsError;

        const groupedSets: Record<string, ExerciseSet[]> = {};
        (setsData || []).forEach((set: any) => {
          if (!groupedSets[set.exercise_id]) {
            groupedSets[set.exercise_id] = [];
          }
          groupedSets[set.exercise_id].push({
            set_number: set.set_number,
            reps_completed: set.reps_completed,
            weight_used: set.weight_used,
            rpe: set.rpe,
          });
        });

        setExerciseSets(groupedSets);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }, [loadWorkouts]);

  const startWorkout = async (workout: Workout) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          session_date: getTodayDate(),
        })
        .select()
        .single();

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveSession(data);
      setCurrentWorkout(workout);
      setExerciseSets({});
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const logSet = async (exerciseId: string, setNumber: number, reps: number, weight: number) => {
    if (!activeSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('exercise_sets').insert({
        user_id: user.id,
        session_id: activeSession.id,
        exercise_id: exerciseId,
        set_number: setNumber,
        reps_completed: reps,
        weight_used: weight,
      });

      if (error) throw error;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update local state
      setExerciseSets(prev => ({
        ...prev,
        [exerciseId]: [
          ...(prev[exerciseId] || []),
          { set_number: setNumber, reps_completed: reps, weight_used: weight },
        ],
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const completeWorkout = async () => {
    if (!activeSession || !currentWorkout) return;

    Alert.alert(
      'Complete Workout',
      'Are you ready to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              // Apply StrongLifts-style progression rules
              for (const exercise of currentWorkout.exercises) {
                const sets = exerciseSets[exercise.id] || [];
                if (sets.length === 0) continue;

                // Check if all target sets were completed with target reps
                const allSetsCompleted = sets.length >= exercise.target_sets;
                const allRepsHit = sets.every(
                  set => set.reps_completed >= exercise.target_reps
                );

                if (allSetsCompleted && allRepsHit) {
                  // SUCCESS: All sets and reps completed
                  // Add weight increment (default +5 lb, +10 for deadlift)
                  const increment = exercise.name.toLowerCase().includes('deadlift') 
                    ? 10 
                    : exercise.weight_increment;
                  const newWeight = exercise.current_weight + increment;

                  await supabase
                    .from('exercises')
                    .update({
                      current_weight: newWeight,
                      failed_attempts: 0,
                    })
                    .eq('id', exercise.id);

                  console.log(`${exercise.name}: +${increment} lbs → ${newWeight} lbs`);
                } else {
                  // FAILED: Didn't complete all sets/reps
                  const failedAttempts = exercise.failed_attempts + 1;

                  if (failedAttempts >= 3) {
                    // DELOAD: Failed 3 times at this weight
                    const deloadAmount = exercise.current_weight * (exercise.deload_percentage / 100);
                    const newWeight = Math.max(0, exercise.current_weight - deloadAmount);

                    await supabase
                      .from('exercises')
                      .update({
                        current_weight: newWeight,
                        failed_attempts: 0,
                      })
                      .eq('id', exercise.id);

                    Alert.alert(
                      'Deload Applied',
                      `${exercise.name}: ${exercise.current_weight} → ${newWeight.toFixed(1)} lbs\n\nFailed 3 times. Deloaded ${exercise.deload_percentage}% to rebuild strength.`,
                      [{ text: 'Got it' }]
                    );
                  } else {
                    // REPEAT: Increment failed attempts, keep same weight
                    await supabase
                      .from('exercises')
                      .update({ failed_attempts: failedAttempts })
                      .eq('id', exercise.id);

                    console.log(
                      `${exercise.name}: Failed attempt ${failedAttempts}/3. Repeating ${exercise.current_weight} lbs.`
                    );
                  }
                }
              }

              // Update session duration
              const duration = Math.floor(
                (Date.now() - new Date(activeSession.created_at).getTime()) / 1000 / 60
              );
              await supabase
                .from('workout_sessions')
                .update({ duration_minutes: duration })
                .eq('id', activeSession.id);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setActiveSession(null);
              setCurrentWorkout(null);
              setExerciseSets({});
              loadWorkouts();
              
              Alert.alert(
                'Workout Complete! 💪',
                'Weights automatically adjusted for next session.',
                [{ text: 'Nice!' }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const updateExerciseWeight = async () => {
    if (!editingExercise || !editWeight) return;

    try {
      const newWeight = parseFloat(editWeight);
      const { error } = await supabase
        .from('exercises')
        .update({ current_weight: newWeight })
        .eq('id', editingExercise.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingExercise(null);
      setEditWeight('');
      loadWorkouts();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const sets = exerciseSets[exercise.id] || [];
    const completedSets = sets.length;
    const nextSetNumber = completedSets + 1;

    return (
      <View key={exercise.id} style={styles.exerciseCard}>
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseTarget}>
              {exercise.target_sets} × {exercise.target_reps} @ {exercise.current_weight} lbs
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditingExercise(exercise);
              setEditWeight(exercise.current_weight.toString());
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.setsProgress}>
          {Array.from({ length: exercise.target_sets }).map((_, i) => {
            const set = sets[i];
            const isCompleted = !!set;
            const isSuccess =
              isCompleted && set.reps_completed >= exercise.target_reps;

            return (
              <View
                key={i}
                style={[
                  styles.setIndicator,
                  isCompleted && styles.setCompleted,
                  isSuccess && styles.setSuccess,
                ]}
              >
                <Text style={styles.setNumber}>{i + 1}</Text>
                {isCompleted && (
                  <Text style={styles.setReps}>{set.reps_completed}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Quick Log Buttons */}
        {activeSession && completedSets < exercise.target_sets && (
          <View style={styles.quickLog}>
            <TouchableOpacity
              style={styles.logButton}
              onPress={() =>
                logSet(exercise.id, nextSetNumber, exercise.target_reps, exercise.current_weight)
              }
            >
              <Text style={styles.logButtonText}>
                Set {nextSetNumber}: {exercise.target_reps} reps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logButton, styles.logButtonSecondary]}
              onPress={() =>
                logSet(
                  exercise.id,
                  nextSetNumber,
                  exercise.target_reps - 1,
                  exercise.current_weight
                )
              }
            >
              <Text style={styles.logButtonTextSecondary}>
                {exercise.target_reps - 1} reps
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        {sets.length > 0 && (
          <View style={styles.setsHistory}>
            {sets.map((set, i) => (
              <Text key={i} style={styles.setHistoryText}>
                Set {set.set_number}: {set.reps_completed} reps @ {set.weight_used} lbs
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeSession && currentWorkout ? (
          <>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{currentWorkout.name}</Text>
              <Text style={styles.sessionDate}>{getTodayDate()}</Text>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={completeWorkout}
              >
                <Text style={styles.completeButtonText}>Complete Workout</Text>
              </TouchableOpacity>
            </View>

            {currentWorkout.exercises.map(renderExerciseCard)}
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Workout</Text>
              <Text style={styles.headerSubtitle}>Mon/Wed/Fri alternating program</Text>
            </View>

            {workouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No workouts configured</Text>
                <Text style={styles.emptySubtext}>
                  Contact support to set up your training program
                </Text>
              </View>
            ) : (
              workouts.map(workout => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => startWorkout(workout)}
                >
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  {workout.description && (
                    <Text style={styles.workoutDescription}>{workout.description}</Text>
                  )}
                  <Text style={styles.exerciseCount}>
                    {workout.exercises.length} exercises
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Weight Modal */}
      <Modal
        visible={!!editingExercise}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingExercise(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingExercise(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Update Weight</Text>
            <Text style={styles.modalSubtitle}>{editingExercise?.name}</Text>

            <TextInput
              style={styles.input}
              placeholder="Weight (lbs)"
              placeholderTextColor="#64748B"
              value={editWeight}
              onChangeText={setEditWeight}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setEditingExercise(null)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={updateExerciseWeight}>
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  sessionHeader: {
    backgroundColor: '#1E3A8A',
    padding: 16,
  },
  sessionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sessionDate: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: '#1E293B',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#60A5FA',
    marginTop: 12,
    fontWeight: '500',
  },
  exerciseCard: {
    backgroundColor: '#1E293B',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  editButtonText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  setsProgress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  setIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCompleted: {
    backgroundColor: '#F59E0B',
  },
  setSuccess: {
    backgroundColor: '#10B981',
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  setReps: {
    fontSize: 10,
    color: '#F1F5F9',
  },
  quickLog: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  logButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logButtonSecondary: {
    backgroundColor: '#334155',
  },
  logButtonTextSecondary: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  setsHistory: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  setHistoryText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonSecondaryText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
});
