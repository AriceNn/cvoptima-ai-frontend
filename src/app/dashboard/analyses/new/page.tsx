// src/app/dashboard/analyses/new/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Loader2, FileText, Briefcase, ArrowLeft, Sparkles, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CVSelectItem {
  id: string;
  file_name: string;
  created_at: string;
}

export default function NewAnalysisPage() {
  const [availableCvs, setAvailableCvs] = useState<CVSelectItem[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  const fetchAvailableCvs = useCallback(async () => {
    setIsLoadingCvs(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { 
        router.push('/login'); 
        return; 
      }
      
      const response = await fetch('http://localhost:8000/api/v1/cv', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        let errorDetail = 'CV listesi alınamadı.';
        try {
          const errorData = await response.json();
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {}
        throw new Error(errorDetail);
      }
      
      const data: { cvs: CVSelectItem[] } = await response.json();
      setAvailableCvs(data.cvs || []);

      if (!data.cvs || data.cvs.length === 0) {
        setError("Analiz başlatmak için önce en az bir CV yüklemelisiniz.");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV listesi yüklenirken hata oluştu.');
    } finally {
      setIsLoadingCvs(false);
    }
  }, [supabase, router]);

  useEffect(() => { 
    fetchAvailableCvs(); 
  }, [fetchAvailableCvs]);

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJobDescription(value);
    setCharacterCount(value.length);
  };

  const handleStartAnalysis = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedCvId || !jobDescription.trim()) {
      setError('Lütfen bir CV seçin ve iş ilanı metnini girin.');
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError('İş ilanı metni en az 50 karakter olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { 
        throw new Error("Oturum bulunamadı."); 
      }

      const response = await fetch('http://localhost:8000/api/v1/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          cv_id: selectedCvId,
          job_description_text: jobDescription,
        }),
      });

      if (!response.ok) {
        let errorDetail = 'Analiz başlatılamadı.';
        try { 
          const errorData = await response.json(); 
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {}
        
        if (response.status === 404) {
          errorDetail = "Seçilen CV bulunamadı. Lütfen listeyi yenileyin.";
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("Analiz başlatıldı:", data);

      setSuccessMessage('Analiz başarıyla başlatıldı! Sonuçları Analizlerim sayfasından takip edebilirsiniz.');
      
      // Başarı mesajı gösterildikten sonra yönlendir
      setTimeout(() => {
        router.push('/dashboard/analyses');
      }, 2000);

    } catch (err) {
      console.error("Analiz başlatma hatası:", err);
      setError(err instanceof Error ? err.message : 'Analiz başlatılırken bilinmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCv = availableCvs.find(cv => cv.id === selectedCvId);
  const isFormValid = selectedCvId && jobDescription.trim().length >= 50;

  return (
    <div className="flex flex-1 flex-col items-center pt-8 md:pt-12 mb-12">
      <div className="w-full max-w-4xl space-y-6 px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-2">
            <Link 
              href="/dashboard/analyses" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Analizlere Dön
            </Link>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Yeni Analiz Başlat
            </h1>
            <p className="text-muted-foreground">
              CV'nizi bir iş ilanıyla karşılaştırarak AI destekli analiz yapın
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
              <div className="relative">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Analiz Detayları
                  </CardTitle>
                  <CardDescription className="text-base">
                    CV'nizi seçin ve iş ilanı metnini girin
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleStartAnalysis}>
                  <CardContent className="space-y-6">
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

                    {/* CV Selection */}
                    <div className="space-y-3">
                      <Label htmlFor="cv-select" className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Analiz Edilecek CV
                      </Label>
                      {isLoadingCvs ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      ) : availableCvs.length > 0 ? (
                        <Select
                          value={selectedCvId}
                          onValueChange={setSelectedCvId}
                          disabled={isSubmitting}
                          required
                        >
                          <SelectTrigger id="cv-select" className="h-12 text-base">
                            <SelectValue placeholder="Bir CV seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCvs.map((cv) => (
                              <SelectItem key={cv.id} value={cv.id} className="text-base">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {cv.file_name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-destructive" />
                            <div>
                              <p className="font-medium text-destructive">CV bulunamadı</p>
                              <p className="text-sm text-destructive/80 mt-1">
                                Analiz için önce{' '}
                                <Link 
                                  href="/dashboard/cvs/upload" 
                                  className="font-semibold underline hover:text-destructive transition-colors"
                                >
                                  bir CV yükleyin
                                </Link>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Job Description */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="job-description" className="text-sm font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          İş İlanı Metni
                        </Label>
                        <span className={cn(
                          "text-xs transition-colors",
                          characterCount < 50 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {characterCount}/50+
                        </span>
                      </div>
                      <Textarea
                        id="job-description"
                        placeholder="İş ilanı metnini buraya yapıştırın... (En az 50 karakter)"
                        required
                        value={jobDescription}
                        onChange={handleJobDescriptionChange}
                        disabled={isSubmitting}
                        rows={12}
                        className="min-h-[200px] resize-y text-base leading-relaxed transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        İlan metnini tam olarak kopyalayıp yapıştırmanız önerilir
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className={cn(
                        "w-full h-12 text-base font-semibold transition-all duration-300",
                        isFormValid && !isSubmitting && !successMessage
                          ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 hover:shadow-lg"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      disabled={!isFormValid || isSubmitting || isLoadingCvs || availableCvs.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analiz Başlatılıyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analizi Başlat
                        </>
                      )}
                    </Button>
                  </CardContent>
                </form>
              </div>
            </Card>
          </div>

          {/* Sidebar - Info & Selected CV */}
          <div className="space-y-6">

            {/* Analysis Tips */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Analiz İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>İlan metnini olduğu gibi kopyalayın</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>En az 50 karakter gereklidir</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>Analiz genellikle 1-2 dakika sürer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>Sonuçları Analizlerim sayfasından takip edin</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg ">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/dashboard/cvs/upload">
                    <Upload className="h-4 w-4" />
                    Yeni CV Yükle
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/dashboard/cvs">
                    <FileText className="h-4 w-4" />
                    CV'lerimi Görüntüle
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/dashboard/analyses">
                    <Briefcase className="h-4 w-4" />
                    Analiz Geçmişi
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}