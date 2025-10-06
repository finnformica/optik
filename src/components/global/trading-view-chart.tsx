"use client";

import { useEffect, useRef } from "react";

export interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  theme?: "light" | "dark";
  width?: string;
  height?: string;
  allowSymbolChange?: boolean;
  hideSideToolbar?: boolean;
  hideTopToolbar?: boolean;
  hideLegend?: boolean;
  hideVolume?: boolean;
  backgroundColor?: string;
  gridColor?: string;
  timezone?: string;
  locale?: string;
  autosize?: boolean;
  studies?: string[];
}

export function TradingViewChart({
  symbol,
  interval = "D",
  theme = "dark",
  width = "100%",
  height = "610px",
  allowSymbolChange = true,
  hideSideToolbar = false,
  hideTopToolbar = false,
  hideLegend = false,
  hideVolume = false,
  backgroundColor = "#0f172a",
  gridColor = "rgba(255, 255, 255, 0.05)",
  timezone = "Etc/UTC",
  locale = "en",
  autosize = true,
  studies,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing script
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Clear the container
    containerRef.current.innerHTML = "";

    // Create the widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetContent = document.createElement("div");
    widgetContent.className = "tradingview-widget-container__widget";
    widgetContent.style.height = "calc(100% - 32px)";
    widgetContent.style.width = "100%";

    widgetContainer.appendChild(widgetContent);
    containerRef.current.appendChild(widgetContainer);

    // Create and configure the script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;

    const config = {
      autosize,
      symbol,
      interval,
      timezone,
      theme,
      style: "1",
      locale,
      backgroundColor,
      gridColor,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: hideSideToolbar,
      hide_top_toolbar: hideTopToolbar,
      hide_legend: hideLegend,
      hide_volume: hideVolume,
      ...(studies && { studies }),
      ...(width && !autosize && { width }),
      ...(height && !autosize && { height }),
    };

    script.innerHTML = JSON.stringify(config);
    widgetContainer.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [
    symbol,
    interval,
    theme,
    width,
    height,
    allowSymbolChange,
    hideSideToolbar,
    hideTopToolbar,
    hideLegend,
    hideVolume,
    backgroundColor,
    gridColor,
    timezone,
    locale,
    autosize,
  ]);

  return (
    <div
      ref={containerRef}
      className="tradingview-chart-container overflow-hidden [&_iframe]:rounded-xl"
      style={{
        width: autosize ? "100%" : width,
        height: autosize ? "100%" : height,
        minHeight: "400px",
      }}
    />
  );
}
