import { FileJson, X, Loader2, FileCode2, User, Bot, CheckSquare } from 'lucide-react';
import { exportStore, useExportStore } from './store';
import { generateMarkdown, generateJSON } from '../../services/advancedExport';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ExportDock() {
  const store = useExportStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  if (!store.isSelectionMode) return null;

  const count = store.selectedIds.size;

  const handleExport = async (type: string) => {
    setLoading(type);
    try {
      if (type === 'md') await generateMarkdown();
      if (type === 'json') await generateJSON();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700/50 p-2.5 rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition-all duration-300">
      
      <div className="flex items-center gap-2 pl-3 pr-4 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-700">
        <span className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-[#D97757] text-white text-[11px] font-bold shadow-sm">
          {count}
        </span>
        <span>{t('exportDock.selected')}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2 border-r border-zinc-200 dark:border-zinc-700">
        <IconButton title={t('exportDock.selectUser')} icon={<User size={15} strokeWidth={2.5} />} onClick={() => exportStore.toggleBulk('user')} />
        <IconButton title={t('exportDock.selectAI')} icon={<Bot size={15} strokeWidth={2.5} />} onClick={() => exportStore.toggleBulk('assistant')} />
        <IconButton title={t('exportDock.selectAll')} icon={<CheckSquare size={15} strokeWidth={2.5} />} onClick={() => exportStore.toggleBulk('all')} />
      </div>

      <div className="flex gap-2 relative">
        <DockButton icon={<FileCode2 size={15} />} label="Markdown" disabled={count === 0 || !!loading} isLoading={loading === 'md'} type="primary" onClick={() => handleExport('md')} />
        <DockButton icon={<FileJson size={15} />} label="JSON" disabled={count === 0 || !!loading} isLoading={loading === 'json'} onClick={() => handleExport('json')} />
      </div>

      <button
        type="button"
        className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        onClick={() => exportStore.setIsSelectionMode(false)}
        title={t('exportDock.cancelMode')}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function IconButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center w-[28px] h-[28px] rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-[#D97757] hover:text-white dark:hover:bg-[#D97757] dark:hover:text-white transition-all shadow-sm"
      >
        {icon}
      </button>
      {/* Instant Custom Tooltip */}
      <div className="absolute -top-10 bg-zinc-900 border border-zinc-700/50 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-[100000]">
        {title}
        {/* Tooltip downward triangle arrow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-zinc-900"></div>
      </div>
    </div>
  );
}

function DockButton({ icon, label, disabled, isLoading, type = 'secondary', onClick }: { icon: React.ReactNode; label: string; disabled: boolean, isLoading?: boolean, type?: 'primary' | 'secondary', onClick: () => void }) {
  const primaryClasses = disabled
    ? 'opacity-40 cursor-not-allowed bg-transparent text-zinc-500'
    : 'bg-[#D97757] text-white hover:bg-[#c4694b] shadow-[0_2px_8px_rgba(217,119,87,0.4)]';
    
  const secondaryClasses = disabled
    ? 'opacity-40 cursor-not-allowed bg-transparent text-zinc-500'
    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-sm';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${type === 'primary' ? primaryClasses : secondaryClasses}`}
    >
      {isLoading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
