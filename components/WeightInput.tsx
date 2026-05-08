import { View, Text, TextInput, StyleSheet } from "react-native";

interface WeightInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  centerValue?: number;
  // legacy props (ignored, kept for compatibility)
  rangePadding?: number;
  rangeBelow?: number;
  rangeAbove?: number;
}

export default function WeightInput({
  label,
  value,
  onChange,
  centerValue = 50,
}: WeightInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder={centerValue.toFixed(1)}
          placeholderTextColor="#bbb"
        />
        <Text style={styles.unit}>кг</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    width: 120,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  unit: {
    fontSize: 18,
    color: "#888",
    fontWeight: "500",
  },
});
