'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, CandlestickData, LineData } from 'lightweight-charts';

interface StockChartProps {
  data: CandlestickData[];
  sma20: LineData[];
  sma50: LineData[];
}

export default function StockChart({ data, sma20, sma50 }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#999',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        rightOffset: 5,
        barSpacing: 6,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data);

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      title: 'SMA20',
    });
    sma20Series.setData(sma20);

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      title: 'SMA50',
    });
    sma50Series.setData(sma50);

    chart.timeScale().fitContent();

    if (window.innerWidth < 768 && data.length > 30) {
      const last = data[data.length - 1].time;
      const first = data[data.length - 30].time;
      chart.timeScale().setVisibleRange({ from: first as any, to: last as any });
    }

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, sma20, sma50]);

  return <div ref={chartContainerRef} className="w-full h-full min-h-[250px]" />;
}
