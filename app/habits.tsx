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
import { getTodayDate, getWeekStart, getWeekEnd, formatDate } from '../lib/utils';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency_type: 'daily' | 'weekly';
  weekly_target: number | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_required: boolean;
}

interface HabitLog {
  habit_id: string;
  completed_date: string;
}

interface HabitWithLogs extends Habit {
  logs: HabitLog[];
  completedToday: boolean;
  currentStreak: number;
  weeklyProgress?: number;
}

export default function StandardsScreen() {
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [weeklyTarget, setWeeklyTarget] = useState('3');

  const loadHabits = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try cache first
      const cached = await cacheStorage.get<HabitWithLogs[]>(CacheKeys.HABITS);
      if (cached) {
        setHabits(cached);
      }

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order');

      if (habitsError) throw habitsError;

      // Get user's week start preference (default Monday = 1)
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('week_starts_on')
        .eq('user_id', user.id)
        .single();

      const weekStartsOn = prefsData?.week_starts_on ?? 1; // 0 = Sunday, 1 = Monday

      // Fetch logs for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', formatDate(thirtyDaysAgo));

      if (logsError) throw logsError;

      // Calculate current week boundaries
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn });
      const weekEnd = endOfWeek(today, { weekStartsOn });

      // Combine habits with their logs
      const habitsWithLogs = (habitsData || []).map(habit => {
        const habitLogs = (logsData || []).filter(log => log.habit_id === habit.id);
        const todayStr = getTodayDate();
        const completedToday = habitLogs.some(log => log.completed_date === todayStr);
        const currentStreak = calculateStreak(habitLogs);

        let weeklyProgress = undefined;
        if (habit.frequency_type === 'weekly') {
          // Count completions in current week (Mon-Sun based on user preference)
          const thisWeekLogs = habitLogs.filter(log => {
            const logDate = parseISO(log.completed_date);
            return logDate >= weekStart && logDate <= weekEnd;
          });
          weeklyProgress = thisWeekLogs.length;
        }

        return {
          ...habit,
          logs: habitLogs,
          completedToday,
          currentStreak,
          weeklyProgress,
        };
      });

      setHabits(habitsWithLogs);
      await cacheStorage.set(CacheKeys.HABITS, habitsWithLogs);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  const calculateStreak = (logs: HabitLog[]): number => {
    if (logs.length === 0) return 0;

    const sortedDates = logs
      .map(log => log.completed_date)
      .sort()
      .reverse();

    let streak = 0;
    const today = getTodayDate();
    let currentDate = today;

    for (const logDate of sortedDates) {
      if (logDate === currentDate) {
        streak++;
        const date = new Date(currentDate);
        date.setDate(date.getDate() - 1);
        currentDate = formatDate(date);
      } else {
        break;
      }
    }

    return streak;
  };

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  const toggleHabit = async (habitId: string, completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getTodayDate();

      if (completed) {
        // Remove the log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', today);

        if (error) throw error;
      } else {
        // Add the log
        const { error } = await supabase.from('habit_logs').insert({
          user_id: user.id,
          habit_id: habitId,
          completed_date: today,
        });

        if (error) throw error;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      loadHabits();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const createHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: newHabitName.trim(),
        description: newHabitDescription.trim() || null,
        frequency_type: frequencyType,
        weekly_target: frequencyType === 'weekly' ? parseInt(weeklyTarget) : null,
        color: '#10B981',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewHabitName('');
      setNewHabitDescription('');
      setFrequencyType('daily');
      setWeeklyTarget('3');
      setShowNewHabit(false);
      loadHabits();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const deleteHabit = async (habitId: string, habitName: string, isRequired: boolean) => {
    if (isRequired) {
      Alert.alert(
        'Cannot Delete',
        `"${habitName}" is a non-negotiable standard and cannot be deleted. This is one of your core commitments.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Standard',
      `Are you sure you want to delete "${habitName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('habits')
                .update({ is_active: false })
                .eq('id', habitId);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadHabits();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderWeekView = (habit: HabitWithLogs) => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <View style={styles.weekView}>
        {daysOfWeek.map(day => {
          const dateStr = formatDate(day);
          const isCompleted = habit.logs.some(log => log.completed_date === dateStr);
          const isToday = dateStr === getTodayDate();

          return (
            <View key={dateStr} style={styles.dayCircle}>
              <Text style={styles.dayLabel}>{format(day, 'EEE').substring(0, 1)}</Text>
              <View
                style={[
                  styles.dayDot,
                  isCompleted && { backgroundColor: habit.color || '#10B981' },
                  isToday && styles.todayDot,
                ]}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.newButton} onPress={() => setShowNewHabit(true)}>
            <Text style={styles.newButtonText}>+ New Standard</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No standards yet</Text>
            <Text style={styles.emptySubtext}>Create your first standard to get started</Text>
          </View>
        ) : (
          habits.map(habit => (
            <View key={habit.id} style={styles.habitCard}>
              {habit.is_required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>⭐ NON-NEGOTIABLE</Text>
                </View>
              )}
              
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  {habit.description && (
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                  )}
                </View>

                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      habit.completedToday && {
                        backgroundColor: habit.color || '#10B981',
                      },
                    ]}
                    onPress={() => toggleHabit(habit.id, habit.completedToday)}
                  >
                    <Text style={styles.checkIcon}>{habit.completedToday ? '✓' : ' '}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      habit.is_required && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => deleteHabit(habit.id, habit.name, habit.is_required)}
                  >
                    <Text style={styles.deleteButtonText}>
                      {habit.is_required ? '🔒' : '×'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {renderWeekView(habit)}

              <View style={styles.habitStats}>
                {habit.frequency_type === 'daily' ? (
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{habit.currentStreak}</Text>
                    <Text style={styles.statLabel}>day streak</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>
                        {habit.weeklyProgress}/{habit.weekly_target}
                      </Text>
                      <Text style={styles.statLabel}>this week</Text>
                    </View>
                    <View style={styles.weeklyProgressContainer}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(
                                100,
                                ((habit.weeklyProgress || 0) / (habit.weekly_target || 1)) * 100
                              )}%`,
                              backgroundColor:
                                (habit.weeklyProgress || 0) >= (habit.weekly_target || 0)
                                  ? '#10B981'
                                  : habit.color || '#10B981',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </>
                )}
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{habit.logs.length}</Text>
                  <Text style={styles.statLabel}>total</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New Habit Modal */}
      <Modal
        visible={showNewHabit}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewHabit(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowNewHabit(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New Standard</Text>

            <TextInput
              style={styles.input}
              placeholder="Standard name"
              placeholderTextColor="#64748B"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#64748B"
              value={newHabitDescription}
              onChangeText={setNewHabitDescription}
              multiline
            />

            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyButtons}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequencyType === 'daily' && styles.frequencyButtonActive,
                ]}
                onPress={() => setFrequencyType('daily')}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequencyType === 'daily' && styles.frequencyButtonTextActive,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequencyType === 'weekly' && styles.frequencyButtonActive,
                ]}
                onPress={() => setFrequencyType('weekly')}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequencyType === 'weekly' && styles.frequencyButtonTextActive,
                  ]}
                >
                  Weekly Target
                </Text>
              </TouchableOpacity>
            </View>

            {frequencyType === 'weekly' && (
              <TextInput
                style={styles.input}
                placeholder="Target (times per week)"
                placeholderTextColor="#64748B"
                value={weeklyTarget}
                onChangeText={setWeeklyTarget}
                keyboardType="numeric"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowNewHabit(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={createHabit}>
                <Text style={styles.buttonText}>Create</Text>
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
  newButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  habitCard: {
    backgroundColor: '#1E293B',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  requiredBadge: {
    backgroundColor: '#854D0E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  requiredBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  habitDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  habitActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#475569',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dayCircle: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
  },
  todayDot: {
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  weeklyProgressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  frequencyButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#10B981',
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
