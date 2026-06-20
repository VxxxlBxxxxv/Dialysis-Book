import type { Ref } from "react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { DialysisSession } from "../types";
import { SYMPTOMS } from "../constants/symptoms";
import { getFormattedDate, getFormattedTime } from "../util/date";
import { parseBP, bpToString, hasValue } from "../util/format";
import WeightInput from "./WeightInput";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

interface Props {
  session: DialysisSession;
  isNew: boolean;
  onSave: (data: Omit<DialysisSession, "id">, id: string) => void;
  onCancel: (id: string, isNew: boolean) => void;
  onDelete: (id: string) => void;
  autoFocusFirstEmpty?: boolean;
}

const SessionEditForm = ({
  session,
  isNew,
  onSave,
  onCancel,
  onDelete,
  autoFocusFirstEmpty = false,
}: Props) => {
  const weightBeforeRef = useRef<TextInput>(null);
  const preBPRef = useRef<TextInput>(null);
  const weightAfterRef = useRef<TextInput>(null);
  const postBPRef = useRef<TextInput>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [data, setData] = useState(() => ({
    date: new Date(session.date),
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    weightBefore: hasValue(session.weightBefore) ? String(session.weightBefore) : "",
    weightAfter: hasValue(session.weightAfter) ? String(session.weightAfter) : "",
    dryWeight: hasValue(session.dryWeight) ? String(session.dryWeight) : "",
    notes: session.notes || "",
    preBP: bpToString(session.preDialysisBP),
    midBP: bpToString(session.midDialysisBP),
    postBP: bpToString(session.postDialysisBP),
    preBPEnteredAt: session.preDialysisBPEnteredAt ?? null,
    midBPEnteredAt: session.midDialysisBPEnteredAt ?? null,
    postBPEnteredAt: session.postDialysisBPEnteredAt ?? null,
    pulsePre: hasValue(session.pulsePre) ? String(session.pulsePre) : "",
    pulseMid: hasValue(session.pulseMid) ? String(session.pulseMid) : "",
    pulsePost: hasValue(session.pulsePost) ? String(session.pulsePost) : "",
    symptoms: session.symptoms ?? [],
  }));

  function toggleSymptom(symptom: string) {
    setData((p) => ({
      ...p,
      symptoms: p.symptoms.includes(symptom)
        ? p.symptoms.filter((s) => s !== symptom)
        : [...p.symptoms, symptom],
    }));
  }

  const toNum = (v: string) => (v !== "" ? Number(v) : null);
  const dryWeightNum = data.dryWeight !== "" ? parseFloat(data.dryWeight) : 0;
  const weightBeforeNum = data.weightBefore !== "" ? parseFloat(data.weightBefore) : 0;
  const weightAfterNum = data.weightAfter !== "" ? parseFloat(data.weightAfter) : 0;
  const center = dryWeightNum > 0 ? dryWeightNum : 50;

  useEffect(() => {
    if (!autoFocusFirstEmpty) return;

    const timer = setTimeout(() => {
      if (data.weightBefore === "") {
        weightBeforeRef.current?.focus();
      } else if (data.preBP === "") {
        preBPRef.current?.focus();
      } else if (data.weightAfter === "") {
        weightAfterRef.current?.focus();
      } else if (data.postBP === "") {
        postBPRef.current?.focus();
      }
    }, 350);

    return () => clearTimeout(timer);
    // Запускаем только при открытии формы: дальнейший ввод не должен прыгать по полям.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocusFirstEmpty, session.id]);

  const deltaBefore =
    weightBeforeNum > 0 && dryWeightNum > 0 ? weightBeforeNum - dryWeightNum : null;
  const deltaAfter =
    weightAfterNum > 0 && dryWeightNum > 0 ? weightAfterNum - dryWeightNum : null;
  const fluidRemoved =
    weightBeforeNum > 0 && weightAfterNum > 0 ? weightBeforeNum - weightAfterNum : null;

  function save() {
    onSave(
      {
        date: getFormattedDate(data.date),
        startTime: data.startTime.toString(),
        endTime: data.endTime.toString(),
        weightBefore: toNum(data.weightBefore),
        weightAfter: toNum(data.weightAfter),
        dryWeight: toNum(data.dryWeight),
        notes: data.notes,
        preDialysisBP: parseBP(data.preBP),
        midDialysisBP: parseBP(data.midBP),
        postDialysisBP: parseBP(data.postBP),
        preDialysisBPEnteredAt: data.preBPEnteredAt,
        midDialysisBPEnteredAt: data.midBPEnteredAt,
        postDialysisBPEnteredAt: data.postBPEnteredAt,
        pulsePre: toNum(data.pulsePre),
        pulseMid: toNum(data.pulseMid),
        pulsePost: toNum(data.pulsePost),
        symptoms: data.symptoms,
      },
      session.id
    );
  }

  function setBpWithTimestamp(
    bpKey: "preBP" | "midBP" | "postBP",
    timeKey: "preBPEnteredAt" | "midBPEnteredAt" | "postBPEnteredAt",
    raw: string
  ) {
    const value = raw.replace(/-/g, "/");
    setData((p) => ({
      ...p,
      [bpKey]: value,
      [timeKey]: value.trim() ? new Date().toISOString() : null,
    }));
  }

  const enteredAtText = (value: string | null) =>
    value ? `введено ${getFormattedTime(value)}` : "";

  // Поле замера: давление + пульс рядом (пульс измеряется при каждом замере АД).
  const bpField = (
    label: string,
    bpValue: string,
    onBp: (v: string) => void,
    pulseValue: string,
    onPulse: (v: string) => void,
    enteredAt: string | null,
    inputRef?: Ref<TextInput>
  ) => (
    <View style={s.section}>
      <View style={s.labelRow}>
        <Text style={s.label}>{label}</Text>
        {enteredAt ? <Text style={s.enteredAtText}>{enteredAtText(enteredAt)}</Text> : null}
      </View>
      <View style={s.bpRow}>
        <TextInput
          ref={inputRef}
          style={[s.bpInput, s.bpInputFlex]}
          value={bpValue}
          placeholder="120/80"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          onChangeText={onBp}
        />
        <TextInput
          style={[s.bpInput, s.pulseInput]}
          value={pulseValue}
          placeholder="пульс"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
          onChangeText={(t) => onPulse(t.replace(/[^0-9]/g, ""))}
        />
      </View>
    </View>
  );

  return (
    <View style={s.card}>
      <View style={s.buttons}>
        <TouchableOpacity
          style={[s.iconBtn, s.cancelBtn]}
          onPress={() => onCancel(session.id, isNew)}
        >
          <Ionicons name="close" size={26} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.iconBtn, s.deleteBtn]}
          onPress={() => onDelete(session.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.iconBtn, s.saveBtn]} onPress={save}>
          <Ionicons name="checkmark" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.dateTimeRow}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={s.dateBtn}>
          <Text style={s.dateBtnText}>{getFormattedDate(data.date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={s.timeBtn}>
          <Text style={s.timeBtnText}>
            {getFormattedTime(data.startTime.toISOString())}
          </Text>
        </TouchableOpacity>
        <Text style={s.timeDash}>–</Text>
        <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={s.timeBtn}>
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
            if (t)
              setData((p) => ({
                ...p,
                startTime: t,
                endTime: new Date(t.getTime() + FOUR_HOURS_MS),
              }));
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
          inputRef={weightBeforeRef}
          value={data.weightBefore}
          onChange={(t) => setData((p) => ({ ...p, weightBefore: t }))}
          centerValue={center}
        />
      </View>

      {bpField(
        "Давление до",
        data.preBP,
        (t) => setBpWithTimestamp("preBP", "preBPEnteredAt", t),
        data.pulsePre,
        (t) => setData((p) => ({ ...p, pulsePre: t })),
        data.preBPEnteredAt,
        preBPRef
      )}
      {bpField(
        "Давление 2 ч",
        data.midBP,
        (t) => setBpWithTimestamp("midBP", "midBPEnteredAt", t),
        data.pulseMid,
        (t) => setData((p) => ({ ...p, pulseMid: t })),
        data.midBPEnteredAt
      )}
      {bpField(
        "Давление после",
        data.postBP,
        (t) => setBpWithTimestamp("postBP", "postBPEnteredAt", t),
        data.pulsePost,
        (t) => setData((p) => ({ ...p, pulsePost: t })),
        data.postBPEnteredAt,
        postBPRef
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
          inputRef={weightAfterRef}
          value={data.weightAfter}
          onChange={(t) => setData((p) => ({ ...p, weightAfter: t }))}
          centerValue={center}
        />
      </View>

      <WeightInput
        label="Сухой вес (кг)"
        value={data.dryWeight}
        onChange={(t) => setData((p) => ({ ...p, dryWeight: t }))}
        centerValue={center}
      />

      {fluidRemoved !== null && fluidRemoved > 0 && (
        <Text style={s.fluidHint}>Слито жидкости: {fluidRemoved.toFixed(1)} кг</Text>
      )}

      <View style={s.section}>
        <Text style={s.label}>Симптомы</Text>
        <View style={s.symptomWrap}>
          {SYMPTOMS.map((symptom) => {
            const active = data.symptoms.includes(symptom);
            return (
              <TouchableOpacity
                key={symptom}
                style={[s.symptomChip, active && s.symptomChipActive]}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text style={[s.symptomText, active && s.symptomTextActive]}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Комментарий</Text>
        <TextInput
          style={s.notesInput}
          placeholder="Заметки"
          multiline
          numberOfLines={2}
          value={data.notes}
          placeholderTextColor="#aaa"
          onChangeText={(t) => setData((p) => ({ ...p, notes: t }))}
        />
      </View>
    </View>
  );
};

export default SessionEditForm;

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#4a90d9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  iconBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#eee",
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
  },
  saveBtn: {
    backgroundColor: "#4a90d9",
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  enteredAtText: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
  },
  bpInput: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bpRow: {
    flexDirection: "row",
    gap: 8,
  },
  bpInputFlex: {
    flex: 2,
  },
  pulseInput: {
    flex: 1,
    fontSize: 18,
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
  symptomWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  symptomChipActive: {
    backgroundColor: "#e74c3c",
    borderColor: "#e74c3c",
  },
  symptomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  symptomTextActive: {
    color: "#fff",
  },
  fluidHint: {
    fontSize: 15,
    color: "#4a90d9",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
});
