// src/app/dashboard/cvs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MoreHorizontal, PlusCircle, FileText, Download, Trash2, CalendarDays, Eye, Loader2, Upload, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { getApiUrl } from '@/lib/apiClient';

// Tipler
interface CVItem { 
  id: string; 
  file_name: string; 
  created_at: string; 
  file_size?: number;
}

interface CVToDelete { id: string; fileName: string; }
interface CVDetailState { id: string | null; fileName: string | null; text: string | null; isLoading: boolean; }
interface CVDetailResponse { 
  id: string; 
  file_name: string; 
  created_at: string; 
  file_path: string; 
  cv_text_content: string;
  file_size?: number;
}

export default function CVListPage() {
  // State'ler
  const [cvs, setCvs] = useState<CVItem[]>([]);
  const [filteredCvs, setFilteredCvs] = useState<CVItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [cvToDelete, setCvToDelete] = useState<CVToDelete | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentCvDetail, setCurrentCvDetail] = useState<CVDetailState>({ 
    id: null, 
    fileName: null, 
    text: null, 
    isLoading: false 
  });
  
  const supabase = createClient();
  const router = useRouter();
  const apiUrl = getApiUrl();

  useEffect(() => { 
    setClientReady(true); 
  }, []);

  // CV'leri filtrele
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCvs(cvs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = cvs.filter(cv => 
        cv.file_name.toLowerCase().includes(query)
      );
      setFilteredCvs(filtered);
    }
  }, [cvs, searchQuery]);

  // CV'leri çekme fonksiyonu
  const fetchCvs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

        const response = await fetch(`${apiUrl}/api/v1/cv`, {
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
      
      const data: { cvs: CVItem[] } = await response.json();
      setCvs(data.cvs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => { 
    fetchCvs(); 
  }, [fetchCvs]);

  // Silme işlemi
  const requestDeleteConfirmation = useCallback((cv: CVToDelete) => {
    setCvToDelete(cv);
    setIsAlertDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!cvToDelete) return;
    setIsAlertDialogOpen(false);
    setLoadingActionId(cvToDelete.id);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      
      const response = await fetch(`${apiUrl}/api/v1/cv/${cvToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        let errorDetail = 'CV silinemedi.';
        try {
          const errorData = await response.json();
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {}
        throw new Error(errorDetail);
      }
      
      setCvs(prevCvs => prevCvs.filter(cv => cv.id !== cvToDelete.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV silinirken hata oluştu.');
    } finally {
      setLoadingActionId(null);
      setCvToDelete(null);
    }
  };

  const handleAlertDialogClose = useCallback((open: boolean) => {
    setIsAlertDialogOpen(open);
    if (!open) {
      setCvToDelete(null);
    }
  }, []);

  // İndirme işlemi
  const handleDownload = async (cvId: string, fileName: string) => {
    setLoadingActionId(cvId);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Oturum bulunamadı");
      
      const response = await fetch(`${apiUrl}/api/v1/cv/${cvId}/download`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        let errorDetail = 'İndirme linki alınamadı.';
        try {
          const errorData = await response.json();
          if (errorData.detail) errorDetail = errorData.detail;
        } catch (e) {}
        throw new Error(errorDetail);
      }
      
      const data: { short_code: string; expires_in: number } = await response.json();
      const downloadUrl = `/dl/${data.short_code}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İndirme linki alınırken hata oluştu.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Detay görüntüleme
  const handleViewDetails = async (cvId: string, fileName: string) => {
    setIsDetailOpen(true);
    setCurrentCvDetail({ id: cvId, fileName: fileName, text: null, isLoading: true });
    setError(null);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Oturum bulunamadı.");
      }
      
      const response = await fetch(`${apiUrl}/api/v1/cv/${cvId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      
      if (!response.ok) {
        let errorDetail = 'CV detayı alınamadı.';
        if (response.status === 404) {
          errorDetail = "CV bulunamadı veya size ait değil.";
        } else {
          try {
            const errorData = await response.json();
            if (errorData.detail) errorDetail = errorData.detail;
          } catch (e) {}
        }
        throw new Error(errorDetail);
      }
      
      const data: CVDetailResponse = await response.json();
      setCurrentCvDetail(prev => ({ 
        ...prev, 
        text: data.cv_text_content, 
        isLoading: false 
      }));
    } catch (err) {
      setCurrentCvDetail(prev => ({ 
        ...prev, 
        text: (err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'), 
        isLoading: false 
      }));
    }
  };

  // Dosya boyutu formatlama
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Bilinmiyor';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render
  if (isLoading && cvs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
        <div className="w-full max-w-6xl space-y-6 px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayCvs = searchQuery ? filteredCvs : cvs;

  return (
    <div className="flex flex-1 flex-col items-center pt-8 md:pt-12">
      <div className="w-full max-w-6xl space-y-6 px-4">
        {/* Başlık ve Aksiyonlar */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                CV'lerim
              </h1>
              <p className="text-muted-foreground">
                Yüklediğiniz özgeçmişleri buradan yönetebilirsiniz.
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              <Link href="/dashboard/cvs/upload">
                <Upload className="mr-2 h-4 w-4" />
                Yeni CV Yükle
              </Link>
            </Button>
          </div>

          {/* Arama Çubuğu */}
          {cvs.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="CV'lerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* Hata Mesajı */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* CV Listesi */}
        {!isLoading && !error && (
          displayCvs.length === 0 ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3">Henüz CV yüklenmedi</CardTitle>
                <CardDescription className="text-lg mb-6 max-w-md">
                  CV'lerinizi analiz etmeye başlamak için ilk CV'nizi yükleyin.
                </CardDescription>
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  <Link href="/dashboard/cvs/upload">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    İlk CV'ni Yükle
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Bilgi Kartı */}
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">
                        {displayCvs.length} CV bulundu
                        {searchQuery && ` ("${searchQuery}" arandı)`}
                      </span>
                    </div>
                    {searchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSearchQuery('')}
                        className="text-xs"
                      >
                        Filtreyi temizle
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mobil Liste */}
              <div className="space-y-4 md:hidden">
                {displayCvs.map((cv) => (
                  <Card key={cv.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 mt-1">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-semibold truncate text-foreground">{cv.file_name}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {clientReady ? format(new Date(cv.created_at), 'dd MMM yyyy') : '...'}
                              </div>
                              {cv.file_size && (
                                <span>{formatFileSize(cv.file_size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={loadingActionId === cv.id}
                              className="h-8 w-8 shrink-0 hover:bg-accent/50"
                            >
                              {loadingActionId === cv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">İşlemler</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleViewDetails(cv.id, cv.file_name)} 
                              disabled={loadingActionId === cv.id}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4"/>
                              Detayları Gör
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownload(cv.id, cv.file_name)} 
                              disabled={loadingActionId === cv.id}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4"/>
                              İndir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2" 
                              onSelect={(e) => { 
                                e.preventDefault(); 
                                requestDeleteConfirmation({ id: cv.id, fileName: cv.file_name }); 
                              }} 
                              disabled={loadingActionId === cv.id}
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

              {/* Masaüstü Tablosu */}
              <Card className="hidden md:block border-0 shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[60px] pl-6">Dosya</TableHead>
                      <TableHead>CV Adı</TableHead>
                      <TableHead className="w-[180px]">Boyut</TableHead>
                      <TableHead className="w-[200px]">Yüklenme Tarihi</TableHead>
                      <TableHead className="text-right w-[120px] pr-6">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCvs.map((cv) => (
                      <TableRow key={cv.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <div className="p-2 rounded-lg bg-primary/10 w-fit">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground truncate max-w-md">
                              {cv.file_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(cv.file_size)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {clientReady ? format(new Date(cv.created_at), 'dd MMMM yyyy, HH:mm') : '...'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={loadingActionId === cv.id}
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/50"
                              >
                                {loadingActionId === cv.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Menüyü aç</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>CV İşlemleri</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(cv.id, cv.file_name)} 
                                disabled={loadingActionId === cv.id}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4"/>
                                Detayları Gör
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownload(cv.id, cv.file_name)} 
                                disabled={loadingActionId === cv.id}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4"/>
                                İndir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2" 
                                onSelect={(e) => { 
                                  e.preventDefault(); 
                                  requestDeleteConfirmation({ id: cv.id, fileName: cv.file_name }); 
                                }} 
                                disabled={loadingActionId === cv.id}
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

        {/* Silme Onay Diyaloğu */}
        <AlertDialog open={isAlertDialogOpen} onOpenChange={handleAlertDialogClose}>
          <AlertDialogContent className="border-0 shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <AlertDialogTitle>CV'yi silmek istediğinize emin misiniz?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Bu işlem geri alınamaz. <strong className="text-foreground">{cvToDelete?.fileName}</strong> dosyası kalıcı olarak silinecektir.
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

        {/* CV Detay Modalı */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                CV Detayları
              </DialogTitle>
              <DialogDescription className="text-base">
                {currentCvDetail.fileName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded-lg">
              {currentCvDetail.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">CV içeriği yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm p-6 bg-muted/30 min-h-[200px]">
                  {currentCvDetail.text || 'CV içeriği bulunamadı.'}
                </pre>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailOpen(false)}
                className="border-2"
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}