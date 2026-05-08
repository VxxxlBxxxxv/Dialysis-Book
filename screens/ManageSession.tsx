import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { SessionsContext } from "../store/session-context";
import { getFormattedDate, getFormattedTime } from "../util/date";
import Button from "../components/Button";
import WeightInput from "../components/WeightInput";

const ManageSession = ({ navigation, route }) => {
  const { sessions, addSession, deleteSession, updateSession } =
    useContext(SessionsContext);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [sessionData, setSessionData] = useState({
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    weightBefore: "",
    weightAfter: "",
    dryWeight: "",
    notes: "",
    preDialysisBP: { systolic: "", diastolic: "" },
    midDialysisBP: { systolic: "", diastolic: "" },
    postDialysisBP: { systolic: "", diastolic: "" },
  });

  const selectedSessionId = route?.params?.selectedSession;
  const isEditing = selectedSessionId;
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Редактировать" : "Новый сеанс",
    });
  }, []);

  useEffect(() => {
    if (isEditing && selectedSession) {
      setSessionData({
        date: new Date(selectedSession.date),
        startTime: new Date(selectedSession.startTime),
        endTime: new Date(selectedSession.endTime),
        weightBefore: selectedSession.weightBefore?.toString() || "",
        weightAfter: selectedSession.weightAfter?.toString() || "",
        dryWeight: selectedSession.dryWeight?.toString() || "",
        notes: selectedSession.notes || "",
        preDialysisBP: {
          systolic: selectedSession.preDialysisBP?.systolic?.toString() || "",
          diastolic: selectedSession.preDialysisBP?.diastolic?.toString() || "",
        },
        midDialysisBP: {
          systolic: selectedSession.midDialysisBP?.systolic?.toString() || "",
          diastolic: selectedSession.midDialysisBP?.diastolic?.toString() || "",
        },
        postDialysisBP: {
          systolic: selectedSession.postDialysisBP?.systolic?.toString() || "",
          diastolic: selectedSession.postDialysisBP?.diastolic?.toString() || "",
        },
      });
    } else if (lastSession) {
      setSessionData((prev) => ({
        ...prev,
        dryWeight: lastSession.dryWeight?.toString() || "",
      }));
    }
  }, []);

  const toNum = (val: string) => (val !== "" ? Number(val) : 0);

  const prevWeightBefore = lastSession?.weightBefore || 50;
  const dryWeightNum =
    sessionData.dryWeight !== "" ? parseFloat(sessionData.dryWeight) : 0;

  function saveHandler() {
    const data = {
      date: getFormattedDate(sessionData.date),
      startTime: sessionData.startTime.toString(),
      endTime: sessionData.endTime.toString(),
      weightBefore: toNum(sessionData.weightBefore),
      weightAfter: toNum(sessionData.weightAfter),
      dryWeight: toNum(sessionData.dryWeight),
      notes: sessionData.notes,
      preDialysisBP: {
        systolic: toNum(sessionData.preDialysisBP.systolic),
        diastolic: toNum(sessionData.preDialysisBP.diastolic),
      },
      midDialysisBP: {
        systolic: toNum(sessionData.midDialysisBP.systolic),
        diastolic: toNum(sessionData.midDialysisBP.diastolic),
      },
      postDialysisBP: {
        systolic: toNum(sessionData.postDialysisBP.systolic),
        diastolic: toNum(sessionData.postDialysisBP.diastolic),
      },
    };

    if (isEditing) {
      updateSession({ ...data, id: selectedSessionId }, selectedSessionId);
    } else {
      addSession(data);
    }
    navigation.goBack();
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.dateTimeRow}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={s.dateBtn}
            >
              <Text style={s.dateBtnText}>
                {getFormattedDate(sessionData.date)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              style={s.timeBtn}
            >
              <Text style={s.timeBtnText}>
                {getFormattedTime(sessionData.startTime.toISOString())}
              </Text>
            </TouchableOpacity>
            <Text style={s.timeDash}>–</Text>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              style={s.timeBtn}
            >
              <Text style={s.timeBtnText}>
                {getFormattedTime(sessionData.endTime.toISOString())}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={sessionData.date}
              mode="date"
              display="calendar"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) setSessionData((p) => ({ ...p, date: d }));
              }}
            />
          )}
          {showStartTimePicker && (
            <DateTimePicker
              value={sessionData.startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(e, t) => {
                setShowStartTimePicker(false);
                if (t) setSessionData((p) => ({ ...p, startTime: t }));
              }}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={sessionData.endTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(e, t) => {
                setShowEndTimePicker(false);
                if (t) setSessionData((p) => ({ ...p, endTime: t }));
              }}
            />
          )}

          <WeightInput
            label="Вес до (кг)"
            value={sessionData.weightBefore}
            onChange={(t) =>
              setSessionData((p) => ({ ...p, weightBefore: t }))
            }
            centerValue={prevWeightBefore}
            rangePadding={3}
          />

          {bpField(
            "Давление до",
            sessionData.preDialysisBP.systolic,
            sessionData.preDialysisBP.diastolic,
            (bp) => setSessionData((p) => ({ ...p, preDialysisBP: bp }))
          )}

          {bpField(
            "Давление 2 ч",
            sessionData.midDialysisBP.systolic,
            sessionData.midDialysisBP.diastolic,
            (bp) => setSessionData((p) => ({ ...p, midDialysisBP: bp }))
          )}

          {bpField(
            "Давление после",
            sessionData.postDialysisBP.systolic,
            sessionData.postDialysisBP.diastolic,
            (bp) => setSessionData((p) => ({ ...p, postDialysisBP: bp }))
          )}

          <WeightInput
            label="Вес после (кг)"
            value={sessionData.weightAfter}
            onChange={(t) =>
              setSessionData((p) => ({ ...p, weightAfter: t }))
            }
            centerValue={dryWeightNum > 0 ? dryWeightNum : prevWeightBefore}
            rangePadding={2}
          />

          <WeightInput
            label="Сухой вес (кг)"
            value={sessionData.dryWeight}
            onChange={(t) =>
              setSessionData((p) => ({ ...p, dryWeight: t }))
            }
            centerValue={dryWeightNum > 0 ? dryWeightNum : prevWeightBefore}
            rangePadding={3}
          />
          {lastSession && !isEditing && lastSession.dryWeight > 0 && (
            <Text style={s.hint}>
              Предыдущий: {lastSession.dryWeight} кг
            </Text>
          )}

          <View style={s.section}>
            <Text style={s.label}>Комментарий</Text>
            <TextInput
              style={s.notesInput}
              placeholder="Заметки"
              multiline={true}
              numberOfLines={3}
              value={sessionData.notes}
              placeholderTextColor="#aaa"
              onChangeText={(t) =>
                setSessionData((p) => ({ ...p, notes: t }))
              }
            />
          </View>

          <View style={s.buttons}>
            <TouchableOpacity style={s.saveBtn} onPress={saveHandler}>
              <Text style={s.saveBtnText}>
                {isEditing ? "Сохранить" : "Добавить"}
              </Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => {
                  deleteSession(selectedSessionId);
                  navigation.goBack();
                }}
              >
                <Text style={s.deleteBtnText}>Удалить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={s.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ManageSession;

const s = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dateBtn: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dateBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2a6cb8",
  },
  timeBtn: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timeBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2a6cb8",
  },
  timeDash: {
    fontSize: 18,
    color: "#999",
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bpSlash: {
    fontSize: 28,
    fontWeight: "600",
    color: "#999",
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    fontSize: 18,
    height: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  hint: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: "#4a90d9",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
