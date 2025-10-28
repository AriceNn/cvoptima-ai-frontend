// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle, FileText, BarChart2, CheckCircle, ArrowRight, Upload, Sparkles, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface CVItem {
  id: string;
  file_name: string;
  created_at: string;
}

interface AnalysisJobItem {
  id: string;
  status: string;
  created_at: string;
  cv_id: string;
}

interface DashboardStats {
  userEmail: string;
  totalCVs: number;
  totalAnalyses: number;
  completedAnalyses: number;
  recentCVs: CVItem[];
  recentAnalyses: AnalysisJobItem[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const fetchDashboardData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) { 
        router.push('/login'); 
        return; 
      }
      
      setUser(session.user);

      const [cvResponse, analysisResponse] = await Promise.all([
        fetch('http://localhost:8000/api/v1/cv', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('http://localhost:8000/api/v1/analysis', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);

      if (!cvResponse.ok) {
        const errorText = await cvResponse.text();
        throw new Error(`CV verileri alınamadı: ${cvResponse.status} ${errorText}`);
      }
      
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        throw new Error(`Analiz verileri alınamadı: ${analysisResponse.status} ${errorText}`);
      }

      const cvData: { cvs: CVItem[] } = await cvResponse.json();
      const analysisData: { jobs: AnalysisJobItem[] } = await analysisResponse.json();

      // Son 3 CV ve analizi al
      const recentCVs = cvData.cvs?.slice(0, 3) || [];
      const recentAnalyses = analysisData.jobs?.slice(0, 3) || [];

      const calculatedStats: DashboardStats = {
        userEmail: session.user.email || 'Kullanıcı',
        totalCVs: cvData.cvs?.length || 0,
        totalAnalyses: analysisData.jobs?.length || 0,
        completedAnalyses: analysisData.jobs?.filter(job => job.status === 'completed').length || 0,
        recentCVs,
        recentAnalyses,
      };
      
      setStats(calculatedStats);

    } catch (err) {
      console.error("Dashboard verisi alınırken hata:", err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Yükleniyor Durumu
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-6xl space-y-8 px-4">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-9 w-80" />
            <Skeleton className="h-6 w-60" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Cards Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hata Durumu
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center pt-8 md:pt-12">
        <div className="w-full max-w-2xl px-4">
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Veriler Yüklenemedi</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="mt-4"
                >
                  Yeniden Dene
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
      <div className="w-full max-w-6xl space-y-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Hoş Geldiniz
                </h1>
                <p className="text-lg text-muted-foreground truncate" title={stats?.userEmail}>
                  {stats?.userEmail}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full md:w-auto"
          >
            {refreshing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Yenileniyor...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Verileri Yenile
              </>
            )}
          </Button>
        </div>

        {/* Stats Grid - 3 KART */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Toplam CV"
            value={stats?.totalCVs.toString() ?? '0'}
            icon={<FileText className="h-5 w-5" />}
            description="Yüklenen CV sayısı"
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Tamamlanan Analiz"
            value={stats?.completedAnalyses.toString() ?? '0'}
            icon={<CheckCircle className="h-5 w-5" />}
            description="Başarıyla tamamlanan analizler"
            gradient="from-green-500 to-green-600"
          />
          <StatCard
            title="Toplam Analiz"
            value={stats?.totalAnalyses.toString() ?? '0'}
            icon={<BarChart2 className="h-5 w-5" />}
            description="Başlatılan toplam analiz"
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
            <div className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Hızlı İşlemler
                </CardTitle>
                <CardDescription>
                  CV'lerinizi yönetin ve yeni analizler başlatın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Button 
                    asChild 
                    className="h-12 justify-start gap-3 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                  >
                    <Link href="/dashboard/analyses/new">
                      <PlusCircle className="h-5 w-5" />
                      <span>Yeni Analiz Başlat</span>
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline"
                    className="h-12 justify-start gap-3 text-base font-medium border-2 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/50 group"
                  >
                    <Link href="/dashboard/cvs/upload">
                      <Upload className="h-5 w-5" />
                      <span>CV Yükle</span>
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>

                  <Button 
                    asChild 
                    variant="outline"
                    className="h-12 justify-start gap-3 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-md group"
                  >
                    <Link href="/dashboard/cvs">
                      <FileText className="h-5 w-5" />
                      <span>CV'lerimi Görüntüle</span>
                      <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-muted/10" />
            <div className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>
                  Son yüklediğiniz CV'ler ve analizler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recent CVs */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">SON CV'LER</h4>
                  <div className="space-y-2">
                    {stats?.recentCVs && stats.recentCVs.length > 0 ? (
                      stats.recentCVs.map((cv) => (
                        <div key={cv.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{cv.file_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDate(cv.created_at)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz CV yüklenmemiş
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Analyses */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">SON ANALİZLER</h4>
                  <div className="space-y-2">
                    {stats?.recentAnalyses && stats.recentAnalyses.length > 0 ? (
                      stats.recentAnalyses.map((analysis) => (
                        <div key={analysis.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              analysis.status === 'completed' ? "bg-green-500" :
                              analysis.status === 'processing' ? "bg-yellow-500" : "bg-blue-500"
                            )} />
                            <span className="text-sm font-medium capitalize">{analysis.status}</span>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDate(analysis.created_at)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz analiz başlatılmamış
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

function StatCard({ title, value, icon, description, gradient }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", gradient)} />
      <div className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn(
            "p-2 rounded-lg transition-colors duration-300",
            `bg-gradient-to-br ${gradient}`
          )}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </div>
    </Card>
  );
}