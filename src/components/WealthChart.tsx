import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from 'chart.js'
import { useEffect, useRef } from 'react'
import type { YearProjection } from '../types'

ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

interface WealthChartProps {
  isUnlocked: boolean
  displayedYears: YearProjection[]
  retireYear: number
}

export function WealthChart({ isUnlocked, displayedYears, retireYear }: WealthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const yearsRef = useRef<YearProjection[]>(displayedYears)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const chart = new ChartJS(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Expected Mean Net Worth (Nominal)',
            data: [],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
          },
          {
            label: 'Median (50th Percentile — Nominal)',
            data: [],
            borderColor: '#c084fc',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
          },
          {
            label: '10th Percentile (P10 Stress Test — Nominal)',
            data: [],
            borderColor: '#fb7185',
            backgroundColor: 'rgba(251, 113, 133, 0.05)',
            borderWidth: 1.5,
            borderDash: [4, 4],
            fill: true,
            tension: 0.2,
          },
          {
            label: "Real Net Worth (Inflation-Adjusted Today's $)",
            data: [],
            borderColor: '#22c55e',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.2,
          },
          {
            label: 'Wealth Target Baseline (Spend ÷ SWR)',
            data: [],
            borderColor: '#f59e0b',
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            labels: {
              color: '#8b929e',
              boxWidth: 12,
              padding: 12,
              font: { family: "'DM Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#191c22',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            titleColor: '#f2f4f7',
            bodyColor: '#c9ced6',
            titleFont: { family: "'Space Grotesk', sans-serif", size: 13, weight: 600 },
            bodyFont: { family: "'DM Mono', monospace", size: 11 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label(context: TooltipItem<'line'>) {
                const raw = Number(context.raw ?? 0)
                return `${context.dataset.label}: $${Math.round(raw).toLocaleString()}`
              },
              afterBody(context: TooltipItem<'line'>[]) {
                if (!context || !context.length) return []
                const idx = context[0].dataIndex
                const yrObj = yearsRef.current[idx]
                if (!yrObj) return []
                const lines: string[] = []
                if (yrObj.isBaseline) {
                  lines.push('Baseline (2027): Actual Current Net Worth')
                } else if (yrObj.isWorking) {
                  lines.push(`Working Phase: Saving +$${Math.round(yrObj.cashFlow).toLocaleString()}/yr`)
                } else {
                  lines.push(
                    `Retirement Phase: Withdrawal -$${Math.round(Math.abs(yrObj.cashFlow)).toLocaleString()}/yr (-$${Math.round(Math.abs(yrObj.realCashFlow)).toLocaleString()} in today's $)`,
                  )
                }
                if (yrObj.houseDeduction > 0) {
                  lines.push(
                    `House Down Payment: -$${Math.round(yrObj.houseDeduction).toLocaleString()} (Age ${yrObj.age}, ${yrObj.year})`,
                  )
                }
                lines.push(
                  `Median (P50 Real): $${Math.round(yrObj.p50Real || 0).toLocaleString()} in today's $`,
                )
                lines.push(
                  `Stress Test (P10 Real): $${Math.round(yrObj.p10Real || 0).toLocaleString()} in today's $ (Survival: ${(yrObj.survivalRate ?? 100).toFixed(1)}%)`,
                )
                if (!yrObj.isBaseline || yrObj.houseDeduction > 0) {
                  const netSign = yrObj.netChange >= 0 ? '+' : '-'
                  lines.push(
                    `Net Annual Portfolio Delta: ${netSign}$${Math.round(Math.abs(yrObj.netChange)).toLocaleString()}/yr (${yrObj.netChange >= 0 ? 'Growing' : 'Drawing Down'})`,
                  )
                }
                return lines
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8b929e',
              font: { family: "'DM Mono', monospace", size: 10 },
              maxTicksLimit: 12,
            },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8b929e',
              font: { family: "'DM Mono', monospace", size: 10 },
              callback(value) {
                const num = Number(value)
                if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M'
                return '$' + Math.round(num / 1000) + 'k'
              },
            },
          },
        },
      },
    })

    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    yearsRef.current = displayedYears
    const chart = chartRef.current
    if (!chart) return

    const labels = displayedYears.map((y) => {
      if (y.year === retireYear && y.houseDeduction > 0)
        return `${y.year} (Age ${y.age} — RETIRED + HOUSE)`
      if (y.year === retireYear) return `${y.year} (Age ${y.age} — RETIRED)`
      if (y.houseDeduction > 0) return `${y.year} (Age ${y.age} — HOUSE)`
      return `${y.year} (Age ${y.age})`
    })

    chart.data.labels = labels

    if (!isUnlocked) {
      chart.data.datasets.forEach((ds) => {
        ds.data = []
      })
      chart.update()
      return
    }

    const isLong = displayedYears.length > 25

    chart.data.datasets[0].data = displayedYears.map((y) => y.nominal)
    chart.data.datasets[0].pointRadius = displayedYears.map((y) =>
      y.year === retireYear ? 7 : isLong ? 1.5 : 3,
    )
    chart.data.datasets[0].pointBackgroundColor = displayedYears.map((y) =>
      y.year === retireYear ? '#fbbf24' : '#3b82f6',
    )

    chart.data.datasets[1].data = displayedYears.map((y) => y.p50Nominal)
    chart.data.datasets[1].pointRadius = displayedYears.map((y) =>
      y.year === retireYear ? 6 : isLong ? 1 : 2.5,
    )
    chart.data.datasets[1].pointBackgroundColor = displayedYears.map((y) =>
      y.year === retireYear ? '#fbbf24' : '#c084fc',
    )

    chart.data.datasets[2].data = displayedYears.map((y) => y.p10Nominal)
    chart.data.datasets[2].pointRadius = displayedYears.map((y) =>
      y.year === retireYear ? 6 : isLong ? 1 : 2,
    )
    chart.data.datasets[2].pointBackgroundColor = displayedYears.map((y) =>
      y.year === retireYear ? '#fbbf24' : '#fb7185',
    )

    chart.data.datasets[3].data = displayedYears.map((y) => y.real)
    chart.data.datasets[3].pointRadius = displayedYears.map((y) =>
      y.year === retireYear ? 7 : isLong ? 1.5 : 3,
    )
    chart.data.datasets[3].pointBackgroundColor = displayedYears.map((y) =>
      y.year === retireYear ? '#fbbf24' : '#10b981',
    )

    chart.data.datasets[4].data = displayedYears.map((y) => y.target)
    chart.update()
  }, [isUnlocked, displayedYears, retireYear])

  return (
    <div className="chart-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  )
}
