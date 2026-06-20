import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type RootStackParamList = {
  "Dialysis Sessions": undefined;
};

export interface HeaderButtonProps {
  name: ComponentProps<typeof Ionicons>["name"];
  size: number;
  color: string;
  id?: number;
  onPress: () => void;
}

export interface ButtonProps {
  onPress: () => void;
  text: string;
  style?: StyleProp<ViewStyle>;
}

export type BloodPressure = {
  systolic: number | null;
  diastolic: number | null;
};

export type DialysisSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  weightBefore: number | null;
  weightAfter: number | null;
  dryWeight: number | null;
  notes?: string;
  preDialysisBP: BloodPressure;
  midDialysisBP: BloodPressure;
  postDialysisBP: BloodPressure;
  // Время фактического ввода каждого замера давления. Опционально — старые
  // записи открываются без этих полей.
  preDialysisBPEnteredAt?: string | null;
  midDialysisBPEnteredAt?: string | null;
  postDialysisBPEnteredAt?: string | null;
  // Пульс (уд/мин) при каждом замере давления. Опционально — старые записи
  // без полей открываются через ?.
  pulsePre?: number | null;
  pulseMid?: number | null;
  pulsePost?: number | null;
  // Отмеченные симптомы (подмножество SYMPTOMS). Опционально по той же причине.
  symptoms?: string[];
  // Дата, когда сеанс попал в Markdown-экспорт. Нужна, чтобы повторный экспорт
  // отдавал только новые сеансы.
  exportedAt?: string | null;
};
