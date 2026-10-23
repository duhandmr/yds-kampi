import { EXAM_KIND_LABELS, type ExamKindKey } from "@/lib/constants";
import { formatDateKeyTr } from "@/lib/dates";

/**
 * Son denemelerin başarı yüzdesi. Grafik SVG olarak çizilir; aynı veri ekran okuyucular için tablo olarak da sunulur.
 * Her çubuğun üstünde değer etiketi bulunduğundan bilgi yalnızca renge bağlı değildir.
 */
export function ScoreTrendChart({ data }: { data: Array<{ id: string; date: string; score: number; kind: string }> }) {
  if (data.length === 0) return <p className="text-[15px] text-zinc-700 dark:text-zinc-300">İlk denemeni tamamladığında gelişim grafiğin burada görünecek.</p>;
  const width = 320;
  const height = 160;
  const barGap = 10;
  const barWidth = (width - barGap * (data.length + 1)) / data.length;
  const summary = data.map((d) => `${formatDateKeyTr(d.date)}: %${d.score}`).join(", ");

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height + 24}`} role="img" aria-label={`Son ${data.length} denemenin başarı yüzdeleri: ${summary}`} className="h-48 w-full">
        {[25, 50, 75, 100].map((g) => {
          const y = height - (g / 100) * (height - 20);
          return (
            <g key={g}>
              <line x1={0} x2={width} y1={y} y2={y} className="stroke-zinc-200 dark:stroke-zinc-700" strokeDasharray="3 4" />
              <text x={2} y={y - 2} className="fill-zinc-500 text-[9px] dark:fill-zinc-400">
                %{g}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = Math.max(3, (d.score / 100) * (height - 20));
          const x = barGap + i * (barWidth + barGap);
          const y = height - h;
          return (
            <g key={d.id}>
              <rect x={x} y={y} width={barWidth} height={h} rx={6} className="fill-brand-600 dark:fill-brand-400" />
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-zinc-800 text-[11px] font-semibold dark:fill-zinc-100">
                %{Math.round(d.score)}
              </text>
              <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" className="fill-zinc-600 text-[9px] dark:fill-zinc-400">
                {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>Son denemeler</caption>
          <thead>
            <tr>
              <th scope="col">Tarih</th>
              <th scope="col">Tür</th>
              <th scope="col">Başarı</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td>{formatDateKeyTr(d.date)}</td>
                <td>{EXAM_KIND_LABELS[d.kind as ExamKindKey] ?? d.kind}</td>
                <td>%{d.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
