export type RootStackParamList = {
  "Dialysis Sessions": undefined;
};

export interface HeaderButtonProps {
  name: string;
  size: number;
  color: string;
  id: number;
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
};
