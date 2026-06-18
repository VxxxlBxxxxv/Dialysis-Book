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
import { hasValue } from "../util/format";

const OUTER_PAD = 14;
const COMPACT_CHART_HEIGHT = 218;
const PAD_LEFT = 34;
const PAD_RIGHT = 38;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const BP_HIGH = 180;

const DAY_SHADES = [
  "#f8fafc",
  "#eef2f7",
  "#f5f6f8",
  "#eceff3",
  "#f7f7f7",
  "#edf1f5",
  "#f3f5f7",
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

function dateLabel(date: string): string {
  return date.slice(5);
}

function dayShade(date: string): string {
  const dt = new Date(`${date}T00:00:00`);
  const index = Number.isNaN(dt.getTime()) ? 0 : dt.getDay();
  return DAY_SHADES[index];
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
}: {
  width: number;
  height?: number;
  sessions: DialysisSession[];
  large?: boolean;
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

  const [bpMin, bpMax] = compactRange([...bpValues, BP_HIGH], 8);
  const [weightMin, weightMax] = compactRange(weightValues, 0.4);
  const bpSpan = bpMax - bpMin || 1;
  const weightSpan = weightMax - weightMin || 1;
  const plotW = width - PAD_LEFT - PAD_RIGHT;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const slotW = plotW / Math.max(sessions.length, 1);
  const barGap = Math.max(5, Math.min(large ? 14 : 10, slotW / 5));
  const labels = sessions.map((session) => dateLabel(session.date));

  const xAt = (index: number) => PAD_LEFT + slotW * index + slotW / 2;
  const bpY = (value: number) => PAD_TOP + (1 - (value - bpMin) / bpSpan) * plotH;
  const weightY = (value: number) =>
    PAD_TOP + (1 - (value - weightMin) / weightSpan) * plotH;

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
      {sessions.map((session, index) => (
        <Rect
          key={`day-${session.id}`}
          x={PAD_LEFT + slotW * index}
          y={PAD_TOP}
          width={slotW}
          height={plotH}
          fill={dayShade(session.date)}
        />
      ))}

      {bpGrid.map((value) => {
        const y = bpY(value);
        return (
          <G key={`bp-grid-${value}`}>
            <Line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + plotW} y2={y} stroke="#dfe6ef" />
            <SvgText x={PAD_LEFT - 6} y={y + 4} fontSize={large ? 12 : 10} fill="#8a94a3" textAnchor="end">
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
            x={PAD_LEFT + plotW + 7}
            y={y + 4}
            fontSize={large ? 12 : 10}
            fill="#2f80d0"
          >
            {value.toFixed(1)}
          </SvgText>
        );
      })}

      <Line
        x1={PAD_LEFT}
        y1={bpY(BP_HIGH)}
        x2={PAD_LEFT + plotW}
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
        index % labelStep === 0 || index === labels.length - 1 ? (
          <SvgText
            key={`x-${label}-${index}`}
            x={xAt(index)}
            y={height - 7}
            fontSize={large ? 12 : 10}
            fill="#8a94a3"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ) : null
      )}
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
  const longSide = Math.max(width, height) - 38;
  const shortSide = Math.min(width, height) - 38;
  const chartHeight = Math.max(shortSide - 112, 260);

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
          <CombinedTrendChart width={longSide - 28} height={chartHeight} sessions={sessions} large />
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
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
    marginBottom: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 0,
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
    fontSize: 11,
    color: "#666",
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
    fontSize: 18,
    fontWeight: "800",
    color: "#243244",
  },
  fullscreenHint: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: "#2f80d0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
