import { useContext, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SessionsContext } from "../store/session-context";
import { getFormattedDate, getFormattedTime } from "../util/date";
import WeightInput from "./WeightInput";

interface InlineSessionFormProps {
  onScrollRequest?: (y: number) => void;
}

const InlineSessionForm = ({ onScrollRequest }: InlineSessionFormProps = {}) => {
  const [notesY, setNotesY] = useState(0);
  const { sessions, addSession } = useContext(SessionsContext);
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const initial = () => ({
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    weightBefore: "",
    weightAfter: "",
    dryWeight: lastSession?.dryWeight?.toString() || "",
    notes: "",
    preDialysisBP: { systolic: "", diastolic: "" },
    midDialysisBP: { systolic: "", diastolic: "" },
    postDialysisBP: { systolic: "", diastolic: "" },
  });

  const [data, setData] = useState(initial);

  const toNum = (v: string) => (v !== "" ? Number(v) : 0);
  const dryWeightNum = data.dryWeight !== "" ? parseFloat(data.dryWeight) : 0;
  const weightBeforeNum =
    data.weightBefore !== "" ? parseFloat(data.weightBefore) : 0;
  const weightAfterNum =
    data.weightAfter !== "" ? parseFloat(data.weightAfter) : 0;

  const deltaBefore =
    weightBeforeNum > 0 && dryWeightNum > 0
      ? weightBeforeNum - dryWeightNum
      : null;
  const deltaAfter =
    weightAfterNum > 0 && dryWeightNum > 0
      ? weightAfterNum - dryWeightNum
      : null;
  const fluidRemoved =
    weightBeforeNum > 0 && weightAfterNum > 0
      ? weightBeforeNum - weightAfterNum
      : null;

  const prevWeightBefore = lastSession?.weightBefore || 50;

  function close() {
    setExpanded(false);
    setData(initial());
  }

  function save() {
    const payload = {
      date: getFormattedDate(data.date),
      startTime: data.startTime.toString(),
      endTime: data.endTime.toString(),
      weightBefore: toNum(data.weightBefore),
      weightAfter: toNum(data.weightAfter),
      dryWeight: toNum(data.dryWeight),
      notes: data.notes,
      preDialysisBP: {
        systolic: toNum(data.preDialysisBP.systolic),
        diastolic: toNum(data.preDialysisBP.diastolic),
      },
      midDialysisBP: {
        systolic: toNum(data.midDialysisBP.systolic),
        diastolic: toNum(data.midDialysisBP.diastolic),
      },
      postDialysisBP: {
        systolic: toNum(data.postDialysisBP.systolic),
        diastolic: toNum(data.postDialysisBP.diastolic),
      },
    };
    addSession(payload);
    close();
  }

  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={({ pressed }) => [
          s.collapsedCard,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="add-circle" size={28} color="#4a90d9" />
        <Text style={s.collapsedText}>Новый сеанс</Text>
      </Pressable>
    );
  }

  const bpField = (
    label: string,
    systolic: string,
    diastolic: string,
    onChange: (bp: { systolic: string; diastolic: string }) => void
  ) => (
    <View style={s.section}>
      <Text style={s.label}>{label}</Text>
      <View style={s.bpRow}>
        <TextInput
          style={s.bpInput}
          value={systolic}
          placeholder="120"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          onChangeText={(t) => onChange({ systolic: t, diastolic })}
        />
        <Text style={s.bpSlash}>/</Text>
        <TextInput
          style={s.bpInput}
          value={diastolic}
          placeholder="80"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          onChangeText={(t) => onChange({ systolic, diastolic: t })}
        />
      </View>
    </View>
  );

  return (
    <View style={s.expandedCard}>
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>Новый сеанс</Text>
        <TouchableOpacity onPress={close} hitSlop={12}>
          <Ionicons name="close" size={26} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={s.dateTimeRow}>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={s.dateBtn}
        >
          <Text style={s.dateBtnText}>{getFormattedDate(data.date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowStartTimePicker(true)}
          style={s.timeBtn}
        >
          <Text style={s.timeBtnText}>
            {getFormattedTime(data.startTime.toISOString())}
          </Text>
        </TouchableOpacity>
        <Text style={s.timeDash}>–</Text>
        <TouchableOpacity
          onPress={() => setShowEndTimePicker(true)}
          style={s.timeBtn}
        >
          <Text style={s.timeBtnText}>
            {getFormattedTime(data.endTime.toISOString())}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={data.date}
          mode="date"
          display="calendar"
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setData((p) => ({ ...p, date: d }));
          }}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={data.startTime}
          mode="time"
          is24Hour
          display="default"
          onChange={(_, t) => {
            setShowStartTimePicker(false);
            if (t) setData((p) => ({ ...p, startTime: t }));
          }}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={data.endTime}
          mode="time"
          is24Hour
          display="default"
          onChange={(_, t) => {
            setShowEndTimePicker(false);
            if (t) setData((p) => ({ ...p, endTime: t }));
          }}
        />
      )}

      <View style={s.weightWrap}>
        {deltaBefore !== null && (
          <Text style={s.deltaBg} pointerEvents="none">
            {deltaBefore > 0 ? "+" : ""}
            {deltaBefore.toFixed(1)}
          </Text>
        )}
        <WeightInput
          label="Вес до (кг)"
          value={data.weightBefore}
          onChange={(t) => setData((p) => ({ ...p, weightBefore: t }))}
          centerValue={dryWeightNum > 0 ? dryWeightNum : prevWeightBefore}
          rangeBelow={1}
          rangeAbove={3}
        />
      </View>

      {bpField(
        "Давление до",
        data.preDialysisBP.systolic,
        data.preDialysisBP.diastolic,
        (bp) => setData((p) => ({ ...p, preDialysisBP: bp }))
      )}

      {bpField(
        "Давление 2 ч",
        data.midDialysisBP.systolic,
        data.midDialysisBP.diastolic,
        (bp) => setData((p) => ({ ...p, midDialysisBP: bp }))
      )}

      {bpField(
        "Давление после",
        data.postDialysisBP.systolic,
        data.postDialysisBP.diastolic,
        (bp) => setData((p) => ({ ...p, postDialysisBP: bp }))
      )}

      <View style={s.weightWrap}>
        {deltaAfter !== null && (
          <Text style={s.deltaBg} pointerEvents="none">
            {deltaAfter > 0 ? "+" : ""}
            {deltaAfter.toFixed(1)}
          </Text>
        )}
        <WeightInput
          label="Вес после (кг)"
          value={data.weightAfter}
          onChange={(t) => setData((p) => ({ ...p, weightAfter: t }))}
          centerValue={dryWeightNum > 0 ? dryWeightNum : prevWeightBefore}
          rangePadding={2}
        />
      </View>

      <WeightInput
        label="Сухой вес (кг)"
        value={data.dryWeight}
        onChange={(t) => setData((p) => ({ ...p, dryWeight: t }))}
        centerValue={
          lastSession?.dryWeight && lastSession.dryWeight > 0
            ? lastSession.dryWeight
            : prevWeightBefore
        }
        rangePadding={3}
      />
      {lastSession && lastSession.dryWeight > 0 && (
        <Text style={s.hint}>Предыдущий: {lastSession.dryWeight} кг</Text>
      )}

      {fluidRemoved !== null && fluidRemoved > 0 && (
        <Text style={s.fluidHint}>Слито жидкости: {fluidRemoved.toFixed(1)} кг</Text>
      )}

      <View
        style={s.section}
        onLayout={(e) => setNotesY(e.nativeEvent.layout.y)}
      >
        <Text style={s.label}>Комментарий</Text>
        <TextInput
          style={s.notesInput}
          placeholder="Заметки"
          multiline
          numberOfLines={2}
          value={data.notes}
          placeholderTextColor="#aaa"
          onFocus={() => {
            setTimeout(() => onScrollRequest?.(notesY), 250);
          }}
          onChangeText={(t) => setData((p) => ({ ...p, notes: t }))}
        />
      </View>

      <View style={s.buttons}>
        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveBtnText}>Добавить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={close}>
          <Text style={s.cancelBtnText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InlineSessionForm;

const s = StyleSheet.create({
  collapsedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e0e8f5",
    borderStyle: "dashed",
  },
  collapsedText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#4a90d9",
  },
  expandedCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#333",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dateBtn: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2a6cb8",
  },
  timeBtn: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timeBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2a6cb8",
  },
  timeDash: {
    fontSize: 18,
    color: "#999",
  },
  weightWrap: {
    position: "relative",
  },
  deltaBg: {
    position: "absolute",
    right: 4,
    top: 18,
    fontSize: 56,
    fontWeight: "800",
    color: "rgba(74, 144, 217, 0.12)",
    zIndex: 0,
  },
  section: {
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  bpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bpInput: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bpSlash: {
    fontSize: 26,
    fontWeight: "600",
    color: "#999",
  },
  notesInput: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    fontSize: 16,
    height: 64,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  hint: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    marginBottom: 4,
  },
  fluidHint: {
    fontSize: 15,
    color: "#4a90d9",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: "#4a90d9",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 2,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#eee",
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
