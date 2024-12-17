import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, FlatList, Platform } from 'react-native';
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { app, auth } from '../Services/Firebase';
import { signOut } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import * as Notifications from 'expo-notifications';

export default function HomeScreen({ navigation }) {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [edit, setEdit] = useState(null);
  const [timer, setTimer] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);
  const db = getFirestore(app);

  const user = auth.currentUser;
  const username = user?.displayName || 'Guest';
  const user_id = user?.uid;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound:  true,
      shouldSetBadge: true,
    }),
  });

  useEffect(() => {
    if (user_id) {
      const userTasksRef = collection(db, 'users', user_id, 'tasks');
      const unsubscribe = onSnapshot(userTasksRef, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(fetchedTasks);
      });

      return () => unsubscribe();
    }
  }, [user_id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = format(new Date(), 'yyyy-MM-dd HH:mm'); 
      tasks.forEach(task => {
        if (task.timer) {
          const taskTime = format(new Date(task.timer), 'yyyy-MM-dd HH:mm');
          if (taskTime === currentTime) {
            sendNotification(task);
          }
        }
      });
    }, 60000); 
    
    return () => clearInterval(interval); 
  }, [tasks]);

  const sendNotification = async (task) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `It's time for do your task
        : ${task.task}`,
      },
      trigger: {
        seconds: 1, 
      },
    });
  };

  const handleTask = async () => {
    try {
      if (task.trim() && user_id) {
        const userTasksRef = collection(db, 'users', user_id, 'tasks');
        const newTaskData = { task, timer: timer || null };

        if (edit !== null) {
          const taskToEdit = tasks[edit];
          const taskDoc = doc(userTasksRef, taskToEdit.id);
          await updateDoc(taskDoc, newTaskData);
          setEdit(null);
        } else {
          await addDoc(userTasksRef, newTaskData);
        }
        setTask('');
        setTimer(null);
      }
    } catch (error) {
      console.error("Error saving task:", error.message);
      alert("Error saving task. Please try again!");
    }
  };

  const handleEditTask = (index) => {
    setTask(tasks[index].task);
    setTimer(tasks[index].timer);
    setEdit(index);
  };

  const handleDeleteTask = async (index) => {
    try {
      const taskToDelete = tasks[index];
      const userTasksRef = collection(db, 'users', user_id, 'tasks');
      const taskDoc = doc(userTasksRef, taskToDelete.id);
      await deleteDoc(taskDoc);
    } catch (error) {
      console.error("Error deleting task:", error.message);
    }
  };

  const handleTimer = (index) => {
    setShowPicker(true);
    setCurrentTaskIndex(index);
  };

  const handleTimerChange = async(event, selectedTime) => {
    setShowPicker(false);
    if (event?.type === "dismissed") return;
    if (selectedTime && currentTaskIndex !== null) {
      const formattedTime = format(new Date(selectedTime), 'yyyy-MM-dd HH:mm:ss');
      const taskToUpdate = tasks[currentTaskIndex];
      const taskDoc = doc(db, 'users', user_id, 'tasks', taskToUpdate.id);
      await updateDoc(taskDoc, { timer: formattedTime });
      setCurrentTaskIndex(null);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.navigate('Login');
    });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.task}>
      <Text style={styles.taskText}>{item.task}</Text>
      <View style={styles.taskButtons}>
        <TouchableOpacity onPress={() => handleTimer(index)} style={styles.Timerbutton}>
          <Text style={styles.buttonText}>
            {item.timer ? format(new Date(item.timer), "hh:mm a") : 'Set Time'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEditTask(index)} style={styles.editButton}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteTask(index)} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Welcome, {username}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>LogOut</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Add your daily task here!</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Task"
        value={task}
        onChangeText={setTask}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleTask}>
        <Text style={styles.addButtonText}>{edit !== null ? "Update Task" : "Add Task"}</Text>
      </TouchableOpacity>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      {showPicker && (
        <DateTimePicker
          value={timer ? new Date(timer) : new Date()}
          mode='time'
          display={Platform.OS === 'android' ? "spinner" : "default"}
          onChange={handleTimerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'dodgerblue',
    marginVertical: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  task: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  taskButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  editButton: {
    backgroundColor: 'dodgerblue',
    padding: 6,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 6,
    borderRadius: 5,
  },
  Timerbutton: {
    backgroundColor: 'green',
    padding: 6,
    borderRadius: 5,
  }, 
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'dodgerblue',
    padding: 7,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
