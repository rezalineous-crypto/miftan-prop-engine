'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CalendarDaysIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { getProperties } from '../api/client';

interface Property {
  id: number;
  property_code: string;
  property_name: string;
  company_id: number;
  is_active: boolean;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: { preventDefault(): void }) => Promise<void>;
  file: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  companyId: string;
  onCompanyIdChange: (value: string) => void;
  propertyId: string;
  onPropertyIdChange: (value: string) => void;
  uploadMonth: string;
  onUploadMonthChange: (value: string) => void;
  uploadYear: string;
  onUploadYearChange: (value: string) => void;
  dragActive: boolean;
  uploading: boolean;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type DropPos = { top: number; left: number; width: number };

function calcPos(el: HTMLElement): DropPos {
  const r = el.getBoundingClientRect();
  return { top: r.bottom + 4, left: r.left, width: r.width };
}

function useFloatingClose(
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, triggerRef, panelRef, close]);
}

// ── Property dropdown ────────────────────────────────────────────────────────
function PropertyDropdown({
  properties, loading, value, onChange,
}: {
  properties: Property[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFloatingClose(triggerRef, panelRef, open, () => setOpen(false));

  const toggle = () => {
    if (!open && triggerRef.current) setPos(calcPos(triggerRef.current));
    setOpen((v) => !v);
  };

  const selected = properties.find((p) => String(p.id) === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
          open
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        } ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <BuildingOffice2Icon className="w-4 h-4 text-slate-300 shrink-0" />
        {loading ? (
          <span className="flex items-center gap-2 text-slate-400 flex-1 text-sm">
            <span className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
            Loading…
          </span>
        ) : selected ? (
          <span className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-slate-900 font-medium truncate">{selected.property_name}</span>
            <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
              {selected.property_code}
            </span>
          </span>
        ) : (
          <span className="text-gray-300 flex-1">Select a property</span>
        )}
        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1"
        >
          <div className="max-h-52 overflow-y-auto">
            {properties.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-5">No properties available</p>
            ) : (
              properties.map((p) => {
                const isSel = String(p.id) === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(String(p.id)); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <BuildingOffice2Icon className={`w-3.5 h-3.5 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isSel ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {p.property_name}
                      </p>
                      <p className="text-[0.6rem] text-slate-400 mt-0.5">ID #{p.id}</p>
                    </div>
                    <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                      {p.property_code}
                    </span>
                    {isSel && <CheckIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Month picker ─────────────────────────────────────────────────────────────
function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFloatingClose(triggerRef, panelRef, open, () => setOpen(false));

  const toggle = () => {
    if (!open && triggerRef.current) setPos(calcPos(triggerRef.current));
    setOpen((v) => !v);
  };

  const selectedLabel = value ? MONTHS[parseInt(value) - 1] : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all cursor-pointer ${
          open
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        }`}
      >
        <CalendarDaysIcon className="w-4 h-4 text-slate-300 shrink-0" />
        <span className={`flex-1 text-left ${selectedLabel ? 'text-slate-900 font-medium' : 'text-gray-300'}`}>
          {selectedLabel ?? 'Select month'}
        </span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl p-2"
        >
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((m, i) => {
              const v = String(i + 1);
              const isSel = value === v;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { onChange(v); setOpen(false); }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isSel
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function UploadModal({
  isOpen, onClose, onSubmit, file, onFileSelect, onDrag, onDrop,
  companyId, onCompanyIdChange, propertyId, onPropertyIdChange,
  uploadMonth, onUploadMonthChange, uploadYear, onUploadYearChange,
  dragActive, uploading,
}: UploadModalProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPropertiesLoading(true);
    getProperties()
      .then((data) => {
        const arr: Property[] = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
        setProperties(arr.filter((p) => p.is_active));
      })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, [isOpen]);

  const handlePropertySelect = (id: string) => {
    onPropertyIdChange(id);
    const prop = properties.find((p) => String(p.id) === id);
    if (prop) onCompanyIdChange(String(prop.company_id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-100">

        {/* Header */}
        <div className="border-b border-gray-100 px-7 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-headline">Upload Performance Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">CSV or Excel files up to 50 MB</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-7 py-6 space-y-5">

          {/* Drop zone */}
          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">File</label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                dragActive ? 'border-indigo-400 bg-indigo-50/50'
                : file    ? 'border-emerald-300 bg-emerald-50/40'
                           : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/40'
              }`}
              onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
            >
              <input type="file" onChange={onFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv,.xlsx,.xls" />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                {file ? (
                  <>
                    <div className="p-2.5 bg-emerald-100 rounded-lg"><DocumentIcon className="w-5 h-5 text-emerald-600" /></div>
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-slate-100 rounded-lg"><CloudArrowUpIcon className="w-5 h-5 text-slate-400" /></div>
                    <p className="text-sm font-semibold text-slate-700">Drop your file here</p>
                    <p className="text-xs text-slate-400">or <span className="text-indigo-600 font-medium">browse to choose</span></p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Company — locked */}
          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed">
              <BuildingOffice2Icon className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-sm text-slate-500 font-medium flex-1">
                {companyId ? `Company #${companyId}` : 'Select a property first'}
              </span>
              <span className="text-[0.6rem] font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Default</span>
            </div>
          </div>

          {/* Property */}
          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Property</label>
            <PropertyDropdown properties={properties} loading={propertiesLoading} value={propertyId} onChange={handlePropertySelect} />
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
              <MonthPicker value={uploadMonth} onChange={onUploadMonthChange} />
            </div>
            <div>
              <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => onUploadYearChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="2026" min="2020" max="2030" required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={uploading || !file || !propertyId || !uploadMonth || !uploadYear}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <><CloudArrowUpIcon className="w-4 h-4" /> Upload</>
              )}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
