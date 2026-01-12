import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { cacheStorage, CacheKeys } from '../lib/cache';
import { getTodayDate, generateTimeBlocks, formatDuration } from '../lib/utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

interface Task {
  id: string;
  title: string;
  notes: string | null;
  duration_min: number | null;
  time_block_start: string | null;
  time_block_end: string | null;
  status: string;
  project_name?: string;
  project_color?: string;
}

export default function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inboxTasks, setInboxTasks] = useState<Task[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  const timeBlocks = generateTimeBlocks('06:00', '22:00', 30);

  const loadTasks = useCallback(async () => {
    try {
      const today = getTodayDate();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get from cache first
      const cached = await cacheStorage.get<Task[]>(CacheKeys.TODAY_TASKS);
      if (cached) {
        setTasks(cached);
        separateTasks(cached);
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          notes,
          duration_min,
          time_block_start,
          time_block_end,
          status,
          projects(name, color)
        `)
        .eq('user_id', user.id)
        .or(`scheduled_for.eq.${today},status.eq.today`)
        .neq('status', 'completed')
        .order('time_block_start', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const formattedTasks = (data || []).map((task: any) => ({
        ...task,
        project_name: task.projects?.name,
        project_color: task.projects?.color,
      }));

      setTasks(formattedTasks);
      separateTasks(formattedTasks);
      await cacheStorage.set(CacheKeys.TODAY_TASKS, formattedTasks);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  const separateTasks = (allTasks: Task[]) => {
    const scheduled = allTasks.filter(t => t.time_block_start);
    const inbox = allTasks.filter(t => !t.time_block_start);
    setScheduledTasks(scheduled);
    setInboxTasks(inbox);
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: newTaskTitle.trim(),
        status: 'today',
        scheduled_for: getTodayDate(),
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewTaskTitle('');
      setShowNewTask(false);
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const checkTimeOverlap = (
    startTime: string,
    durationMin: number,
    excludeTaskId?: string
  ): boolean => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMin;

    // Check against all scheduled tasks
    for (const task of scheduledTasks) {
      if (excludeTaskId && task.id === excludeTaskId) continue;
      if (!task.time_block_start) continue;

      const [taskHours, taskMins] = task.time_block_start.split(':').map(Number);
      const taskStartMinutes = taskHours * 60 + taskMins;
      const taskDuration = task.duration_min || 30;
      const taskEndMinutes = taskStartMinutes + taskDuration;

      // Check if times overlap
      if (
        (startMinutes >= taskStartMinutes && startMinutes < taskEndMinutes) ||
        (endMinutes > taskStartMinutes && endMinutes <= taskEndMinutes) ||
        (startMinutes <= taskStartMinutes && endMinutes >= taskEndMinutes)
      ) {
        return true; // Overlap detected
      }
    }

    return false; // No overlap
  };

  const assignTimeBlock = async (task: Task, time: string) => {
    try {
      const durationMin = selectedDuration || task.duration_min || 30;

      // Check for overlaps
      const hasOverlap = checkTimeOverlap(time, durationMin, task.id);
      if (hasOverlap) {
        Alert.alert(
          'Time Conflict',
          'This time slot overlaps with another task. Do you want to schedule it anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Schedule Anyway',
              onPress: () => scheduleTask(task, time, durationMin),
            },
          ]
        );
        return;
      }

      await scheduleTask(task, time, durationMin);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const scheduleTask = async (task: Task, time: string, durationMin: number) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const endMinutes = minutes + durationMin;
      const endHours = hours + Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins
        .toString()
        .padStart(2, '0')}`;

      const { error } = await supabase
        .from('tasks')
        .update({
          time_block_start: time,
          time_block_end: endTime,
          duration_min: durationMin,
          scheduled_for: getTodayDate(),
          status: 'today',
        })
        .eq('id', task.id);

      if (error) throw error;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowTimeBlockModal(false);
      setSelectedTask(null);
      setSelectedDuration(30);
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderTimeBlock = (block: { time: string; label: string }) => {
    const tasksAtTime = scheduledTasks.filter(t => t.time_block_start === block.time);

    return (
      <View key={block.time} style={styles.timeSlot}>
        <View style={styles.timeLabel}>
          <Text style={styles.timeText}>{block.label}</Text>
        </View>
        <View style={styles.timeContent}>
          {tasksAtTime.length > 0 ? (
            tasksAtTime.map(task => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.scheduledTask,
                  { borderLeftColor: task.project_color || '#3B82F6' },
                ]}
                onLongPress={() => completeTask(task.id)}
              >
                <Text style={styles.scheduledTaskTitle}>{task.title}</Text>
                {task.duration_min && (
                  <Text style={styles.duration}>{formatDuration(task.duration_min)}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptySlot} />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Add */}
        <View style={styles.section}>
          {showNewTask ? (
            <View style={styles.newTaskInput}>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor="#64748B"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                onSubmitEditing={createTask}
              />
              <TouchableOpacity style={styles.addButton} onPress={createTask}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.quickAdd} onPress={() => setShowNewTask(true)}>
              <Text style={styles.quickAddText}>+ Quick add task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inbox Tasks */}
        {inboxTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inbox ({inboxTasks.length})</Text>
            {inboxTasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.inboxTask}
                onPress={() => {
                  setSelectedTask(task);
                  setShowTimeBlockModal(true);
                }}
                onLongPress={() => completeTask(task.id)}
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskHint}>Tap to schedule</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {timeBlocks.map(renderTimeBlock)}
        </View>
      </ScrollView>

      {/* Time Block Selection Modal */}
      <Modal
        visible={showTimeBlockModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimeBlockModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimeBlockModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Schedule: {selectedTask?.title}</Text>
            
            {/* Duration Picker */}
            <View style={styles.durationPicker}>
              <Text style={styles.durationLabel}>Duration:</Text>
              <View style={styles.durationButtons}>
                {[15, 30, 45, 60, 90, 120].map(duration => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration && styles.durationButtonActive,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        selectedDuration === duration && styles.durationButtonTextActive,
                      ]}
                    >
                      {duration}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Slots */}
            <ScrollView style={styles.timeList}>
              {timeBlocks.map(block => {
                const hasConflict = checkTimeOverlap(block.time, selectedDuration, selectedTask?.id);
                return (
                  <TouchableOpacity
                    key={block.time}
                    style={[
                      styles.timeOption,
                      hasConflict && styles.timeOptionConflict,
                    ]}
                    onPress={() => selectedTask && assignTimeBlock(selectedTask, block.time)}
                  >
                    <View style={styles.timeOptionContent}>
                      <Text style={styles.timeOptionText}>{block.label}</Text>
                      {hasConflict && (
                        <Text style={styles.conflictWarning}>⚠️ Conflict</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  quickAdd: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  quickAddText: {
    color: '#60A5FA',
    fontSize: 16,
  },
  newTaskInput: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#334155',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inboxTask: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '500',
  },
  taskHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeLabel: {
    width: 80,
    paddingTop: 4,
  },
  timeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  timeContent: {
    flex: 1,
  },
  emptySlot: {
    height: 40,
    borderLeftWidth: 2,
    borderLeftColor: '#1E293B',
  },
  scheduledTask: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 4,
  },
  scheduledTaskTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  duration: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
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
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  durationPicker: {
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  durationButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  durationButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  timeList: {
    maxHeight: 400,
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  timeOptionConflict: {
    backgroundColor: '#7F1D1D',
  },
  timeOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeOptionText: {
    color: '#F1F5F9',
    fontSize: 16,
  },
  conflictWarning: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
});
