import React, { useId } from "react";

export default function CircularProgress({
  size = 140,
  stroke = 14,
  percentage = 0,
  color1 = "#4f8cff",
  color2 = "#7bb3ff",
  label,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference - (pct / 100) * circumference;
  const reactId = useId();
  const gradId = `grad-${reactId.replace(/:/g, "")}`;

  return (
    <div
      className="circular-progress"
      aria-label={label ? `${label} ${pct}%` : `${pct}%`}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        className="circular-progress__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
          fill="none"
          className="circular-progress__track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="circular-progress__value"
          style={{
            transition: "stroke-dashoffset 700ms cubic-bezier(.2,.9,.3,1)",
          }}
        />
      </svg>

      <div
        className="circular-progress__content"
        style={{
          position: "absolute",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div className="circular-progress__value-text">{pct}%</div>
        {label && (
          <div className="circular-progress__label">{label}</div>
        )}
      </div>
    </div>
  );
}
