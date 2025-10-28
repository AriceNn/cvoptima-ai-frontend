// src/app/dashboard/analyses/[analysisId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Lightbulb, 
  ClipboardCopy, 
  Copy, 
  FileText,
  BarChart3,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Environment variable for API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FullAnalysisResult {
  job_keywords: { hard_skills: string[]; soft_skills: string[] };
  cv_keywords: { hard_skills: string[]; soft_skills: string[] };
  gap_analysis: { matching_skills: string[]; missing_skills: string[] };
  suggestions: Array<{ suggestion_title: string; suggestion_detail: string; cv_example: string }>;
  cover_letter_draft: string;
}

interface AnalysisStatusResponse {
  task_id: string;
  status: 'pending' | 'completed' | 'failed' | string;
  result?: FullAnalysisResult | null;
}

export default function AnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [analysisResult, setAnalysisResult] = useState<AnalysisStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const analysisId = Array.isArray(params?.analysisId) ? params.analysisId[0] : params?.analysisId;

  const fetchAnalysisResult = useCallback(async () => {
    if (!analysisId) {
      setError("Analiz ID'si URL'de bulunamadı.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/analysis/status/${analysisId}`, {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        let errorDetail = 'Analiz sonucu alınamadı.';
        if (response.status === 404) {
          errorDetail = "Analiz bulunamadı veya size ait değil.";
        } else if (response.status === 500) {
          errorDetail = "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
        } else {
          try {
            const errorData = await response.json();
            if (errorData.detail) errorDetail = errorData.detail;
          } catch (_) {}
        }
        throw new Error(errorDetail);
      }

      const data: AnalysisStatusResponse = await response.json();

      if (data.status === 'pending') {
        setError("Bu analiz henüz tamamlanmadı. Lütfen Analizlerim sayfasından takip edin.");
      } else if (data.status === 'failed' || !data.result) {
        setError("Analiz başarısız oldu veya sonuç bulunamadı.");
      } else {
        setAnalysisResult(data);
      }

    } catch (err) {
      console.error('Analysis result fetch error:', err);
      setError(err instanceof Error ? err.message : 'Analiz sonucu yüklenirken beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId, supabase, router]);

  useEffect(() => { 
    fetchAnalysisResult(); 
  }, [fetchAnalysisResult]);

  const copyToClipboard = async (text: string | undefined | null, key: string) => {
    if (!text) {
      setError("Kopyalanacak metin bulunamadı.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      setError("Metin panoya kopyalanamadı. Lütfen tarayıcınızın izinlerini kontrol edin.");
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-5xl space-y-8 px-4">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-4 w-60" />
          </div>
          
          <Separator />
          
          {/* Stats Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-8 w-20" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <Skeleton key={j} className="h-6 w-16 rounded-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analysis Sections Skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-2xl space-y-6 px-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/analyses')}
            className="transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Analizlerime Dön
          </Button>
          
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Sonuçlar Yüklenemedi</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => router.push('/dashboard/analyses')}
                    variant="outline"
                  >
                    Analiz Listesi
                  </Button>
                  <Button 
                    onClick={fetchAnalysisResult}
                    className="bg-gradient-to-r from-primary to-primary/90"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Yeniden Dene
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysisResult?.result) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-2xl space-y-6 px-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/analyses')}
            className="transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Analizlerim Listesine Dön
          </Button>
          
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Analiz sonucu bulunamadı veya henüz işleniyor olabilir.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const result = analysisResult.result;
  const matchPercentage = result.gap_analysis.matching_skills.length > 0 
    ? Math.round((result.gap_analysis.matching_skills.length / 
        (result.gap_analysis.matching_skills.length + result.gap_analysis.missing_skills.length)) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col items-center pt-8 md:pt-12 mb-8">
      <div className="w-full max-w-5xl space-y-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3 flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="transition-all duration-200 hover:scale-105"
            >
              <Link href="/dashboard/analyses">
                <ArrowLeft className="mr-2 h-4 w-4" /> 
                Analizlerime Dön
              </Link>
            </Button>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Analiz Sonuçları
              </h1>
              <p className="text-muted-foreground">
                CV'niz ve iş ilanı arasındaki uyumu detaylı şekilde inceleyin
              </p>
            </div>
          </div>

          {/* Match Score */}
          <Card className="md:w-48 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                %{matchPercentage}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                Uyum Skoru
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {result.gap_analysis.matching_skills.length} / {result.gap_analysis.matching_skills.length + result.gap_analysis.missing_skills.length} beceri
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Keywords Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <KeywordCard 
            title="İş İlanı Anahtar Kelimeleri" 
            keywords={result.job_keywords} 
            cardKey="job" 
            copyFn={copyToClipboard} 
            copiedState={copiedStates['job']}
            icon={<Target className="h-5 w-5" />}
            gradient="from-blue-500 to-blue-600"
          />
          <KeywordCard 
            title="CV Anahtar Kelimeleri" 
            keywords={result.cv_keywords} 
            cardKey="cv" 
            copyFn={copyToClipboard} 
            copiedState={copiedStates['cv']}
            icon={<FileText className="h-5 w-5" />}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Gap Analysis */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
          <div className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-primary" />
                Beceri Eşleşme Analizi
              </CardTitle>
              <CardDescription>
                CV'nizde bulunan ve eksik olan becerilerin detaylı analizi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Matching Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Eşleşen Beceriler ({result.gap_analysis.matching_skills.length})
                  </h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Mevcut
                  </Badge>
                </div>
                {result.gap_analysis.matching_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.gap_analysis.matching_skills.map((skill, i) => (
                      <Badge 
                        key={`match-${i}`} 
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Eşleşen beceri bulunamadı.
                  </p>
                )}
              </div>

              <Separator />

              {/* Missing Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Eksik Beceriler ({result.gap_analysis.missing_skills.length})
                  </h4>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Geliştirilebilir
                  </Badge>
                </div>
                {result.gap_analysis.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.gap_analysis.missing_skills.map((skill, i) => (
                      <Badge 
                        key={`miss-${i}`} 
                        variant="outline" 
                        className="border-destructive/50 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Eksik beceri bulunamadı - mükemmel uyum!
                  </p>
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Suggestions */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 via-transparent to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-900/10" />
          <div className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Önerileri ({result.suggestions.length})
              </CardTitle>
              <CardDescription>
                CV'nizi iyileştirmek için kişiselleştirilmiş öneriler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.suggestions.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <AccordionItem 
                      value={`item-${index}`} 
                      key={`suggestion-${index}`}
                      className="border rounded-lg px-4 bg-background/50 hover:bg-accent/30 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline text-base py-4 [&[data-state=open]]:text-primary">
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span>{suggestion.suggestion_title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-4 text-muted-foreground">
                        <p className="leading-relaxed">{suggestion.suggestion_detail}</p>
                        
                        {suggestion.cv_example && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg border relative group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Örnek Uygulama:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 transition-all duration-200 hover:scale-110"
                                onClick={() => copyToClipboard(suggestion.cv_example, `sugg-${index}`)}
                                disabled={copiedStates[`sugg-${index}`]}
                              >
                                {copiedStates[`sugg-${index}`] ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
                              {suggestion.cv_example}
                            </pre>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Bu analiz için öneri bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Cover Letter Draft */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
          <div className="relative">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5 text-primary" />
                    Ön Yazı Taslağı
                  </CardTitle>
                  <CardDescription>
                    İş ilanına özel olarak oluşturulmuş ön yazı taslağı
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(result.cover_letter_draft, 'cover')} 
                  disabled={copiedStates['cover'] || !result.cover_letter_draft}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {copiedStates['cover'] ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                  )}
                  {copiedStates['cover'] ? 'Kopyalandı!' : 'Tümünü Kopyala'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg border min-h-[200px] max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
                  {result.cover_letter_draft || (
                    <div className="text-center text-muted-foreground italic py-8">
                      Ön yazı taslağı oluşturulamadı.
                    </div>
                  )}
                </pre>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface KeywordCardProps {
  title: string;
  keywords: { hard_skills: string[]; soft_skills: string[] };
  cardKey: string;
  copyFn: (text: string | undefined | null, key: string) => void;
  copiedState: boolean;
  icon: React.ReactNode;
  gradient: string;
}

function KeywordCard({ title, keywords, cardKey, copyFn, copiedState, icon, gradient }: KeywordCardProps) {
  const hasHardSkills = keywords.hard_skills?.length > 0;
  const hasSoftSkills = keywords.soft_skills?.length > 0;
  const allSkillsText = `Teknik Beceriler:\n${keywords.hard_skills?.join(', ') || 'Yok'}\n\nSosyal Beceriler:\n${keywords.soft_skills?.join(', ') || 'Yok'}`;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", gradient)} />
      <div className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", `bg-gradient-to-br ${gradient} text-white`)}>
              {icon}
            </div>
            {title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => copyFn(allSkillsText, cardKey)} 
            disabled={copiedState || (!hasHardSkills && !hasSoftSkills)}
            className="transition-all duration-200 hover:scale-105"
          >
            {copiedState ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardCopy className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {hasHardSkills && (
            <div>
              <h4 className="font-medium mb-2 text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3" />
                Teknik Beceriler
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.hard_skills.map((skill, i) => (
                  <Badge 
                    key={`hard-${cardKey}-${i}`} 
                    variant="secondary"
                    className="transition-colors hover:bg-accent/80"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {hasHardSkills && hasSoftSkills && <Separator className="my-3" />}
          
          {hasSoftSkills && (
            <div>
              <h4 className="font-medium mb-2 text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-3 w-3" />
                Sosyal Beceriler
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.soft_skills.map((skill, i) => (
                  <Badge 
                    key={`soft-${cardKey}-${i}`} 
                    variant="outline"
                    className="transition-colors hover:bg-accent/30"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {!hasHardSkills && !hasSoftSkills && (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Anahtar kelime bulunamadı.</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}