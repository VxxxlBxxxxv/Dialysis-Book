import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DialysisSession } from "../types";
import { hasValue } from "../util/format";

const CHART_HEIGHT = 120;
const COLUMN_WIDTH = 44;
const BAR_WIDTH = 14;

type Column = {
  label: string; // дата (день)
  before: number | null;
  after: number | null;
};

// Один мини-график: столбики «до» (синий) и «после» по сеансам.
// reference — пунктирная линия порога (напр. 180 для давления).
function MiniBars({
  columns,
  unit,
  reference,
  afterColor,
}: {
  columns: Column[];
  unit: string;
  reference?: number;
  afterColor: string;
}) {
  const values = columns
    .flatMap((c) => [c.before, c.after])
    .filter((v): v is number => hasValue(v));

  if (values.length === 0) {
    return <Text style={s.empty}>Нет данных</Text>;
  }

  // Диапазон с запасом, чтобы столбики не упирались в края.
  const rawMin = Math.min(...values, reference ?? Infinity);
  const rawMax = Math.max(...values, reference ?? -Infinity);
  const pad = Math.max((rawMax - rawMin) * 0.15, 2);
  const min = Math.floor(rawMin - pad);
  const max = Math.ceil(rawMax + pad);
  const span = max - min || 1;

  const toHeight = (v: number) => ((v - min) / span) * CHART_HEIGHT;

  const refTop =
    reference != null ? CHART_HEIGHT - toHeight(reference) : null;

  return (
    <View>
      <View style={s.plotRow}>
        {/* ось Y: подписи min/max */}
        <View style={s.yAxis}>
          <Text style={s.axisLabel}>{max}</Text>
          <Text style={s.axisLabel}>{min}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[s.plot, { height: CHART_HEIGHT }]}>
            {refTop != null && (
              <View style={[s.refLine, { top: refTop }]}>
                <Text style={s.refLabel}>{reference}</Text>
              </View>
            )}
            {columns.map((c, i) => (
              <View key={i} style={[s.column, { width: COLUMN_WIDTH }]}>
                <View style={s.bars}>
                  {hasValue(c.before) && (
                    <View
                      style={[
                        s.bar,
                        {
                          height: toHeight(c.before),
                          width: BAR_WIDTH / 2 + 1,
                          backgroundColor: "#9bbce0",
                        },
                      ]}
                    />
                  )}
                  {hasValue(c.after) && (
                    <View
                      style={[
                        s.bar,
                        {
                          height: toHeight(c.after),
                          width: BAR_WIDTH / 2 + 1,
                          backgroundColor: afterColor,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* подписи дат под графиком */}
      <View style={s.labelsRow}>
        <View style={s.yAxisSpacer} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.row}>
            {columns.map((c, i) => (
              <Text key={i} style={[s.dateLabel, { width: COLUMN_WIDTH }]}>
                {c.label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: "#9bbce0" }]} />
          <Text style={s.legendText}>до</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: afterColor }]} />
          <Text style={s.legendText}>после ({unit})</Text>
        </View>
      </View>
    </View>
  );
}

export default function TrendChart({
  sessions,
}: {
  sessions: DialysisSession[];
}) {
  // По возрастанию даты, последние 14 сеансов.
  const ordered = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const dayLabel = (date: string) => date.slice(5); // MM-DD

  const bpColumns: Column[] = ordered.map((sn) => ({
    label: dayLabel(sn.date),
    before: sn.preDialysisBP?.systolic ?? null,
    after: sn.postDialysisBP?.systolic ?? null,
  }));

  const weightColumns: Column[] = ordered.map((sn) => ({
    label: dayLabel(sn.date),
    before: sn.weightBefore,
    after: sn.weightAfter,
  }));

  if (ordered.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.empty}>Пока нет сеансов для графика.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Давление, верхнее (мм рт.ст.)</Text>
      <MiniBars
        columns={bpColumns}
        unit="мм рт.ст."
        reference={180}
        afterColor="#e74c3c"
      />

      <Text style={[s.title, s.titleGap]}>Вес (кг)</Text>
      <MiniBars columns={weightColumns} unit="кг" afterColor="#4a90d9" />

      <Text style={s.hint}>
        Красная линия 180 — порог, при превышении сообщить врачу.
      </Text>
    </ScrollView>
  );
}

const Y_AXIS_WIDTH = 34;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  titleGap: {
    marginTop: 18,
  },
  plotRow: {
    flexDirection: "row",
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 4,
  },
  yAxisSpacer: {
    width: Y_AXIS_WIDTH,
  },
  axisLabel: {
    fontSize: 12,
    color: "#999",
  },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6ecf5",
    position: "relative",
  },
  column: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  refLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: 1,
    borderTopColor: "#e74c3c",
    borderStyle: "dashed",
  },
  refLabel: {
    position: "absolute",
    right: 2,
    top: -14,
    fontSize: 11,
    color: "#e74c3c",
    fontWeight: "700",
  },
  labelsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
  },
  dateLabel: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#555",
  },
  empty: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  hint: {
    fontSize: 13,
    color: "#999",
    marginTop: 24,
    fontStyle: "italic",
  },
});
