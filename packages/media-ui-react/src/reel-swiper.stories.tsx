import { useState } from "react";
import { useReelSwiper } from "./reel-swiper";

export default { title: "Headless/Reel Swiper" };

const items = ["First reel", "Second reel", "Third reel"];

function ReelExample({ themed = false }: { themed?: boolean }) {
  const [active, setActive] = useState(0);
  const reel = useReelSwiper({ items, onActiveChange: (_item, index) => setActive(index) });
  return <>
    <div>Active: {active + 1}</div>
    <div {...reel.getContainerProps({ style: { height: 360, border: themed ? "6px solid #f43f5e" : "1px solid", borderRadius: themed ? 24 : 0 } })}>
      {items.map((item, index) => <div key={item} {...reel.getItemProps(item, index, {
        style: themed
          ? { minHeight: 360, display: "grid", placeItems: "center", background: index % 2 ? "#4c1d95" : "#881337", color: "white", fontSize: 32 }
          : { minHeight: 360, display: "grid", placeItems: "center", borderBottom: "1px solid" },
      })}>{item}</div>)}
    </div>
  </>;
}

export const Bare = () => <ReelExample />;
export const ConsumerThemed = () => <ReelExample themed />;
