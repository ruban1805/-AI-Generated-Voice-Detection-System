import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  X,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { PredictionHistoryItem, AcousticFeatures } from '../types/index.ts';
import { ForensicCharts } from './ForensicCharts.tsx';

interface DatabaseHistoryProps {
  authToken?: string | null;
  refreshTrigger?: number;
}

export const DatabaseHistory: React.FC<DatabaseHistoryProps> = ({
  authToken,
  refreshTrigger,
}) => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<PredictionHistoryItem | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<AcousticFeatures | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (languageFilter !== 'all') params.append('language', languageFilter);
      if (classFilter !== 'all') params.append('classification', classFilter);

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/history?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [languageFilter, classFilter, refreshTrigger, authToken]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete record #${id} from PostgreSQL database?`)) return;

    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleInspect = (item: PredictionHistoryItem) => {
    setSelectedItem(item);
    try {
      if (item.acousticFeatures) {
        setSelectedFeatures(JSON.parse(item.acousticFeatures));
      }
      if (item.modelExplanation) {
        setSelectedExplanation(JSON.parse(item.modelExplanation));
      }
    } catch {
      setSelectedFeatures(null);
      setSelectedExplanation(null);
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['ID', 'Filename', 'Format', 'Language', 'Classification', 'Confidence Score', 'AI Probability', 'Human Probability', 'Duration (s)', 'Created At'];
    const rows = history.map((item) => [
      item.id,
      `"${item.filename.replace(/"/g, '""')}"`,
      item.audioFormat,
      item.detectedLanguage,
      item.classification,
      item.confidenceScore,
      item.aiProbability,
      item.humanProbability,
      item.durationSeconds || 'N/A',
      item.createdAt || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vocalguard_predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      item.filename.toLowerCase().includes(term) ||
      item.detectedLanguage.toLowerCase().includes(term) ||
      item.classification.toLowerCase().includes(term) ||
      item.id.toString().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">PostgreSQL Prediction Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted forensic logs stored securely in Cloud SQL PostgreSQL with full acoustic metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by filename or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Language:</span>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none w-full py-1"
          >
            <option value="all" className="bg-slate-900">All Languages</option>
            <option value="Tamil" className="bg-slate-900">Tamil</option>
            <option value="English" className="bg-slate-900">English</option>
            <option value="Hindi" className="bg-slate-900">Hindi</option>
            <option value="Malayalam" className="bg-slate-900">Malayalam</option>
            <option value="Telugu" className="bg-slate-900">Telugu</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Verdict:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none w-full py-1"
          >
            <option value="all" className="bg-slate-900">All Verdicts</option>
            <option value="AI-Generated" className="bg-slate-900">AI-Generated</option>
            <option value="Human-Generated" className="bg-slate-900">Human-Generated</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Filename / Source</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {loading ? 'Querying Cloud SQL records...' : 'No prediction records found in PostgreSQL database.'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => {
                  const isAI = row.classification === 'AI-Generated';
                  const conf = parseFloat(row.confidenceScore) || 0;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleInspect(row)}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-400">
                        #{row.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 max-w-xs truncate">
                          {row.filename}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">
                          {row.audioFormat} • {row.source || 'upload'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-medium">
                          {row.detectedLanguage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                            isAI
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isAI ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          {row.classification}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {(conf * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {row.durationSeconds ? `${row.durationSeconds}s` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspect(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                            title="Inspect forensic breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(row.id, e)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-slate-400">
                  Detailed Forensics Audit #{selectedItem.id}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedItem.filename}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Classification</span>
                <span
                  className={`font-bold text-sm mt-1 block ${
                    selectedItem.classification === 'AI-Generated' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedItem.classification}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Confidence Score</span>
                <span className="font-mono font-bold text-sm text-white mt-1 block">
                  {(parseFloat(selectedItem.confidenceScore) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Language</span>
                <span className="font-semibold text-sm text-slate-200 mt-1 block">
                  {selectedItem.detectedLanguage}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Audio Duration</span>
                <span className="font-mono text-sm text-slate-300 mt-1 block">
                  {selectedItem.durationSeconds || 'N/A'}s
                </span>
              </div>
            </div>

            {/* Deep Charts if available */}
            {selectedFeatures && selectedExplanation && (
              <ForensicCharts
                features={selectedFeatures}
                explanation={selectedExplanation}
                isAI={selectedItem.classification === 'AI-Generated'}
                confidenceScore={parseFloat(selectedItem.confidenceScore)}
              />
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
