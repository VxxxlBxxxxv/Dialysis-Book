import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { getFormattedTime } from "../util/date";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
}) {
  const navigation = useNavigation<NavigationProp>();

  const fluidRemoved =
    weightBefore && weightAfter
      ? (weightBefore - weightAfter).toFixed(1)
      : null;

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("Manage Session", { selectedSession: id })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.dateText}>{date}</Text>
        <Text style={styles.timeText}>
          {getFormattedTime(startTime)} – {getFormattedTime(endTime)}
        </Text>
      </View>

      <View style={styles.body}>
        {weightBefore > 0 && (
          <View style={styles.row}>
            <Ionicons name="scale-outline" size={20} color="#4a90d9" />
            <Text style={styles.valueText}>
              {weightBefore} кг → {weightAfter} кг
            </Text>
            {fluidRemoved && (
              <Text style={styles.fluidText}>−{fluidRemoved} кг</Text>
            )}
          </View>
        )}

        {dryWeight > 0 && (
          <View style={styles.row}>
            <Ionicons name="fitness-outline" size={20} color="#4a90d9" />
            <Text style={styles.valueText}>Сухой вес: {dryWeight} кг</Text>
          </View>
        )}

        {preDialysisBP?.systolic > 0 && (
          <View style={styles.row}>
            <Ionicons name="heart-outline" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              До: {preDialysisBP.systolic}/{preDialysisBP.diastolic}
            </Text>
          </View>
        )}

        {midDialysisBP?.systolic > 0 && (
          <View style={styles.row}>
            <Ionicons name="heart-half-outline" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              2ч: {midDialysisBP.systolic}/{midDialysisBP.diastolic}
            </Text>
          </View>
        )}

        {postDialysisBP?.systolic > 0 && (
          <View style={styles.row}>
            <Ionicons name="heart-discharge-outline" size={20} color="#e74c3c" />
            <Text style={styles.valueText}>
              После: {postDialysisBP.systolic}/{postDialysisBP.diastolic}
            </Text>
          </View>
        )}
      </View>

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
  fluidText: {
    fontSize: 15,
    color: "#4a90d9",
    fontWeight: "600",
    marginLeft: 4,
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
