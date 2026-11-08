/**
 * ChronoCraft - Create Custom List Modal
 */

import React, { useEffect, useState } from "react";
import {
  X,
  Folder,
  BookOpen,
  GraduationCap,
  FolderKanban,
  Check,
} from "lucide-react";
import { CustomList } from "@/types";
import { Keyboard } from "@capacitor/keyboard";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList?: (list: Partial<CustomList>) => Promise<void>;
  initialList?: CustomList | null;
  onUpdateList?: (id: string, patch: Partial<CustomList>) => Promise<void>;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onCreateList,
  initialList,
  onUpdateList,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [icon, setIcon] = useState("FolderKanban");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let showHandle: { remove: () => void } | undefined;
    let hideHandle: { remove: () => void } | undefined;

    Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardHeight(info.keyboardHeight);
    }).then((h) => (showHandle = h));

    Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    }).then((h) => (hideHandle = h));

    return () => {
      showHandle?.remove();
      hideHandle?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialList?.name ?? "");
    setDescription(initialList?.description ?? "");
    setColor(initialList?.color ?? "#6366F1");
    setIcon(initialList?.icon ?? "FolderKanban");
  }, [isOpen, initialList?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialList && onUpdateList) {
      await onUpdateList(initialList.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
      });
    } else {
      await onCreateList?.({
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        type: "custom",
      });
    }

    setName("");
    setDescription("");
    onClose();
  };

  const icons = [
    { name: "FolderKanban", icon: <FolderKanban className="w-4 h-4" /> },
    { name: "BookOpen", icon: <BookOpen className="w-4 h-4" /> },
    { name: "GraduationCap", icon: <GraduationCap className="w-4 h-4" /> },
    { name: "Folder", icon: <Folder className="w-4 h-4" /> },
  ];

  const colors = [
    "#6366F1", // Indigo
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#8B5CF6", // Purple
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-xs"
      />

      <form
        onSubmit={handleSubmit}
        style={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined,
        }}
        className="relative w-full md:max-w-sm rounded-t-3xl md:rounded-2xl bg-raised border-t md:border border-soft shadow-2xl z-10 flex flex-col max-h-[85dvh] animate-slideInBottom md:animate-scaleUp"
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-strong" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4 md:pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">
              {initialList ? "Edit List" : "Create Custom List"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">List Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fitness Goals, Research Papers"
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-sunken border border-soft text-xs font-semibold focus:outline-none focus:border-accent text-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this list organize?"
              className="w-full px-3 py-2 rounded-xl bg-sunken border border-soft text-xs focus:outline-none focus:border-accent text-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-2">Icon</label>
            <div className="flex items-center gap-2">
              {icons.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2 rounded-xl border transition-colors ${
                    icon === item.name
                      ? "bg-accent text-accent-fg border-accent"
                      : "border-soft text-muted hover:border-strong"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-accent" : "opacity-80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 md:pt-2 border-t border-soft shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{initialList ? "Save Changes" : "Create List"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
