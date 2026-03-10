"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SiteItem } from "../types";

type DraggableItemProps = {
    item: SiteItem;
};

export default function DraggableItem({ item }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: item.itemId,
            data: item,
        });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        bg-white border-2 border-gray-200 rounded-lg p-3 mb-2
        cursor-grab active:cursor-grabbing
        hover:border-primary-400 hover:shadow-md
        transition-all duration-200
        ${isDragging ? "shadow-2xl scale-105" : ""}
      `}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{item.isKitComponent ? "⛺" : "📦"}</span>
                        <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{item.categoryName}</p>
                        {item.isKitComponent && item.kitName && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                {item.kitName}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">
                        Qty: {item.quantity}
                    </p>
                    {item.totalWeight > 0 && (
                        <p className="text-xs text-gray-500">
                            {item.totalWeight.toFixed(0)} kg
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
