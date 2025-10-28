// src/app/dashboard/analyses/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MoreHorizontal, PlusCircle, FileText, Trash2, CalendarDays, Eye, RefreshCw, CheckCircle, XCircle, BarChart3, Search, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface AnalysisJobItem {
  id: string;
  cv_file_name: string | null;
  job_description_snippet: string | null;
  status: 'pending' | 'completed' | 'failed' | string;
  created_at: string;
}

interface JobToDelete {
  id: string;
  cvFileName: string | null;
}

const POLLING_INTERVAL = 5000;

export default function AnalysesListPage() {
  const [analyses, setAnalyses] = useState<AnalysisJobItem[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisJobItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobToDelete | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { 
    setClientReady(true); 
  }, []);

  // Filter analyses based on search and status
  useEffect(() => {
    let filtered = analyses;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.cv_file_name?.toLowerCase().includes(query) ||
        job.job_description_snippet?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredAnalyses(filtered);
  }, [analyses, searchQuery, statusFilter]);

  const fetchAnalyses = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    if (showLoading) setError(null);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { 
        router.push('/login'); 
        return; 
      }
      
      const response = await fetch('http://localhost:8000/api/v1/analysis', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        if (showLoading) {
          let errorDetail = 'Analiz listesi alınamadı.';
          try {
            const errorData = await response.json();
            if (errorData.detail) errorDetail = errorData.detail;
          } catch (e) {}
          throw new Error(errorDetail);
        } else {
          console.warn("Polling: Analiz listesi alınamadı.");
          return;
        }
      }
      
      const data: { jobs: AnalysisJobItem[] } = await response.json();
      setAnalyses(data.jobs || []);

    } catch (err) {
      if (showLoading) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
      } else {
        console.error("Polling hatası:", err);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [supabase, router]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const hasPendingJobs = analyses.some(job => job.status === 'pending');

    if (hasPendingJobs) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          fetchAnalyses(false);
        }, POLLING_INTERVAL);
      }
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [analyses, fetchAnalyses, stopPolling]);

  useEffect(() => {
    fetchAnalyses(true);
  }, [fetchAnalyses]);

  const requestDeleteConfirmation = useCallback((job: JobToDelete) => {
    setJobToDelete(job);
    setIsAlertDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setIsAlertDialogOpen(false);
    setLoadingActionId(jobToDelete.id);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      
      const response = await fetch(`http://localhost:8000/api/v1/analysis/${jobToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        let errorDetail = 'Analiz silinemedi.';
        try {
          const errorData = await response.json();
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {}
        throw new Error(errorDetail);
      }
      
      setAnalyses(prev => prev.filter(job => job.id !== jobToDelete.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analiz silinirken hata oluştu.');
    } finally {
      setLoadingActionId(null);
      setJobToDelete(null);
    }
  };

  const handleAlertDialogClose = useCallback((open: boolean) => {
    setIsAlertDialogOpen(open);
    if (!open) {
      setJobToDelete(null);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    let classes = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    let icon = null;
    let text = status;

    switch (status) {
      case 'completed':
        classes = cn(classes, "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400");
        icon = <CheckCircle className="mr-1 h-3 w-3" />;
        text = "Tamamlandı";
        break;
      case 'pending':
        classes = cn(classes, "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400");
        icon = <RefreshCw className="mr-1 h-3 w-3 animate-spin" />;
        text = "İşleniyor";
        break;
      case 'failed':
        classes = cn(classes, "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive");
        icon = <XCircle className="mr-1 h-3 w-3" />;
        text = "Başarısız";
        break;
      default:
        classes = cn(classes, "border-border bg-muted/50 text-muted-foreground");
        text = status.charAt(0).toUpperCase() + status.slice(1);
    }
    return <span className={classes}>{icon}{text}</span>;
  };

  const getStatusCount = (status: string) => {
    return analyses.filter(job => job.status === status).length;
  };

  const handleRefresh = () => {
    fetchAnalyses(true);
  };

  // Yükleniyor Durumu
  if (isLoading && analyses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-6xl space-y-6 px-4">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayAnalyses = searchQuery || statusFilter !== 'all' ? filteredAnalyses : analyses;

  return (
    <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
      <div className="w-full max-w-7xl space-y-6 px-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Analizlerim
            </h1>
            <p className="text-muted-foreground">
              Başlattığınız CV analizlerini ve durumlarını takip edin
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Link href="/dashboard/analyses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Analiz
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        {analyses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Toplam</p>
                    <p className="text-2xl font-bold">{analyses.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                    <p className="text-2xl font-bold text-green-600">{getStatusCount('completed')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">İşleniyor</p>
                    <p className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Başarısız</p>
                    <p className="text-2xl font-bold text-red-600">{getStatusCount('failed')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        {analyses.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="CV veya ilan metninde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Tümü
                  </Button>
                  <Button
                    variant={statusFilter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                  >
                    Tamamlanan
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                  >
                    İşleniyor
                  </Button>
                </div>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Yenile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis List */}
        {!isLoading && !error && (
          displayAnalyses.length === 0 ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <BarChart3 className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3">Henüz analiz başlatmadınız</CardTitle>
                <CardDescription className="text-lg mb-6 max-w-md">
                  CV'lerinizi analiz etmeye başlamak için ilk analizinizi oluşturun.
                </CardDescription>
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  <Link href="/dashboard/analyses/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    İlk Analizi Başlat
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Results Info */}
              {(searchQuery || statusFilter !== 'all') && (
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Filter className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">
                          {displayAnalyses.length} analiz bulundu
                          {searchQuery && ` ("${searchQuery}" arandı)`}
                          {statusFilter !== 'all' && ` (${statusFilter} durumu)`}
                        </span>
                      </div>
                      {(searchQuery || statusFilter !== 'all') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="text-xs"
                        >
                          Filtreleri temizle
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobile List */}
              <div className="space-y-4 md:hidden">
                {displayAnalyses.map((job) => (
                  <Card key={job.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 mt-1">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className="font-semibold truncate text-foreground">
                              {job.cv_file_name ?? 'Bilinmeyen CV'}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.job_description_snippet ?? 'İlan açıklaması yok'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {clientReady ? format(new Date(job.created_at), 'dd MMM yy HH:mm') : '...'}
                              </span>
                              {getStatusBadge(job.status)}
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={loadingActionId === job.id}
                              className="h-8 w-8 shrink-0 hover:bg-accent/50"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">İşlemler</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              asChild 
                              disabled={job.status !== 'completed' || loadingActionId === job.id}
                              className="gap-2"
                            >
                              <Link href={`/dashboard/analyses/${job.id}`}>
                                <Eye className="h-4 w-4"/>
                                Sonucu Gör
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2" 
                              onSelect={(e) => { 
                                e.preventDefault(); 
                                requestDeleteConfirmation({ id: job.id, cvFileName: job.cv_file_name }); 
                              }} 
                              disabled={loadingActionId === job.id}
                            >
                              <Trash2 className="h-4 w-4"/>
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table */}
              <Card className="hidden md:block border-0 shadow-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[25%]">CV Dosyası</TableHead>
                      <TableHead className="w-[35%]">İlan Özeti</TableHead>
                      <TableHead className="w-[15%]">Durum</TableHead>
                      <TableHead className="w-[15%]">Başlatma Tarihi</TableHead>
                      <TableHead className="text-right w-[10%]">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAnalyses.map((job) => (
                      <TableRow key={job.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-[200px]">
                              {job.cv_file_name ?? '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.job_description_snippet ?? '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {clientReady ? format(new Date(job.created_at), 'dd MMM yyyy, HH:mm') : '...'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={loadingActionId === job.id}
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menüyü aç</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Analiz İşlemleri</DropdownMenuLabel>
                              <DropdownMenuItem 
                                asChild 
                                disabled={job.status !== 'completed' || loadingActionId === job.id}
                                className="gap-2"
                              >
                                <Link href={`/dashboard/analyses/${job.id}`}>
                                  <Eye className="h-4 w-4"/>
                                  Sonucu Gör
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2" 
                                onSelect={(e) => { 
                                  e.preventDefault(); 
                                  requestDeleteConfirmation({ id: job.id, cvFileName: job.cv_file_name }); 
                                }} 
                                disabled={loadingActionId === job.id}
                              >
                                <Trash2 className="h-4 w-4"/>
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isAlertDialogOpen} onOpenChange={handleAlertDialogClose}>
          <AlertDialogContent className="border-0 shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <AlertDialogTitle>Analizi silmek istediğinize emin misiniz?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Bu işlem geri alınamaz. <strong className="text-foreground">{jobToDelete?.cvFileName ?? 'Seçili'}</strong> CV ile başlatılan analiz kalıcı olarak silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-2">İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}