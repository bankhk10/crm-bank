"use client";

import React, { useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Check,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActivityGpsPickerProps {
  /**
   * Title of the GPS section (default: "พิกัดแปลง (Plot Coordinates)")
   */
  title?: string;
  /**
   * Subtitle / description / instructions
   */
  description?: string;
  /**
   * Latitude value
   */
  latitude?: string | number | null;
  /**
   * Longitude value
   */
  longitude?: string | number | null;
  /**
   * Callback when coordinates change
   */
  onLocationChange?: (latitude: string, longitude: string) => void;
  /**
   * Individual latitude change callback (optional convenience)
   */
  onLatitudeChange?: (latitude: string) => void;
  /**
   * Individual longitude change callback (optional convenience)
   */
  onLongitudeChange?: (longitude: string) => void;
  /**
   * Whether GPS coordinates are required
   */
  required?: boolean;
  /**
   * Read-only mode
   */
  readonly?: boolean;
  disabled?: boolean;
  /**
   * Accent color theme: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate' (default: 'emerald')
   */
  accentColor?: "emerald" | "blue" | "purple" | "amber" | "slate";
  /**
   * Additional wrapper class
   */
  className?: string;
  /**
   * Custom label for Latitude (default: "ละติจูด (Latitude)")
   */
  latitudeLabel?: string;
  /**
   * Custom label for Longitude (default: "ลองจิจูด (Longitude)")
   */
  longitudeLabel?: string;
  /**
   * Show Google Maps shortcut when valid coordinates exist (default: true)
   */
  showMapLink?: boolean;
}

const COLOR_THEMES = {
  emerald: {
    container: "bg-emerald-50/30 border-emerald-100/90",
    headerBorder: "border-emerald-100",
    iconBox: "bg-emerald-100 text-emerald-700 border-emerald-200",
    title: "text-emerald-950",
    description: "text-emerald-700/80",
    btn: "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50",
    btnIcon: "text-emerald-600",
    inputFocus: "focus:ring-emerald-500",
    link: "text-emerald-700 hover:text-emerald-800 hover:underline",
  },
  blue: {
    container: "bg-blue-50/30 border-blue-100/90",
    headerBorder: "border-blue-100",
    iconBox: "bg-blue-100 text-blue-700 border-blue-200",
    title: "text-blue-950",
    description: "text-blue-700/80",
    btn: "bg-white text-blue-800 border-blue-300 hover:bg-blue-50",
    btnIcon: "text-blue-600",
    inputFocus: "focus:ring-blue-500",
    link: "text-blue-700 hover:text-blue-800 hover:underline",
  },
  purple: {
    container: "bg-purple-50/30 border-purple-100/90",
    headerBorder: "border-purple-100",
    iconBox: "bg-purple-100 text-purple-700 border-purple-200",
    title: "text-purple-950",
    description: "text-purple-700/80",
    btn: "bg-white text-purple-800 border-purple-300 hover:bg-purple-50",
    btnIcon: "text-purple-600",
    inputFocus: "focus:ring-purple-500",
    link: "text-purple-700 hover:text-purple-800 hover:underline",
  },
  amber: {
    container: "bg-amber-50/30 border-amber-100/90",
    headerBorder: "border-amber-100",
    iconBox: "bg-amber-100 text-amber-700 border-amber-200",
    title: "text-amber-950",
    description: "text-amber-700/80",
    btn: "bg-white text-amber-800 border-amber-300 hover:bg-amber-50",
    btnIcon: "text-amber-600",
    inputFocus: "focus:ring-amber-500",
    link: "text-amber-700 hover:text-amber-800 hover:underline",
  },
  slate: {
    container: "bg-slate-50/50 border-slate-200/80",
    headerBorder: "border-slate-200",
    iconBox: "bg-slate-100 text-slate-700 border-slate-200",
    title: "text-slate-900",
    description: "text-slate-600",
    btn: "bg-white text-slate-800 border-slate-300 hover:bg-slate-100",
    btnIcon: "text-slate-600",
    inputFocus: "focus:ring-slate-500",
    link: "text-slate-700 hover:text-slate-900 hover:underline",
  },
};

export function ActivityGpsPicker({
  title = "พิกัดแปลง (Plot Coordinates)",
  description,
  latitude = "",
  longitude = "",
  onLocationChange,
  onLatitudeChange,
  onLongitudeChange,
  required = false,
  readonly = false,
  disabled = false,
  accentColor = "emerald",
  className,
  latitudeLabel = "ละติจูด (Latitude)",
  longitudeLabel = "ลองจิจูด (Longitude)",
  showMapLink = true,
}: ActivityGpsPickerProps) {
  const isReadonly = readonly || disabled;
  const theme = COLOR_THEMES[accentColor] || COLOR_THEMES.emerald;

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState(false);

  const latStr = latitude != null ? String(latitude) : "";
  const lngStr = longitude != null ? String(longitude) : "";

  const handleGetCurrentLocation = useCallback(() => {
    if (isReadonly) return;

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError(
        "เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการค้นหาตำแหน่งพิกัด (Geolocation)",
      );
      setGeoSuccess(false);
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const newLat = pos.coords.latitude.toFixed(7);
        const newLng = pos.coords.longitude.toFixed(7);

        onLocationChange?.(newLat, newLng);
        onLatitudeChange?.(newLat);
        onLongitudeChange?.(newLng);

        setGeoSuccess(true);
        setTimeout(() => setGeoSuccess(false), 4000);
      },
      (err) => {
        setGeoLoading(false);
        setGeoSuccess(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setGeoError(
            "การเข้าถึงพิกัดถูกปฏิเสธ กรุณาอนุญาตตำแหน่งที่ตั้ง (Location) ในเบราว์เซอร์ หรือกรอกพิกัดด้วยตนเอง",
          );
        } else {
          setGeoError("ไม่สามารถดึงตำแหน่งพิกัดปัจจุบันได้ กรุณากรอกด้วยตนเอง");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [isReadonly, onLocationChange, onLatitudeChange, onLongitudeChange]);

  const handleLatChange = (val: string) => {
    if (isReadonly) return;
    if (geoError) setGeoError(null);
    onLatitudeChange?.(val);
    onLocationChange?.(val, lngStr);
  };

  const handleLngChange = (val: string) => {
    if (isReadonly) return;
    if (geoError) setGeoError(null);
    onLongitudeChange?.(val);
    onLocationChange?.(latStr, val);
  };

  const hasCoords = Boolean(latStr.trim() && lngStr.trim());
  const mapUrl = hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(latStr.trim())},${encodeURIComponent(lngStr.trim())}`
    : null;

  return (
    <div
      className={cn(
        "border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all shadow-xs",
        theme.container,
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b pb-2.5",
          theme.headerBorder,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0",
              theme.iconBox,
            )}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4
              className={cn(
                "text-xs sm:text-sm font-bold flex items-center gap-1",
                theme.title,
              )}
            >
              <span>{title}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </h4>
            {description && (
              <p className={cn("text-[11px] leading-tight mt-0.5", theme.description)}>
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showMapLink && hasCoords && mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-white shadow-2xs hover:bg-slate-50 transition-colors",
                theme.link,
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ดูบนแผนที่</span>
            </a>
          )}

          {!isReadonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={geoLoading}
              className={cn(
                "h-8 text-xs font-semibold shadow-2xs gap-1.5 transition-colors",
                theme.btn,
              )}
            >
              <Navigation
                className={cn(
                  "w-3.5 h-3.5",
                  theme.btnIcon,
                  geoLoading && "animate-spin",
                )}
              />
              <span>
                {geoLoading ? "กำลังดึงพิกัด..." : "ใช้ตำแหน่งปัจจุบัน"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {geoError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {geoSuccess && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
          <span>ดึงพิกัดปัจจุบันสำเร็จเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{latitudeLabel}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <Input
            type="number"
            step="any"
            value={latStr}
            onChange={(e) => handleLatChange(e.target.value)}
            disabled={isReadonly}
            placeholder="เช่น 13.7563309"
            className={cn(
              "h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl font-mono",
              theme.inputFocus,
            )}
            required={required}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{longitudeLabel}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <Input
            type="number"
            step="any"
            value={lngStr}
            onChange={(e) => handleLngChange(e.target.value)}
            disabled={isReadonly}
            placeholder="เช่น 100.5017651"
            className={cn(
              "h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl font-mono",
              theme.inputFocus,
            )}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
