"use client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Expand, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import SimpleBar from "simplebar-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useToast } from "./ui/use-toast";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfFullscreen = ({ fileUrl }: { fileUrl: string }) => {
  const { width, ref } = useResizeDetector();
  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const { toast } = useToast();
  return (
    <Dialog>
      <DialogTrigger>
        <Expand className="h-4 w-4" aria-label="full screen" />
      </DialogTrigger>
      <DialogContent className="max-w-7xl">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
          <div ref={ref}>
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: "Error loading PDF",
                  description: "Please try again later",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              file={fileUrl}
              className="max-h-full"
            >
              {new Array(numPages).fill(0).map((_, i) => (
                <Page key={i} width={width ? width : 1} pageNumber={i + 1} />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
};

export default PdfFullscreen;
