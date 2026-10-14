"use client";

import { RequestCategory } from "@/types";
import { LifeBuoy, Stethoscope, Droplets, Home, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryPickerProps {
  selected: RequestCategory;
  onSelect: (category: RequestCategory) => void;
}

const CATEGORIES: {
  id: RequestCategory;
  label: string;
  sublabel: string;
  icon: any;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}[] = [
  {
    id: "rescue",
    label: "Rescue",
    sublabel: "Waterlogged, trapped, evacuation needed",
    icon: LifeBuoy,
    colorBorder: "border-pink-500/60 hover:border-pink-400",
    colorBg: "bg-pink-500/10 text-pink-400",
    colorText: "text-pink-300",
  },
  {
    id: "medical",
    label: "Medical",
    sublabel: "Critical injury, oxygen, insulin, pregnant",
    icon: Stethoscope,
    colorBorder: "border-rose-500/60 hover:border-rose-400",
    colorBg: "bg-rose-500/10 text-rose-400",
    colorText: "text-rose-300",
  },
  {
    id: "water",
    label: "Water",
    sublabel: "Potable drinking water, baby hydration",
    icon: Droplets,
    colorBorder: "border-sky-500/60 hover:border-sky-400",
    colorBg: "bg-sky-500/10 text-sky-400",
    colorText: "text-sky-300",
  },
  {
    id: "shelter",
    label: "Shelter",
    sublabel: "Roof blown, tarpaulins, dry room",
    icon: Home,
    colorBorder: "border-purple-500/60 hover:border-purple-400",
    colorBg: "bg-purple-500/10 text-purple-400",
    colorText: "text-purple-300",
  },
  {
    id: "food",
    label: "Food",
    sublabel: "Cooked meals, dry rations, baby milk",
    icon: Utensils,
    colorBorder: "border-amber-500/60 hover:border-amber-400",
    colorBg: "bg-amber-500/10 text-amber-400",
    colorText: "text-amber-300",
  },
];

export default function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selected === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl p-3.5 text-center transition-all cursor-pointer border",
              isSelected
                ? cn(
                    cat.colorBorder,
                    "bg-slate-800/90 shadow-lg ring-2 ring-offset-2 ring-offset-[#070B14]",
                    cat.id === "rescue" && "ring-pink-500 shadow-pink-500/20",
                    cat.id === "medical" && "ring-rose-500 shadow-rose-500/20",
                    cat.id === "water" && "ring-sky-500 shadow-sky-500/20",
                    cat.id === "shelter" && "ring-purple-500 shadow-purple-500/20",
                    cat.id === "food" && "ring-amber-500 shadow-amber-500/20"
                  )
                : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700 opacity-80 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "mb-2 flex h-11 w-11 items-center justify-center rounded-xl transition-transform",
                cat.colorBg,
                isSelected ? "scale-110" : ""
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span className={cn("text-sm font-bold tracking-tight", isSelected ? cat.colorText : "text-white")}>
              {cat.label}
            </span>
            <span className="mt-1 text-[10px] text-slate-400 line-clamp-2 leading-tight">
              {cat.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
