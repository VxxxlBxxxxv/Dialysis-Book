import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { DialysisSession } from "../types";

// Формат резервной копии: вся база сеансов одним JSON-файлом.
// version — на случай будущих изменений схемы.
const BACKUP_VERSION = 1;

type BackupFile = {
  type: "dialysis-book-backup";
  version: number;
  exported: string;
  count: number;
  sessions: DialysisSession[];
};

function todayLocalIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Создать и отдать резервную копию (шеринг → сохранить в файлы/облако/мессенджер).
export async function exportBackup(sessions: DialysisSession[]): Promise<void> {
  if (sessions.length === 0) {
    Alert.alert("Резервная копия", "Нет сеансов для сохранения.");
    return;
  }

  const payload: BackupFile = {
    type: "dialysis-book-backup",
    version: BACKUP_VERSION,
    exported: todayLocalIso(),
    count: sessions.length,
    sessions,
  };

  try {
    const uri =
      FileSystem.documentDirectory + `dialysis-backup-${todayLocalIso()}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        "Резервная копия",
        `Сохранена в память приложения. Шеринг недоступен.`
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Сохранить резервную копию",
    });
  } catch (err) {
    console.error("Backup export error:", err);
    Alert.alert("Ошибка", "Не удалось создать резервную копию.");
  }
}

// Базовая проверка, что объект похож на сеанс. Терпима: требуем id и date,
// остальные поля могут отсутствовать (старые копии).
function looksLikeSession(x: any): x is DialysisSession {
  return (
    x != null &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.date === "string"
  );
}

// Прочитать файл резервной копии и вернуть список сеансов.
// Возвращает null если пользователь отменил выбор или файл некорректен.
export async function pickBackup(): Promise<DialysisSession[] | null> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "*/*"],
      copyToCacheDirectory: true,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return null;
    }

    const raw = await FileSystem.readAsStringAsync(res.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed = JSON.parse(raw);
    const sessions = Array.isArray(parsed)
      ? parsed
      : parsed?.sessions;

    if (!Array.isArray(sessions)) {
      Alert.alert(
        "Восстановление",
        "Файл не похож на резервную копию дневника."
      );
      return null;
    }

    const valid = sessions.filter(looksLikeSession);
    if (valid.length === 0) {
      Alert.alert("Восстановление", "В файле нет корректных сеансов.");
      return null;
    }

    return valid;
  } catch (err) {
    console.error("Backup import error:", err);
    Alert.alert("Ошибка", "Не удалось прочитать файл резервной копии.");
    return null;
  }
}

// Слияние импортированных сеансов с текущими: по id, импорт не затирает
// существующие записи молча — возвращаем объединённый список + статистику.
// Записи с совпадающим id из импорта пропускаются (текущее не теряем).
export function mergeSessions(
  current: DialysisSession[],
  imported: DialysisSession[]
): { merged: DialysisSession[]; added: number; skipped: number } {
  const byId = new Set(current.map((s) => s.id));
  let added = 0;
  let skipped = 0;
  const extra: DialysisSession[] = [];

  for (const s of imported) {
    if (byId.has(s.id)) {
      skipped += 1;
    } else {
      extra.push(s);
      byId.add(s.id);
      added += 1;
    }
  }

  // Сортировка по дате (новые сверху), как в основном списке.
  const merged = [...current, ...extra].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return { merged, added, skipped };
}
