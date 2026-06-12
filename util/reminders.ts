import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Локальные напоминания о сеансе диализа: Пн/Ср/Пт в 08:00.
// Состояние (вкл/выкл) хранится в AsyncStorage, чтобы переключатель пережил перезапуск.
const REMINDERS_KEY = "dialysis_reminders_enabled";
const REMINDER_HOUR = 8;
const REMINDER_MINUTE = 0;

// Дни недели по календарю expo-notifications: 1=воскресенье … 7=суббота.
// Пн=2, Ср=4, Пт=6.
const DIALYSIS_WEEKDAYS = [2, 4, 6];

export async function remindersEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(REMINDERS_KEY);
  return v === "1";
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function scheduleAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const weekday of DIALYSIS_WEEKDAYS) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Дневник диализа",
        body: "Сегодня сеанс. Не забудьте записать вес, давление и самочувствие.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
      },
    });
  }
}

// Переключить напоминания. Возвращает новое состояние (вкл = true).
export async function toggleReminders(): Promise<boolean> {
  const enabled = await remindersEnabled();

  if (enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(REMINDERS_KEY, "0");
    Alert.alert("Напоминания", "Напоминания выключены.");
    return false;
  }

  const ok = await ensurePermission();
  if (!ok) {
    Alert.alert(
      "Напоминания",
      "Нужно разрешение на уведомления. Включите его в настройках телефона."
    );
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Напоминания",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await scheduleAll();
  await AsyncStorage.setItem(REMINDERS_KEY, "1");
  Alert.alert(
    "Напоминания",
    "Включены: Пн, Ср, Пт в 8:00 утра."
  );
  return true;
}
