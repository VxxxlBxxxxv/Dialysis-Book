import { useState, useCallback } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import GlobalColors from "../constants/Colors";

interface WeightInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_MIN = 45;
const DEFAULT_MAX = 55;
const STEP = 0.1;
const RANGE_PADDING = 5;

export default function WeightInput({
  label,
  value,
  onChange,
}: WeightInputProps) {
  const [rangeMin, setRangeMin] = useState(DEFAULT_MIN);
  const [rangeMax, setRangeMax] = useState(DEFAULT_MAX);

  const numericValue = value !== "" ? parseFloat(value) : 0;

  const adaptRange = useCallback((val: number) => {
    const center = Math.round(val);
    setRangeMin(center - RANGE_PADDING);
    setRangeMax(center + RANGE_PADDING);
  }, []);

  const handleSliderChange = useCallback(
    (sliderValue: number) => {
      const formatted = sliderValue.toFixed(1);
      onChange(formatted);
    },
    [onChange]
  );

  const handleManualInput = useCallback(
    (text: string) => {
      onChange(text);
      const num = parseFloat(text);
      if (
        !isNaN(num) &&
        text.length > 0 &&
        text.indexOf(".") !== text.length - 1
      ) {
        if (num < rangeMin || num > rangeMax) {
          adaptRange(num);
        }
      }
    },
    [onChange, rangeMin, rangeMax, adaptRange]
  );

  const handleEndEditing = useCallback(() => {
    const num = parseFloat(value);
    if (!isNaN(num) && value.length > 0) {
      const clamped = Math.max(rangeMin, Math.min(rangeMax, num));
      if (clamped !== num) {
        adaptRange(num);
      }
    }
  }, [value, rangeMin, rangeMax, adaptRange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.sliderRow}>
        <Text style={styles.rangeLabel}>{rangeMin.toFixed(0)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={rangeMin}
          maximumValue={rangeMax}
          step={STEP}
          value={isNaN(numericValue) ? rangeMin : numericValue}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={GlobalColors.primary600}
          maximumTrackTintColor={GlobalColors.primary200}
          thumbTintColor={GlobalColors.primary700}
        />
        <Text style={styles.rangeLabel}>{rangeMax.toFixed(0)}</Text>
      </View>

      <View style={styles.valueRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleManualInput}
          onEndEditing={handleEndEditing}
          keyboardType="numeric"
          placeholder="Введите вес"
          placeholderTextColor="gray"
        />
        <Text style={styles.unit}>кг</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 40,
  },
  rangeLabel: {
    fontSize: 12,
    color: GlobalColors.primary700,
    width: 28,
    textAlign: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: GlobalColors.primary100,
    fontSize: 16,
    fontWeight: "500",
    width: 100,
    textAlign: "center",
  },
  unit: {
    fontSize: 14,
    color: "#666",
  },
});
