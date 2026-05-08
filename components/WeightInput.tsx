import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

interface WeightInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  centerValue?: number;
  rangePadding?: number;
}

const STEP = 0.1;

export default function WeightInput({
  label,
  value,
  onChange,
  centerValue = 50,
  rangePadding = 3,
}: WeightInputProps) {
  const [rangeMin, setRangeMin] = useState(centerValue - rangePadding);
  const [rangeMax, setRangeMax] = useState(centerValue + rangePadding);

  useEffect(() => {
    if (centerValue > 0) {
      setRangeMin(centerValue - rangePadding);
      setRangeMax(centerValue + rangePadding);
    }
  }, [centerValue, rangePadding]);

  const numericValue = value !== "" ? parseFloat(value) : centerValue;

  const handleSliderChange = useCallback(
    (sliderValue: number) => {
      onChange(sliderValue.toFixed(1));
    },
    [onChange]
  );

  const handleManualInput = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleManualInput}
          keyboardType="numeric"
          placeholder={centerValue.toFixed(1)}
          placeholderTextColor="#bbb"
        />
        <Text style={styles.unit}>кг</Text>
        <View style={styles.sliderWrap}>
          <Text style={styles.rangeLabel}>{rangeMin.toFixed(0)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={rangeMin}
            maximumValue={rangeMax}
            step={STEP}
            value={numericValue}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#4a90d9"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#2a6cb8"
          />
          <Text style={styles.rangeLabel}>{rangeMax.toFixed(0)}</Text>
        </View>
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
    width: 90,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  unit: {
    fontSize: 16,
    color: "#888",
  },
  sliderWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 44,
  },
  rangeLabel: {
    fontSize: 13,
    color: "#999",
    width: 24,
    textAlign: "center",
  },
});
