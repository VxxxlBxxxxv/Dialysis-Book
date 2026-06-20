import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DialysisSession } from "../types";
import { getFormattedTime, getWeekdayShortRu } from "../util/date";
import { formatKg, formatBP, fluidRemoved, hasValue, NO_DATA } from "../util/format";

type SessionProps = DialysisSession & {
  onEdit: (id: string) => void;
};

function Session({
  date,
  startTime,
  endTime,
  weightBefore,
  weightAfter,
  dryWeight,
  notes,
  id,
  preDialysisBP,
  midDialysisBP,
  postDialysisBP,
  preDialysisBPEnteredAt,
  midDialysisBPEnteredAt,
  postDialysisBPEnteredAt,
  pulsePre,
  pulseMid,
  pulsePost,
  symptoms,
  exportedAt,
  onEdit,
}: SessionProps) {
  const uf = fluidRemoved(weightBefore, weightAfter);
  const weekday = getWeekdayShortRu(date);
  const hasWeight = hasValue(weightBefore) || hasValue(weightAfter);
  const preBP = formatBP(preDialysisBP);
  const midBP = formatBP(midDialysisBP);
  const postBP = formatBP(postDialysisBP);
  const symptomList = Array.isArray(symptoms) ? symptoms : [];
  const pulseSuffix = (p: number | null | undefined) =>
    hasValue(p) ? ` · пульс ${p}` : "";
  const enteredAtSuffix = (value: string | null | undefined) =>
    value ? ` · ввод ${getFormattedTime(value)}` : "";

  return (
    <Pressable
      onPress={() => onEdit(id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {date}
          {weekday ? ` · ${weekday}` : ""}
        </Text>
        <Text style={styles.timeText}>
          {getFormattedTime(startTime)} – {getFormattedTime(endTime)}
        </Text>
      </View>

      <View style={styles.body}>
        {hasWeight && (
          <View style={styles.row}>
            <Ionicons name="scale-outline" size={20} color="#4a90d9" />
            <Text style={styles.valueText}>
              {formatKg(weightBefore)} → {formatKg(weightAfter)}
            </Text>
            {uf !== null && (
              <Text style={styles.fluidText}>−{uf.toFixed(1)} кг</Text>
            )}
          </View>
        )}

        {hasValue(dryWeight) && (
          <View style={styles.row}>
            <Ionicons name="fitness-outline" size={20} color="#4a90d9" />
            <Text style={styles.valueText}>Сухой вес: {formatKg(dryWeight)}</Text>
          </View>
        )}

        {preBP !== NO_DATA && (
          <View style={styles.row}>
            <Ionicons name="heart-outline" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              До: {preBP}
              {pulseSuffix(pulsePre)}
              {enteredAtSuffix(preDialysisBPEnteredAt)}
            </Text>
          </View>
        )}

        {midBP !== NO_DATA && (
          <View style={styles.row}>
            <Ionicons name="heart-half-outline" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              2ч: {midBP}
              {pulseSuffix(pulseMid)}
              {enteredAtSuffix(midDialysisBPEnteredAt)}
            </Text>
          </View>
        )}

        {postBP !== NO_DATA && (
          <View style={styles.row}>
            <Ionicons name="heart" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              После: {postBP}
              {pulseSuffix(pulsePost)}
              {enteredAtSuffix(postDialysisBPEnteredAt)}
            </Text>
          </View>
        )}

        {symptomList.length > 0 && (
          <View style={styles.row}>
            <Ionicons name="alert-circle-outline" size={20} color="#e67e22" />
            <Text style={styles.symptomText}>{symptomList.join(", ")}</Text>
          </View>
        )}
      </View>

      {exportedAt ? (
        <View style={styles.exportRow}>
          <Ionicons name="cloud-done-outline" size={16} color="#2f80d0" />
          <Text style={styles.exportText}>Экспортировано: {exportedAt}</Text>
        </View>
      ) : null}

      {notes ? (
        <View style={styles.notesRow}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color="#888"
          />
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default Session;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  timeText: {
    fontSize: 16,
    color: "#666",
  },
  body: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  valueText: {
    fontSize: 17,
    color: "#444",
    fontWeight: "500",
  },
  symptomText: {
    fontSize: 16,
    color: "#e67e22",
    fontWeight: "600",
    flexShrink: 1,
  },
  fluidText: {
    fontSize: 15,
    color: "#4a90d9",
    fontWeight: "600",
    marginLeft: 4,
  },
  exportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
  },
  exportText: {
    fontSize: 13,
    color: "#2f80d0",
    fontWeight: "600",
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: "#eee",
    borderTopWidth: 1,
    gap: 6,
  },
  notesText: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
    flexShrink: 1,
  },
});
