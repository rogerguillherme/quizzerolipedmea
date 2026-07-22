import { useEffect, useState } from "react";
import { MapaPage } from "@/routes/mapa";

/**
 * Popup fullscreen que hospeda o fluxo do Mapa do Lipedema.
 * Usa um portal manual em vez do Dialog do shadcn para permitir o layout
 * total customizado do quiz (paleta creme/dourada, header próprio etc.).
 */
export function MapaQuizDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto transition-opacity duration-200"
      style={{
        opacity: open ? 1 : 0,
        background: "#F5EFE1",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mapa do Lipedema"
    >
      <MapaPage onClose={onClose} />
    </div>
  );
}
