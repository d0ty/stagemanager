import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download, Search, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export default function PDFViewer({ fileUrl, onClose, programId }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [searchText, setSearchText] = useState('');
  const [showPageList, setShowPageList] = useState(false);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    setError(error.message);
  };

  const handlePrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goToPage = (page) => {
    setPageNumber(page);
    setShowPageList(false);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </Button>
          <span className="text-white font-medium">PDF Megtekintő & Annotáció</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2">
            <Search className="w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Keresés..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-transparent border-0 text-white placeholder:text-slate-500 h-8 w-32 focus-visible:ring-0"
            />
          </div>

          <div className="w-px h-6 bg-slate-700" />

          {/* Zoom */}
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-slate-800 h-8 w-8">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-xs min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-slate-800 h-8 w-8">
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700" />

          {/* Page Navigation */}
          <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={pageNumber <= 1} className="text-white hover:bg-slate-800 h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white text-xs min-w-[60px] text-center">
            {pageNumber} / {numPages || '...'}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextPage} disabled={pageNumber >= numPages} className="text-white hover:bg-slate-800 h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700" />

          {/* Page List */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPageList(!showPageList)}
            className="text-white hover:bg-slate-800 h-8"
          >
            <List className="w-4 h-4 mr-1" />
            Oldalak
          </Button>

          <div className="w-px h-6 bg-slate-700" />

          {/* Download */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="text-white hover:bg-slate-800 h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Mentés
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Page List Sidebar */}
        {showPageList && numPages && (
          <div className="w-48 bg-slate-900 border-r border-slate-700 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700">
              <h3 className="text-white font-medium text-sm">Oldalak ({numPages})</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      page === pageNumber 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Oldal {page}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-slate-800">
          {error ? (
            <div className="text-center p-8 bg-slate-900 rounded-lg">
              <div className="text-red-400 font-medium mb-2">Nem sikerült betölteni a PDF-et</div>
              <div className="text-sm text-slate-400 mb-4">{error}</div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Letöltés helyette
              </Button>
            </div>
          ) : (
            <div className="relative bg-white shadow-2xl">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-20 bg-white">
                    <div className="text-slate-600">Betöltés...</div>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}