import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import GlobalColors from "../constants/Colors";

interface BPStepperProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
}

export default function BPStepper({
  label,
  value,
  onChange,
  step = 1,
}: BPStepperProps) {
  const [editing, setEditing] = useState(false);

  const numericValue = value !== "" ? parseInt(value, 10) : 0;

  const increment = useCallback(() => {
    const next = (isNaN(numericValue) ? 0 : numericValue) + step;
    onChange(next.toString());
  }, [numericValue, step, onChange]);

  const decrement = useCallback(() => {
    const next = (isNaN(numericValue) ? 0 : numericValue) - step;
    if (next >= 0) onChange(next.toString());
  }, [numericValue, step, onChange]);

  const handleManualChange = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange]
  );

  const handleEndEditing = useCallback(() => {
    setEditing(false);
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) onChange("");
  }, [value, onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={decrement}>
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        {editing ? (
          <TextInput
            style={styles.valueInput}
            value={value}
            onChangeText={handleManualChange}
            onEndEditing={handleEndEditing}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.valueDisplay}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.valueText}>
              {value !== "" ? numericValue : "—"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={increment}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlobalColors.primary200,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: GlobalColors.primary700,
  },
  valueDisplay: {
    width: 56,
    height: 40,
    borderRadius: 8,
    backgroundColor: GlobalColors.primary100,
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "500",
  },
  valueInput: {
    width: 56,
    height: 40,
    borderRadius: 8,
    backgroundColor: GlobalColors.primary100,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    padding: 0,
  },
});
