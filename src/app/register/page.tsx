// src/app/register/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Github, Chrome, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<null | 'google' | 'github'>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = useCallback((field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      setError(null);
      setSuccessMessage(null);
    }, []);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (user) {
        setSuccessMessage('Kayıt başarılı! Giriş yapmak için e-posta adresinize gönderilen doğrulama linkine tıklayın.');
        setFormData({ email: '', password: '', confirmPassword: '' });
        
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSocialLoading(provider);
    setError(null);
    setSuccessMessage(null);

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

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const isFormValid = formData.email.trim() && 
                     formData.password.length >= 8 && 
                     formData.confirmPassword && 
                     formData.password === formData.confirmPassword;

  const passwordStrength = formData.password.length >= 8 ? 
    (formData.password.length >= 12 ? 'strong' : 'medium') : 'weak';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
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
            Hesap Oluşturun
          </h1>
          <p className="text-muted-foreground">
            CV'lerinizi yönetmeye başlayın
          </p>
        </div>

        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Gradient Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2" />
          
          <div className="relative">
            <CardHeader className="text-center space-y-4 pb-6">
              <CardTitle className="text-2xl font-semibold">Kayıt Ol</CardTitle>
              <CardDescription className="text-base">
                CV'lerinizi optimize etmeye başlamak için hesabınızı oluşturun
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister}>
              <CardContent className="space-y-6">
                {/* Social Login Buttons - First */}
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

                {/* Social Login Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-4 text-sm text-muted-foreground font-medium">
                      Veya e-posta ile kaydolun
                    </span>
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
                    disabled={isLoading || !!isSocialLoading || !!successMessage}
                    autoComplete="email"
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Şifre (En az 8 karakter)
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={isLoading || !!isSocialLoading || !!successMessage}
                      autoComplete="new-password"
                      className="h-12 pr-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading || !!isSocialLoading || !!successMessage}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        passwordStrength === 'weak' && "bg-red-500",
                        passwordStrength === 'medium' && "bg-yellow-500",
                        passwordStrength === 'strong' && "bg-green-500"
                      )} />
                      <span className={cn(
                        "font-medium",
                        passwordStrength === 'weak' && "text-red-600",
                        passwordStrength === 'medium' && "text-yellow-600",
                        passwordStrength === 'strong' && "text-green-600"
                      )}>
                        {passwordStrength === 'weak' && 'Zayıf şifre'}
                        {passwordStrength === 'medium' && 'Orta şifre'}
                        {passwordStrength === 'strong' && 'Güçlü şifre'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Şifreyi Tekrar Girin
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Şifrenizi tekrar girin"
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      disabled={isLoading || !!isSocialLoading || !!successMessage}
                      autoComplete="new-password"
                      className={cn(
                        "h-12 pr-12 transition-all duration-200 focus:ring-2",
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? "focus:ring-red-200 border-red-300"
                          : "focus:ring-primary/20"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={toggleConfirmPasswordVisibility}
                      disabled={isLoading || !!isSocialLoading || !!successMessage}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 font-medium">Şifreler eşleşiyor</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 font-medium">Şifreler eşleşmiyor</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-6">
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 text-base font-semibold transition-all duration-300",
                    isFormValid && !successMessage
                      ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  disabled={!isFormValid || isLoading || !!isSocialLoading || !!successMessage}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Hesap Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Hesap Oluştur
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Zaten hesabınız var mı?{' '}
                    <Link 
                      href="/login" 
                      className="font-semibold text-primary hover:underline transition-colors duration-200"
                    >
                      Giriş yapın
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Kayıt olarak CVOptima'nın hizmetlerinden yararlanmayı kabul edersiniz.
          </p>
        </div>
      </div>
    </div>
  );
}