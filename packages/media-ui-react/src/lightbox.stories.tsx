import { useState } from "react";
import { useLightbox, type LightboxImageItem } from "./lightbox";

export default { title: "Headless/Lightbox" };

const items: LightboxImageItem[] = [
  { src: "https://picsum.photos/id/10/800/500", alt: "A forest landscape" },
  { src: "https://picsum.photos/id/28/800/500", alt: "A mountain landscape" },
];

function OpenLightbox({ onClose, themed }: { onClose(): void; themed: boolean }) {
  const lightbox = useLightbox({ items, onClose });
  return <div {...lightbox.getOverlayProps({
    style: themed ? { padding: 24, background: "#18181b", color: "white", borderRadius: 18, maxWidth: 840 } : undefined,
  })}>
    <img {...lightbox.getImageProps({ style: { display: "block", maxWidth: "100%" } })} />
    <div style={{ display: "flex", gap: 8 }}>
      <button {...lightbox.getPrevButtonProps()}>Previous</button>
      <button {...lightbox.getNextButtonProps()}>Next</button>
      <button {...lightbox.getCloseButtonProps()}>Close</button>
    </div>
  </div>;
}

function LightboxExample({ themed = false }: { themed?: boolean }) {
  const [open, setOpen] = useState(false);
  return open ? <OpenLightbox themed={themed} onClose={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>Open lightbox</button>;
}

export const Bare = () => <LightboxExample />;
export const ConsumerThemed = () => <LightboxExample themed />;
