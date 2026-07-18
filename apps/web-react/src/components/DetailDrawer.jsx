import { IconClose } from "./icons.jsx";

/**
 * DetailDrawer — slide-in panel for record details, listing details, quality reports, etc.
 * The `content` prop is a React node or null.
 */
export default function DetailDrawer({ content, onClose }) {
  const open = content !== null;
  return (
    <>
      <div className="drawer-backdrop" hidden={!open} onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`}>
        {content && (
          <>
            <div className="drawer-head">
              <div style={{ flex: 1 }}>
                {content.title && <p className="eyebrow">{content.eyebrow || "详情"}</p>}
                {content.title && <h2>{content.title}</h2>}
              </div>
              <button className="icon-button" onClick={onClose} title="关闭 (Esc)">
                <IconClose />
              </button>
            </div>
            <div className="drawer-body">
              {content.body}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
