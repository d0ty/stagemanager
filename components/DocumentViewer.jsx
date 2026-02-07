import React, { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocumentViewer({ fileUrl, fileName, onClose }) {
  const [error, setError] = useState(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Office Online Viewer URL for Word and Excel
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </Button>
          <span className="text-white font-medium">{fileName || 'Dokumentum Megtekintő'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="text-white hover:bg-slate-800 h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Letöltés
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-hidden bg-slate-800">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8 bg-slate-900 rounded-lg max-w-md">
              <div className="text-red-400 font-medium mb-2">Nem sikerült betölteni a dokumentumot</div>
              <div className="text-sm text-slate-400 mb-4">{error}</div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Letöltés helyette
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            onError={() => setError('A dokumentum nem jeleníthető meg. Kérlek, töltsd le.')}
          />
        )}
      </div>
    </div>
  );
}