import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Accelerometer from "expo-sensors/build/Accelerometer";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { DialysisSession } from "../types";
import { getFormattedTime } from "../util/date";
import { hasValue } from "../util/format";

const OUTER_PAD = 14;
const COMPACT_CHART_HEIGHT = 248;
const PAD_LEFT = 42;
const PAD_RIGHT = 48;
const PAD_TOP = 32;
const PAD_BOTTOM = 38;
const BP_HIGH = 180;

const WEEKDAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAY_STRIP = [
  "#fee2e2",
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#ede9fe",
  "#e0f2fe",
  "#fde68a",
];
const DAY_SHADES = [
  "#fff7ed",
  "#eff6ff",
  "#f0fdf4",
  "#fffbeb",
  "#f5f3ff",
  "#f0f9ff",
  "#fefce8",
];

const BP_ITEMS = [
  { key: "pre", label: "до", color: "#f3a6a0", offset: -1 },
  { key: "mid", label: "2ч", color: "#e96f64", offset: 0 },
  { key: "post", label: "после", color: "#c0392b", offset: 1 },
] as const;

type BpKey = (typeof BP_ITEMS)[number]["key"];
type BpPoint = { sys: number; dia: number } | null;

type WeightSeries = {
  values: (number | null | undefined)[];
  color: string;
  width: number;
  dashed?: boolean;
};

type ChartDaySelection = {
  session: DialysisSession;
};

function dateLabel(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

function weekdayIndex(date: string): number {
  const dt = new Date(`${date}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? 0 : dt.getDay();
}

function weekdayLabel(date: string): string {
  return WEEKDAY_SHORT[weekdayIndex(date)];
}

function dayShade(date: string): string {
  return DAY_SHADES[weekdayIndex(date)];
}

function dayStripColor(date: string): string {
  return WEEKDAY_STRIP[weekdayIndex(date)];
}

function bpPoint(session: DialysisSession, key: BpKey): BpPoint {
  const bp =
    key === "pre"
      ? session.preDialysisBP
      : key === "mid"
      ? session.midDialysisBP
      : session.postDialysisBP;
  if (!hasValue(bp?.systolic) || !hasValue(bp?.diastolic)) return null;
  return { sys: bp.systolic, dia: bp.diastolic };
}

function compactRange(values: number[], minPad: number): [number, number] {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.12, minPad);
  return [Math.floor(rawMin - pad), Math.ceil(rawMax + pad)];
}

function drawWeightLine({
  series,
  xAt,
  yAt,
}: {
  series: WeightSeries;
  xAt: (index: number) => number;
  yAt: (value: number) => number;
}) {
  const pts = series.values
    .map((value, index) => ({ value, index }))
    .filter((p) => hasValue(p.value)) as { value: number; index: number }[];

  if (pts.length === 0) return null;

  const polyline = pts.map((p) => `${xAt(p.index)},${yAt(p.value)}`).join(" ");

  return (
    <G>
      {pts.length > 1 && (
        <Polyline
          points={polyline}
          fill="none"
          stroke={series.color}
          strokeWidth={series.width}
          strokeDasharray={series.dashed ? "5 4" : undefined}
        />
      )}
      {!series.dashed &&
        pts.map((p) => (
          <Circle
            key={`${series.color}-${p.index}`}
            cx={xAt(p.index)}
            cy={yAt(p.value)}
            r={3.2}
            fill="#fff"
            stroke={series.color}
            strokeWidth={2}
          />
        ))}
    </G>
  );
}

function CombinedTrendChart({
  width,
  height = COMPACT_CHART_HEIGHT,
  sessions,
  large = false,
  selectedSessionId = null,
  onDayPress,
}: {
  width: number;
  height?: number;
  sessions: DialysisSession[];
  large?: boolean;
  selectedSessionId?: string | null;
  onDayPress?: (selection: ChartDaySelection) => void;
}) {
  const bpValues = sessions.flatMap((session) =>
    BP_ITEMS.flatMap((item) => {
      const point = bpPoint(session, item.key);
      return point ? [point.sys, point.dia] : [];
    })
  );
  const weightValues = sessions
    .flatMap((s) => [s.weightBefore, s.weightAfter, s.dryWeight])
    .filter((v): v is number => hasValue(v));

  if (bpValues.length === 0 && weightValues.length === 0) {
    return <Text style={s.empty}>Нет данных для графика</Text>;
  }

  const [bpMin, bpMax] = bpValues.length
    ? compactRange([...bpValues, BP_HIGH], 8)
    : [BP_HIGH - 20, BP_HIGH + 20];
  const [weightMin, weightMax] = weightValues.length
    ? compactRange(weightValues, 0.4)
    : [0, 1];
  const bpSpan = bpMax - bpMin || 1;
  const weightSpan = weightMax - weightMin || 1;
  const padLeft = large ? 52 : PAD_LEFT;
  const padRight = large ? 62 : PAD_RIGHT;
  const padTop = large ? 42 : PAD_TOP;
  const padBottom = large ? 50 : PAD_BOTTOM;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const slotW = plotW / Math.max(sessions.length, 1);
  const barGap = Math.max(6, Math.min(large ? 16 : 11, slotW / 5));
  const labels = sessions.map((session) => dateLabel(session.date));

  const xAt = (index: number) => padLeft + slotW * index + slotW / 2;
  const bpY = (value: number) => padTop + (1 - (value - bpMin) / bpSpan) * plotH;
  const weightY = (value: number) =>
    padTop + (1 - (value - weightMin) / weightSpan) * plotH;

  const bpGrid = [bpMax, Math.round((bpMin + bpMax) / 2), bpMin];
  const weightGrid = [weightMax, weightMin];
  const labelStep = Math.max(1, Math.ceil(sessions.length / (large ? 12 : 7)));

  const weightSeries: WeightSeries[] = [
    {
      values: sessions.map((sn) => sn.weightBefore),
      color: "#8fbbe8",
      width: large ? 2.2 : 1.6,
    },
    {
      values: sessions.map((sn) => sn.weightAfter),
      color: "#2f80d0",
      width: large ? 3 : 2.2,
    },
    {
      values: sessions.map((sn) => sn.dryWeight),
      color: "#1f66b1",
      width: large ? 2 : 1.6,
      dashed: true,
    },
  ];

  return (
    <Svg width={width} height={height}>
      {sessions.map((session, index) => {
        const x = padLeft + slotW * index;
        const selected = session.id === selectedSessionId;
        return (
          <G key={`day-${session.id}`}>
            <Rect x={x} y={padTop} width={slotW} height={plotH} fill={dayShade(session.date)} />
            <Rect x={x} y={padTop - (large ? 31 : 25)} width={slotW} height={large ? 28 : 22} fill={dayStripColor(session.date)} opacity={selected ? 1 : 0.86} />
            <Line x1={x} y1={padTop - (large ? 31 : 25)} x2={x} y2={padTop + plotH} stroke="#cbd5e1" strokeWidth={selected ? 2 : 1} />
            <SvgText
              x={x + slotW / 2}
              y={padTop - (large ? 13 : 10)}
              fontSize={large ? 15 : 12}
              fontWeight="800"
              fill={selected ? "#0f172a" : "#334155"}
              textAnchor="middle"
            >
              {weekdayLabel(session.date)}
            </SvgText>
            {selected && (
              <Rect
                x={x + 1}
                y={padTop - (large ? 31 : 25)}
                width={Math.max(slotW - 2, 1)}
                height={plotH + (large ? 31 : 25)}
                fill="transparent"
                stroke="#1d4ed8"
                strokeWidth={2}
                rx={6}
              />
            )}
          </G>
        );
      })}

      {bpGrid.map((value) => {
        const y = bpY(value);
        return (
          <G key={`bp-grid-${value}`}>
            <Line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#dfe6ef" />
            <SvgText x={padLeft - 8} y={y + 5} fontSize={large ? 15 : 12} fill="#64748b" textAnchor="end">
              {value}
            </SvgText>
          </G>
        );
      })}

      {weightGrid.map((value) => {
        const y = weightY(value);
        return (
          <SvgText
            key={`weight-grid-${value}`}
            x={padLeft + plotW + 9}
            y={y + 5}
            fontSize={large ? 15 : 12}
            fill="#1d4ed8"
          >
            {value.toFixed(1)}
          </SvgText>
        );
      })}

      <Line
        x1={padLeft}
        y1={bpY(BP_HIGH)}
        x2={padLeft + plotW}
        y2={bpY(BP_HIGH)}
        stroke="#c0392b"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {sessions.map((session, index) =>
        BP_ITEMS.map((item) => {
          const point = bpPoint(session, item.key);
          if (!point) return null;
          const x = xAt(index) + item.offset * barGap;
          return (
            <Line
              key={`${session.id}-${item.key}`}
              x1={x}
              x2={x}
              y1={bpY(point.dia)}
              y2={bpY(point.sys)}
              stroke={item.color}
              strokeWidth={large ? 6 : 4}
              strokeLinecap="round"
            />
          );
        })
      )}

      {weightSeries.map((series) => (
        <G key={series.color}>{drawWeightLine({ series, xAt, yAt: weightY })}</G>
      ))}

      {labels.map((label, index) =>
        large || index % labelStep === 0 || index === labels.length - 1 ? (
          <SvgText
            key={`x-${label}-${index}`}
            x={xAt(index)}
            y={height - (large ? 17 : 13)}
            fontSize={large ? 14 : 11}
            fontWeight="700"
            fill="#475569"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ) : null
      )}

      {onDayPress &&
        sessions.map((session, index) => (
          <Rect
            key={`tap-${session.id}`}
            x={padLeft + slotW * index}
            y={padTop - (large ? 31 : 25)}
            width={slotW}
            height={plotH + (large ? 31 : 25)}
            fill="#ffffff"
            opacity={0.01}
            onPress={() => onDayPress({ session })}
          />
        ))}
    </Svg>
  );
}

function Legend({ items }: { items: { color: string; text: string; dashed?: boolean }[] }) {
  return (
    <View style={s.legend}>
      {items.map((it) => (
        <View key={it.text} style={s.legendItem}>
          <View
            style={[
              s.dot,
              {
                backgroundColor: it.dashed ? "transparent" : it.color,
                borderColor: it.color,
                borderWidth: it.dashed ? 2 : 0,
              },
            ]}
          />
          <Text style={s.legendText}>{it.text}</Text>
        </View>
      ))}
    </View>
  );
}

function usePhoneTopRotation(isActive: boolean): "90deg" | "-90deg" {
  const [rotation, setRotation] = useState<"90deg" | "-90deg">("90deg");

  useEffect(() => {
    if (!isActive) return;

    Accelerometer.setUpdateInterval(250);
    const subscription = Accelerometer.addListener(({ x, y }) => {
      // В портретной системе координат X идёт слева направо, Y — снизу вверх.
      // Когда телефон лежит боком, знак X показывает, какая боковая грань стала верхом.
      if (Math.abs(x) > Math.abs(y) + 0.12) {
        setRotation(x >= 0 ? "90deg" : "-90deg");
      }
    });

    return () => subscription.remove();
  }, [isActive]);

  return rotation;
}

function formatPressure(point: BpPoint): string {
  return point ? `${point.sys}/${point.dia}` : "—";
}

function formatWeight(value: number | null | undefined): string {
  return hasValue(value) ? `${value.toFixed(1)} кг` : "—";
}

function DayDataBalloon({ session, onClose }: { session: DialysisSession; onClose: () => void }) {
  const symptoms = session.symptoms?.length ? session.symptoms.join(", ") : "—";

  return (
    <View style={s.balloon}>
      <View style={s.balloonHeader}>
        <Text style={s.balloonTitle}>
          {weekdayLabel(session.date)}, {dateLabel(session.date)} · {getFormattedTime(session.startTime)}–{getFormattedTime(session.endTime)}
        </Text>
        <TouchableOpacity style={s.balloonClose} onPress={onClose}>
          <Text style={s.balloonCloseText}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={s.balloonGrid}>
        <Text style={s.balloonText}>АД до: {formatPressure(bpPoint(session, "pre"))}</Text>
        <Text style={s.balloonText}>АД 2ч: {formatPressure(bpPoint(session, "mid"))}</Text>
        <Text style={s.balloonText}>АД после: {formatPressure(bpPoint(session, "post"))}</Text>
        <Text style={s.balloonText}>Вес до: {formatWeight(session.weightBefore)}</Text>
        <Text style={s.balloonText}>Вес после: {formatWeight(session.weightAfter)}</Text>
        <Text style={s.balloonText}>Сухой вес: {formatWeight(session.dryWeight)}</Text>
      </View>
      <Text style={s.balloonNote}>Симптомы: {symptoms}</Text>
    </View>
  );
}

function FullscreenChartModal({
  visible,
  onClose,
  sessions,
}: {
  visible: boolean;
  onClose: () => void;
  sessions: DialysisSession[];
}) {
  const { width, height } = useWindowDimensions();
  const rotation = usePhoneTopRotation(visible);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const longSide = Math.max(width, height) - 38;
  const shortSide = Math.min(width, height) - 38;
  const chartHeight = Math.max(shortSide - (selectedSession ? 260 : 150), selectedSession ? 250 : 300);

  useEffect(() => {
    if (!visible) setSelectedSessionId(null);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.fullscreenRoot}>
        <View
          style={[
            s.fullscreenPanel,
            {
              width: longSide,
              height: shortSide,
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <View style={s.fullscreenHeader}>
            <View>
              <Text style={s.fullscreenTitle}>Давление и вес</Text>
              <Text style={s.fullscreenHint}>Поворот: {rotation}. Верх выбирается по положению телефона.</Text>
            </View>
            <TouchableOpacity style={s.closeButton} onPress={onClose}>
              <Text style={s.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
          <CombinedTrendChart
            width={longSide - 28}
            height={chartHeight}
            sessions={sessions}
            large
            selectedSessionId={selectedSessionId}
            onDayPress={({ session }) => setSelectedSessionId(session.id)}
          />
          {selectedSession && (
            <DayDataBalloon session={selectedSession} onClose={() => setSelectedSessionId(null)} />
          )}
          <Legend
            items={[
              { color: "#f3a6a0", text: "АД до" },
              { color: "#e96f64", text: "АД 2ч" },
              { color: "#c0392b", text: "АД после / 180" },
              { color: "#8fbbe8", text: "вес до" },
              { color: "#2f80d0", text: "вес после" },
              { color: "#1f66b1", text: "сухой вес", dashed: true },
            ]}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function TrendChart({ sessions }: { sessions: DialysisSession[] }) {
  const { width } = useWindowDimensions();
  const [fullscreen, setFullscreen] = useState(false);
  const chartWidth = width - OUTER_PAD * 2;

  const ordered = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  if (ordered.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.empty}>Пока нет сеансов для графика.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Pressable onPress={() => setFullscreen(true)}>
          <Text style={s.title}>Давление и вес</Text>
          <Text style={s.subtitle}>
            АД — красные столбики от нижнего до верхнего; вес — синяя линия. Нажми для полного экрана.
          </Text>
          <CombinedTrendChart width={chartWidth} sessions={ordered} />
        </Pressable>
        <Legend
          items={[
            { color: "#f3a6a0", text: "АД до" },
            { color: "#e96f64", text: "АД 2ч" },
            { color: "#c0392b", text: "АД после / порог 180" },
            { color: "#8fbbe8", text: "вес до" },
            { color: "#2f80d0", text: "вес после" },
            { color: "#1f66b1", text: "сухой вес", dashed: true },
          ]}
        />
      </ScrollView>
      <FullscreenChartModal
        visible={fullscreen}
        onClose={() => setFullscreen(false)}
        sessions={ordered}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  content: {
    paddingHorizontal: OUTER_PAD,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#243244",
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
    marginBottom: 5,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: "#334155",
  },
  empty: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    marginTop: 30,
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: "#08111f",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenPanel: {
    backgroundColor: "#f4f7fb",
    borderRadius: 18,
    padding: 14,
    justifyContent: "center",
  },
  fullscreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fullscreenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#243244",
  },
  fullscreenHint: {
    fontSize: 14,
    color: "#475569",
    marginTop: 2,
  },
  balloon: {
    backgroundColor: "#ffffff",
    borderColor: "#93c5fd",
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 4,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  balloonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  balloonTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  balloonClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  balloonCloseText: {
    fontSize: 23,
    lineHeight: 25,
    color: "#334155",
    fontWeight: "800",
  },
  balloonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  balloonText: {
    minWidth: 150,
    fontSize: 15,
    color: "#243244",
    fontWeight: "600",
  },
  balloonNote: {
    fontSize: 15,
    color: "#475569",
    marginTop: 6,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#2f80d0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
