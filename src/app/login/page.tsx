// src/app/login/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Github, Chrome, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<null | 'google' | 'github'>(null);
  const router = useRouter();
  const supabase = createClient();

  // Giriş yapmış kullanıcıyı dashboard'a yönlendir
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };
    
    checkUser();
  }, [supabase, router]);

  const handleInputChange = useCallback((field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      setError(null);
    }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (user) {
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Giriş sırasında bir hata oluştu';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSocialLoading(provider);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw new Error(oauthError.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sosyal giriş başarısız oldu';
      setError(errorMessage);
      setIsSocialLoading(null);
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const isFormValid = formData.email.trim() && formData.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 group">
              <span className="font-bold text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                CVOptima
              </span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hesabınıza Giriş Yapın
          </h1>
          <p className="text-muted-foreground">
            CV'lerinizi yönetmeye devam edin
          </p>
        </div>

        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Gradient Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
          
          <div className="relative">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl font-semibold">Hoş Geldiniz</CardTitle>
              <CardDescription className="text-base">
                Devam etmek için hesabınıza giriş yapın
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Email Input */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    E-posta Adresi
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    required
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    disabled={isLoading || !!isSocialLoading}
                    autoComplete="email"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Şifre
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      required
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={isLoading || !!isSocialLoading}
                      autoComplete="current-password"
                      className="h-12 pr-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading || !!isSocialLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Social Login Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-sm text-muted-foreground font-medium">
                      Veya sosyal hesapla devam et
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading || !!isSocialLoading}
                    className="h-12 transition-all duration-200 hover:scale-105 hover:shadow-md border-2"
                  >
                    {isSocialLoading === 'google' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Chrome className="h-5 w-5 mr-2" />
                        Google
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('github')}
                    disabled={isLoading || !!isSocialLoading}
                    className="h-12 transition-all duration-200 hover:scale-105 hover:shadow-md border-2"
                  >
                    {isSocialLoading === 'github' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Github className="h-5 w-5 mr-2" />
                        GitHub
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-6">
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 text-base font-semibold transition-all duration-300",
                    isFormValid 
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  disabled={!isFormValid || isLoading || !!isSocialLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Hesabınız yok mu?{' '}
                    <Link 
                      href="/register" 
                      className="font-semibold text-primary hover:underline transition-colors duration-200"
                    >
                      Hemen kayıt olun
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </div>
        </Card>

      </div>
    </div>
  );
}