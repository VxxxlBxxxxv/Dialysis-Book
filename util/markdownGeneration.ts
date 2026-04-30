import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DialysisSession } from "../types";

const DAYS_OF_WEEK_RU = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

type DateParts = { y: number; m: number; d: number };

function parseDateParts(dateStr: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function getDayOfWeekRu(parts: DateParts): string {
  const dt = new Date(parts.y, parts.m - 1, parts.d);
  return DAYS_OF_WEEK_RU[dt.getDay()];
}

function getMonthKey(parts: DateParts): string {
  return `${parts.y}-${String(parts.m).padStart(2, "0")}`;
}

function todayLocalIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSession(s: DialysisSession): string {
  const parts = parseDateParts(s.date)!;
  const dayOfWeek = getDayOfWeekRu(parts);
  const ufKg = (Number(s.weightBefore) - Number(s.weightAfter)).toFixed(1);
  const notes = (s.notes ?? "").trim();

  return `## ${s.date} (${dayOfWeek})

| Параметр | Значение |
|----------|----------|
| Начало | ${s.startTime} |
| Конец | ${s.endTime} |
| Вес до | ${s.weightBefore} кг |
| Вес после | ${s.weightAfter} кг |
| УФ (удалено) | ${ufKg} кг |
| АД до | ${s.preDialysisBP.systolic}/${s.preDialysisBP.diastolic} мм рт.ст. |
| АД после | ${s.postDialysisBP.systolic}/${s.postDialysisBP.diastolic} мм рт.ст. |

**Примечания:** ${notes.length > 0 ? notes : "—"}
`;
}

function buildMonthlyMarkdown(
  month: string,
  sessions: DialysisSession[]
): string {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((s) => s.date);
  const range =
    dates.length > 0 ? `${dates[0]} — ${dates[dates.length - 1]}` : month;

  const frontmatter = `---
type: dialysis-export
month: ${month}
count: ${sessions.length}
range: ${range}
exported: ${todayLocalIso()}
---

# Сеансы диализа — ${month}

`;

  return frontmatter + sorted.map(formatSession).join("\n---\n\n");
}

export const generateAndShareMarkdown = async (
  sessions: DialysisSession[]
) => {
  if (sessions.length === 0) {
    Alert.alert("Экспорт", "Нет сеансов для экспорта.");
    return;
  }

  // Фильтрация невалидных дат
  const valid: DialysisSession[] = [];
  let invalidCount = 0;
  for (const s of sessions) {
    if (parseDateParts(s.date)) {
      valid.push(s);
    } else {
      invalidCount += 1;
    }
  }

  if (valid.length === 0) {
    Alert.alert(
      "Экспорт",
      `Все ${sessions.length} сеансов имеют некорректную дату — экспорт отменён.`
    );
    return;
  }

  try {
    const byMonth = new Map<string, DialysisSession[]>();
    for (const s of valid) {
      const key = getMonthKey(parseDateParts(s.date)!);
      const arr = byMonth.get(key) ?? [];
      arr.push(s);
      byMonth.set(key, arr);
    }

    const months = [...byMonth.keys()].sort();
    const fileUris: string[] = [];

    for (const month of months) {
      const content = buildMonthlyMarkdown(month, byMonth.get(month)!);
      const uri = FileSystem.documentDirectory + `dialysis-${month}.md`;
      await FileSystem.writeAsStringAsync(uri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      fileUris.push(uri);
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        "Экспорт",
        `Сохранено ${fileUris.length} файлов в documentDirectory. Шеринг недоступен.`
      );
      return;
    }

    // Шерим каждый файл по очереди. Отмена одного диалога не должна ронять остальные.
    for (let i = 0; i < fileUris.length; i++) {
      try {
        await Sharing.shareAsync(fileUris[i], {
          mimeType: "text/plain",
          dialogTitle: `Экспорт ${months[i]} (${i + 1}/${fileUris.length})`,
        });
      } catch (shareErr) {
        console.warn(`Share dialog error for ${months[i]}:`, shareErr);
      }
    }

    if (invalidCount > 0) {
      Alert.alert(
        "Экспорт завершён",
        `Пропущено ${invalidCount} сеансов с некорректной датой. Экспортировано ${valid.length} в ${fileUris.length} файлов.`
      );
    }
  } catch (err) {
    console.error("Markdown export error:", err);
    Alert.alert("Ошибка", "Не удалось экспортировать .md файлы.");
  }
};
