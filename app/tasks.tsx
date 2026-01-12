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
import { formatDateTime } from '../lib/utils';
import * as Haptics from 'expo-haptics';

interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_at: string | null;
  duration_min: number | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'inbox', label: 'Inbox', color: '#64748B' },
  { value: 'today', label: 'Today', color: '#3B82F6' },
  { value: 'next', label: 'Next', color: '#10B981' },
  { value: 'waiting', label: 'Waiting', color: '#F59E0B' },
  { value: 'someday', label: 'Someday', color: '#8B5CF6' },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('inbox');

  const loadTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const createTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || null,
        status: selectedStatus,
        duration_min: newTaskDuration ? parseInt(newTaskDuration) : null,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDuration('');
      setSelectedStatus('inbox');
      setShowNewTask(false);
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const updateTask = async () => {
    if (!editingTask || !newTaskTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTaskTitle.trim(),
          notes: newTaskNotes.trim() || null,
          status: selectedStatus,
          duration_min: newTaskDuration ? parseInt(newTaskDuration) : null,
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingTask(null);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDuration('');
      setSelectedStatus('inbox');
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadTasks();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
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

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskNotes(task.notes || '');
    setNewTaskDuration(task.duration_min?.toString() || '');
    setSelectedStatus(task.status);
  };

  const groupTasksByStatus = () => {
    const grouped: Record<string, Task[]> = {};
    STATUS_OPTIONS.forEach(status => {
      grouped[status.value] = tasks.filter(t => t.status === status.value);
    });
    return grouped;
  };

  const groupedTasks = groupTasksByStatus();

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.newButton} onPress={() => setShowNewTask(true)}>
            <Text style={styles.newButtonText}>+ New Task</Text>
          </TouchableOpacity>
        </View>

        {STATUS_OPTIONS.map(status => {
          const statusTasks = groupedTasks[status.value];
          if (statusTasks.length === 0) return null;

          return (
            <View key={status.value} style={styles.section}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={styles.statusTitle}>
                  {status.label} ({statusTasks.length})
                </Text>
              </View>
              {statusTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => openEditModal(task)}
                  onLongPress={() => completeTask(task.id)}
                >
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {task.notes && <Text style={styles.taskNotes}>{task.notes}</Text>}
                  {task.duration_min && (
                    <Text style={styles.taskMeta}>{task.duration_min} min</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Create/Edit Task Modal */}
      <Modal
        visible={showNewTask || !!editingTask}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowNewTask(false);
          setEditingTask(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowNewTask(false);
            setEditingTask(null);
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor="#64748B"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748B"
              value={newTaskNotes}
              onChangeText={setNewTaskNotes}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              placeholderTextColor="#64748B"
              value={newTaskDuration}
              onChangeText={setNewTaskDuration}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              {STATUS_OPTIONS.map(status => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    selectedStatus === status.value && {
                      backgroundColor: status.color,
                    },
                  ]}
                  onPress={() => setSelectedStatus(status.value)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedStatus === status.value && styles.statusButtonTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowNewTask(false);
                  setEditingTask(null);
                  setNewTaskTitle('');
                  setNewTaskNotes('');
                  setNewTaskDuration('');
                  setSelectedStatus('inbox');
                }}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={editingTask ? updateTask : createTask}
              >
                <Text style={styles.buttonText}>{editingTask ? 'Update' : 'Create'}</Text>
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
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  taskCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  taskNotes: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  taskMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
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
    maxHeight: '90%',
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
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
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
