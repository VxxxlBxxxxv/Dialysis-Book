export type RootStackParamList = {
  "Dialysis Sessions": undefined;
};

export interface HeaderButtonProps {
  name: string;
  size: number;
  color: string;
  id?: number;
  onPress: () => void;
}

export interface ButtonProps {
  onPress: () => void;
  text: string;
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
  // Пульс (уд/мин) при каждом замере давления. Опционально — старые записи
  // без полей открываются через ?.
  pulsePre?: number | null;
  pulseMid?: number | null;
  pulsePost?: number | null;
  // Отмеченные симптомы (подмножество SYMPTOMS). Опционально по той же причине.
  symptoms?: string[];
};
