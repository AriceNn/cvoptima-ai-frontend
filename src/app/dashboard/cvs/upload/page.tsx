// src/app/dashboard/cvs/upload/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  AlertCircle, 
  CheckCircle, 
  UploadCloud,
  FileText,
  X,
  ArrowLeft,
  Loader2,
  Shield,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from "next/link";
import { getApiUrl } from '@/lib/apiClient';

export default function UploadCVPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File | undefined | null) => {

    if (file) {
      // Dosya tipi kontrolü
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        setError('Sadece PDF ve DOCX formatları desteklenmektedir.');
        clearSelection();
        return;
      }

      if (file.size > maxSize) {
        setError('Dosya boyutu 10MB\'dan küçük olmalıdır.');
        clearSelection();
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(0);
    } else {
      clearSelection();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(event.target.files?.[0]);
  };

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    setUploadProgress(0);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelected(file);
    if (fileInputRef.current && event.dataTransfer.files) {
      fileInputRef.current.files = event.dataTransfer.files;
    }
  }, []);

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen önce bir dosya seçin.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const apiUrl = getApiUrl();
    const progressInterval = simulateProgress();

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

      const formData = new FormData();
      formData.append('file', selectedFile, selectedFile.name);

      const response = await fetch(`${apiUrl}/api/v1/cv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        let errorDetail = `Dosya yüklenemedi (${response.status}).`;
        try {
          const errorData = await response.json();
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {
          console.error("Hata yanıtı parse edilemedi:", e);
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("Yükleme başarılı:", data);

      setSuccessMessage(`'${selectedFile.name}' başarıyla yüklendi! Analiz ediliyor...`);

      setTimeout(() => {
        router.push('/dashboard/cvs');
      }, 2000);

    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      console.error("Yükleme hatası:", err);
      setError(err instanceof Error ? err.message : 'Dosya yüklenirken bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link 
            href="/dashboard/cvs" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            CV Listesine Dön
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            CV Yükle
          </h1>
          <p className="text-muted-foreground text-lg">
            CV'nizi yükleyin ve AI destekli analiz ile optimize edin
          </p>
        </div>

        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
          
          <div className="relative">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-semibold">CV'nizi Yükleyin</CardTitle>
              <CardDescription className="text-base">
                PDF veya DOCX formatındaki CV'nizi analiz için yükleyin
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>PDF ve DOCX formatları</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Maksimum 10MB boyut</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Güvenli yükleme</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Anında analiz</span>
                </div>
              </div>

              {/* Error & Success Alerts */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="animate-in fade-in-50 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Drop Zone */}
              {!selectedFile && !isLoading && (
                <Label 
                  htmlFor="cv-file-input"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                    "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg",
                    isDragging && "border-primary bg-primary/10 scale-105 shadow-lg"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className={cn(
                    "w-16 h-16 mb-4 transition-colors duration-300",
                    isDragging ? "text-primary" : "text-muted-foreground/50"
                  )} />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-foreground">
                      CV'nizi sürükleyip bırakın
                    </p>
                    <p className="text-muted-foreground">
                      veya bilgisayarınızdan seçin
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      PDF, DOCX • Maks. 10MB
                    </p>
                  </div>
                  <Input 
                    id="cv-file-input" 
                    type="file" 
                    className="sr-only"
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isLoading}
                  />
                </Label>
              )}

              {/* Selected File Preview */}
              {selectedFile && !isLoading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground truncate max-w-xs">
                          {selectedFile.name}
                        </span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(selectedFile.size)}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {selectedFile.type.split('/')[1]?.toUpperCase() || 'Dosya'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSelection}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Seçimi Temizle</span>
                    </Button>
                  </div>

                  <Button
                    onClick={handleUpload}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    <UploadCloud className="mr-2 h-5 w-5" />
                    CV'yi Yükle ve Analiz Et
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {isLoading && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {selectedFile?.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {uploadProgress < 100 ? 'Yükleniyor...' : 'Analiz ediliyor...'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Success State */}
              {successMessage && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">CV Başarıyla Yüklendi!</p>
                    <p className="text-sm text-muted-foreground">
                      CV listenize yönlendiriliyorsunuz...
                    </p>
                  </div>
                  <Progress value={100} className="h-2 bg-green-100" />
                </div>
              )}

              {/* Quick Actions */}
              {!selectedFile && !isLoading && !successMessage && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Veya hızlı işlemler
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild className="gap-2">
                      <Link href="/dashboard/cvs">
                        <FileText className="h-4 w-4" />
                        CV'lerimi Görüntüle
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="gap-2">
                      <Link href="/dashboard/analyses/new">
                        <UploadCloud className="h-4 w-4" />
                        Analiz Başlat
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}