'use client'

export default function FrameBox({
  children,
  className = '',
  style,

  top,
  bottom,
  left,
  right,

  // ✅ سمك كل ضلع (من أبعاد ملفاتك)
  topH = 4,
  bottomH = 4,
  leftW = 4,
  rightW = 4,

  // مساحة داخلية زيادة غير سمك الإطار (حسب الفيجما)
  innerPad = 12,

  // لو عايز خلفية جوه الإطار (اختياري)
  innerBg = 'transparent',
  innerClassName = '',
}) {
  const padTop = topH + innerPad
  const padBottom = bottomH + innerPad
  const padLeft = leftW + innerPad
  const padRight = rightW + innerPad

  return (
    <div className={`relative ${className}`} style={style}>
      {/* ✅ borders */}
      {top ? (
        <img
          src={top}
          alt=""
          draggable={false}
          className="pointer-events-none select-none absolute left-0 right-0 top-0 w-full"
          style={{ height: topH }}
        />
      ) : null}

      {bottom ? (
        <img
          src={bottom}
          alt=""
          draggable={false}
          className="pointer-events-none select-none absolute left-0 right-0 bottom-0 w-full"
          style={{ height: bottomH }}
        />
      ) : null}

      {left ? (
        <img
          src={left}
          alt=""
          draggable={false}
          className="pointer-events-none select-none absolute left-0 top-0 bottom-0 h-full"
          style={{ width: leftW }}
        />
      ) : null}

      {right ? (
        <img
          src={right}
          alt=""
          draggable={false}
          className="pointer-events-none select-none absolute right-0 top-0 bottom-0 h-full"
          style={{ width: rightW }}
        />
      ) : null}

      {/* ✅ inner area */}
      <div
        className={`relative z-[1] ${innerClassName}`}
        style={{
          paddingTop: padTop,
          paddingBottom: padBottom,
          paddingLeft: padLeft,
          paddingRight: padRight,
          background: innerBg,
        }}
      >
        {children}
      </div>
    </div>
  )
}
