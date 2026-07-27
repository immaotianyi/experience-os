import { useEffect, useRef } from "react";
import { IconClose } from "./icons.jsx";

/**
 * DetailDrawer — slide-in panel for record details, listing details, quality reports, etc.
 * The `content` prop is a React node or null.
 *
 * 可访问性：
 * - 打开时焦点自动移到关闭按钮；
 * - Tab / Shift+Tab 在抽屉内循环（焦点陷阱）；
 * - 关闭后焦点恢复到打开前的触发元素；
 * - Esc 键关闭（由 App.jsx 全局监听）。
 */
export default function DetailDrawer({ content, onClose }) {
  const open = content !== null;
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const prevFocusRef = useRef(null);

  // 焦点管理：打开时聚焦关闭按钮，关闭时恢复焦点
  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
      // 延迟一帧让 DOM 渲染后再聚焦
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    // 关闭时恢复焦点
    if (prevFocusRef.current?.focus) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [open]);

  // 焦点陷阱：Tab / Shift+Tab 在抽屉内循环
  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusable = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className="drawer-backdrop" hidden={!open} onClick={onClose} aria-hidden="true" />
      {open && (
      <aside
        ref={drawerRef}
        className={`drawer ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={content?.title || "详情"}
        onKeyDown={handleKeyDown}
      >
        {content && (
          <>
            <div className="drawer-head">
              <div style={{ flex: 1 }}>
                {content.title && <p className="eyebrow">{content.eyebrow || "详情"}</p>}
                {content.title && <h2>{content.title}</h2>}
              </div>
              <button
                ref={closeBtnRef}
                className="icon-button"
                onClick={onClose}
                title="关闭 (Esc)"
                aria-label="关闭详情"
              >
                <IconClose />
              </button>
            </div>
            <div className="drawer-body">
              {content.body}
            </div>
          </>
        )}
      </aside>
      )}
    </>
  );
}
