import { useCallback, useState } from "react";
import { useGrid } from "./grid";

export default { title: "Headless/Grid" };

const initialItems = ["Aurora", "Canyon", "Forest", "Ocean"];

function GridExample({ themed = false }: { themed?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const loadMore = useCallback(() => setItems((current) => current.length < 8 ? [...current, `Item ${current.length + 1}`] : current), []);
  const grid = useGrid({ items, onLoadMore: loadMore, hasNextPage: items.length < 8, loading: false });
  return <>
    <div {...grid.getGridProps({
      style: themed
        ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, padding: 20, background: "#111827", color: "#f9fafb", borderRadius: 16 }
        : { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 },
    })}>
      {items.map((item, index) => <div key={item} {...grid.getItemProps(item, index, {
        style: themed ? { padding: 24, background: "#312e81", borderRadius: 12 } : { padding: 8, border: "1px solid" },
      })}>{item}</div>)}
    </div>
    <div ref={grid.sentinelRef}>Load-more sentinel</div>
  </>;
}

export const Bare = () => <GridExample />;
export const ConsumerThemed = () => <GridExample themed />;
