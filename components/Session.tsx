import { Pressable, StyleSheet, Text, View } from "react-native";
import GlobalColors from "../constants/Colors";
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
  notes,
  id,
  preDialysisBP,
  midDialysisBP,
  postDialysisBP,
}) {
  const navigation = useNavigation<NavigationProp>();

  function handlePress(id) {
    navigation.navigate("Manage Session", { selectedSession: id });
  }

  const fluidRemoved = (weightBefore - weightAfter).toFixed(1);

  const formattedStartTime = getFormattedTime(startTime);
  const formattedendTime = getFormattedTime(endTime);

  return (
    <Pressable
      onPress={() => handlePress(id)}
      style={({ pressed }) => [styles.rootContainer, pressed && styles.pressed]}
    >
      <View style={styles.title}>
        <Text style={styles.titleText}>Session {id}</Text>
      </View>


      <View style={styles.container}>
        <View >
          <View style={styles.row}>
            <Ionicons name="calendar" size={16} color="#DB3A3A" />
            <Text>{date}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="scale-outline" size={16} color="#DB3A3A" />
            <Text >
              {weightBefore} kg ➜ {weightAfter} kg
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="analytics" size={16} color="#DB3A3A" />
            <Text >
              До: {preDialysisBP.systolic}/{preDialysisBP.diastolic}
            </Text>
          </View>
        </View>
        <View style={styles.tempContainer}>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color="#DB3A3A" />
            <Text >
              {formattedStartTime} – {formattedendTime}
            </Text>
          </View>
          <View style={[styles.row, { marginRight: "5%" }]}>
            <Ionicons name="water" size={16} color="lightblue" />
            <Text>{fluidRemoved} kg removed</Text>
          </View>
          <View style={[styles.row, { marginRight: "3%" }]}>
            <Ionicons name="analytics" size={16} color="#DB3A3A" />
            <Text >
              После: {postDialysisBP.systolic}/{postDialysisBP.diastolic}
            </Text>
          </View>
          {midDialysisBP && (midDialysisBP.systolic || midDialysisBP.diastolic) ? (
            <View style={styles.row}>
              <Ionicons name="analytics" size={16} color="#DB3A3A" />
              <Text>
                2ч: {midDialysisBP.systolic}/{midDialysisBP.diastolic}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {notes ? (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text-outline" size={16} color="#DB3A3A" />
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default Session;

const styles = StyleSheet.create({

  
  rootContainer: {
    padding: 20,
    backgroundColor: GlobalColors.primary200,
    marginTop: 15,
    marginBottom: 5,
    marginHorizontal: 20,
    borderRadius: 6,
    shadowColor: "red",
    shadowOffset: { height: 1, width: 1 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
    elevation: 1,
  },

  container:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center"
  },

  title: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  titleText: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap:8
  },


  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notesText: {
    marginLeft: 6,
    fontSize: 13,
    fontStyle: "italic",
    color: "#333",
    flexShrink: 1,
  },
});
