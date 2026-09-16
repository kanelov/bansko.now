"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Прегледът 16:9 в портала е същата страница /display/<token>?preview=1 в
 * <iframe>, мащабирана от 1920 × 1080 към ширината на картата. Каквото е тук,
 * това е на телевизора - една и съща страница, не приближение. Страницата
 * казва през postMessage дали менюто се събира.
 */
export function DisplayPreview({ src, refreshKey }: { src: string; refreshKey: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [overflow, setOverflow] = useState<boolean | null>(null);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const update = () => setScale(element.clientWidth / 1920);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data as { type?: string; overflow?: boolean } | null;
      if (data && data.type === "bn-display" && typeof data.overflow === "boolean") {
        setOverflow(data.overflow);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return (
    <div>
      <div ref={frameRef} className="relative w-full overflow-hidden rounded-2xl border border-[var(--stone)] bg-black" style={{ paddingTop: "56.25%" }}>
        <iframe
          key={refreshKey}
          src={src}
          title="Преглед на екрана"
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
          tabIndex={-1}
        />
      </div>
      {overflow === true ? (
        <p className="mt-2 rounded-2xl bg-clay/15 px-4 py-3 text-sm" role="status">
          Не се събира на екрана: махни категория или изключи описанията.
        </p>
      ) : overflow === false ? (
        <p className="mt-2 text-xs text-stone-650">Събира се на екрана.</p>
      ) : null}
    </div>
  );
}
