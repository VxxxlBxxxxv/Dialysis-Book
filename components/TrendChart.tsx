import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { DialysisSession } from "../types";
import { hasValue } from "../util/format";

const OUTER_PAD = 14;
const CHART_HEIGHT = 132;
const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

type Series = {
  values: (number | null | undefined)[];
  color: string;
  legend: string;
};

type Reference = { value: number; color: string };

// Один компактный линейный график, вписанный в заданную ширину (без прокрутки).
function LineChart({
  width,
  series,
  labels,
  reference,
}: {
  width: number;
  series: Series[];
  labels: string[];
  reference?: Reference;
}) {
  const all = series
    .flatMap((s) => s.values)
    .filter((v): v is number => hasValue(v));

  if (all.length === 0) {
    return <Text style={s.empty}>Нет данных</Text>;
  }

  const refVal = reference?.value;
  const rawMin = Math.min(...all, refVal ?? Infinity);
  const rawMax = Math.max(...all, refVal ?? -Infinity);
  const pad = Math.max((rawMax - rawMin) * 0.15, 2);
  const min = Math.floor(rawMin - pad);
  const max = Math.ceil(rawMax + pad);
  const span = max - min || 1;
  const mid = Math.round((min + max) / 2);

  const plotW = width - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const n = labels.length;

  const xAt = (i: number) =>
    PAD_LEFT + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => PAD_TOP + (1 - (v - min) / span) * plotH;

  const gridLines = [max, mid, min];

  // Сколько подписей дат показать, чтобы не слипались (≈ каждые 60px).
  const maxLabels = Math.max(2, Math.floor(plotW / 56));
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      {/* горизонтальная сетка + подписи оси Y */}
      {gridLines.map((g, i) => {
        const y = yAt(g);
        return (
          <Line
            key={`g${i}`}
            x1={PAD_LEFT}
            y1={y}
            x2={PAD_LEFT + plotW}
            y2={y}
            stroke="#eef2f7"
            strokeWidth={1}
          />
        );
      })}
      {gridLines.map((g, i) => (
        <SvgText
          key={`gl${i}`}
          x={PAD_LEFT - 6}
          y={yAt(g) + 4}
          fontSize={10}
          fill="#aaa"
          textAnchor="end"
        >
          {g}
        </SvgText>
      ))}

      {/* пороговая линия */}
      {reference && reference.value >= min && reference.value <= max && (
        <Line
          x1={PAD_LEFT}
          y1={yAt(reference.value)}
          x2={PAD_LEFT + plotW}
          y2={yAt(reference.value)}
          stroke={reference.color}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}

      {/* линии серий */}
      {series.map((serie, si) => {
        const pts = labels
          .map((_, i) => ({ i, v: serie.values[i] }))
          .filter((p) => hasValue(p.v)) as { i: number; v: number }[];
        const polyline = pts.map((p) => `${xAt(p.i)},${yAt(p.v)}`).join(" ");
        return (
          <G key={`serie${si}`}>
            {pts.length > 1 && (
              <Polyline
                points={polyline}
                fill="none"
                stroke={serie.color}
                strokeWidth={2}
              />
            )}
            {pts.map((p) => (
              <Circle
                key={`c${si}-${p.i}`}
                cx={xAt(p.i)}
                cy={yAt(p.v)}
                r={3}
                fill={serie.color}
              />
            ))}
          </G>
        );
      })}

      {/* подписи дат по оси X */}
      {labels.map((lab, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <SvgText
            key={`x${i}`}
            x={xAt(i)}
            y={CHART_HEIGHT - 6}
            fontSize={10}
            fill="#999"
            textAnchor="middle"
          >
            {lab}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

function Legend({ items }: { items: { color: string; text: string }[] }) {
  return (
    <View style={s.legend}>
      {items.map((it) => (
        <View key={it.text} style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: it.color }]} />
          <Text style={s.legendText}>{it.text}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TrendChart({
  sessions,
}: {
  sessions: DialysisSession[];
}) {
  const { width } = useWindowDimensions();
  const chartWidth = width - OUTER_PAD * 2;

  const ordered = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const labels = ordered.map((sn) => sn.date.slice(5)); // MM-DD

  if (ordered.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.empty}>Пока нет сеансов для графика.</Text>
      </View>
    );
  }

  const bpSeries: Series[] = [
    {
      values: ordered.map((sn) => sn.preDialysisBP?.systolic),
      color: "#9bbce0",
      legend: "до",
    },
    {
      values: ordered.map((sn) => sn.postDialysisBP?.systolic),
      color: "#e74c3c",
      legend: "после",
    },
  ];

  const weightSeries: Series[] = [
    {
      values: ordered.map((sn) => sn.weightBefore),
      color: "#9bbce0",
      legend: "до",
    },
    {
      values: ordered.map((sn) => sn.weightAfter),
      color: "#4a90d9",
      legend: "после",
    },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Давление верхнее (мм рт.ст.)</Text>
      <LineChart
        width={chartWidth}
        series={bpSeries}
        labels={labels}
        reference={{ value: 180, color: "#e74c3c" }}
      />
      <Legend
        items={[
          { color: "#9bbce0", text: "до" },
          { color: "#e74c3c", text: "после" },
          { color: "#e74c3c", text: "порог 180" },
        ]}
      />

      <Text style={[s.title, s.titleGap]}>Вес (кг)</Text>
      <LineChart width={chartWidth} series={weightSeries} labels={labels} />
      <Legend
        items={[
          { color: "#9bbce0", text: "до" },
          { color: "#4a90d9", text: "после" },
        ]}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  content: {
    paddingHorizontal: OUTER_PAD,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 2,
  },
  titleGap: {
    marginTop: 10,
  },
  legend: {
    flexDirection: "row",
    gap: 14,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  empty: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    marginTop: 30,
  },
});
