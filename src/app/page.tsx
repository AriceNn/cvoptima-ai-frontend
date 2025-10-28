// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, FileText, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = useCallback(() => {
    router.push('/register');
  }, [router]);

  const handleLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== HERO BÖLÜMÜ ===== */}
      <section className="w-full flex justify-center py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Yapay Zeka Destekli CV Optimizasyonu</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl xl:text-7xl/none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              CV'nizi <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Geleceğe</span> Hazırlayın
            </h1>
            
            <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              CVOptima, özgeçmişinizi iş ilanlarıyla akıllıca eşleştirerek 
              <span className="font-semibold text-foreground"> mülakat şansınızı %70'e kadar artırmanıza</span> yardımcı olur.
            </p>

            {/* Feature List */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 pt-4">
              {['AI Destekli Analiz', 'Anlık Öneriler', 'Ön Yazı Oluşturucu'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                <span>Ücretsiz Başla</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleLogin}
                className="h-14 px-8 text-lg font-semibold border-2 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/50"
              >
                Giriş Yap
              </Button>
            </div>

            {/* Güven Göstergesi */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">1.000+</span> kullanıcı CV'lerini optimize etti
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ÖZELLİKLER BÖLÜMÜ ===== */}
      <section className="w-full flex justify-center py-20 md:py-28 lg:py-36 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl mb-6">
              Neden <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">CVOptima?</span>
            </h2>
            <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
              Modern iş arama sürecinde ihtiyacınız olan tüm araçlar bir arada
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-primary" />}
              title="Akıllı CV Analizi"
              description="CV'nizi yükleyin, hedeflediğiniz iş ilanıyla karşılaştıralım. Anahtar kelime eşleşmesi, beceri analizi ve optimizasyon önerileri alın."
              features={['Anahtar Kelime Analizi', 'Beceri Eşleştirme', 'Optimizasyon Önerileri']}
            />
            
            <FeatureCard
              icon={<Sparkles className="h-10 w-10 text-primary" />}
              title="Kişiselleştirilmiş Öneriler"
              description="Yapay zeka destekli algoritmamız size özel öneriler sunar. CV'nizi iş tanımına göre optimize edin ve mülakat şansınızı artırın."
              features={['AI Önerileri', 'İlana Özel Optimizasyon', 'Gerçek Zamanlı Analiz']}
            />
            
            <FeatureCard
              icon={<Bot className="h-10 w-10 text-primary" />}
              title="Akıllı Ön Yazı"
              description="Uygun, profesyonel ön yazı taslaklarını saniyeler içinde oluşturun. CV'nizle tutarlı, iş ilanına özel mektuplar yazın."
              features={['Otomatik Oluşturma', 'CV ile Tutarlılık', 'İlana Özel Uyarlama']}
            />
          </div>
        </div>
      </section>

      {/* ===== SON CTA BÖLÜMÜ ===== */}
      <section className="w-full flex justify-center py-20 md:py-32 lg:py-40 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">

            
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl">
              Kariyerinizi <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Bir Üst Seviyeye</span> Taşıyın
            </h2>
            
            <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              Binlerce kullanıcı CVOptima ile iş bulma süreçlerini hızlandırdı. 
              Siz de bugün başlayın ve farkı görün.
            </p>

            {/* Avantajlar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 w-full max-w-md">
              {[
                { label: 'Sınırsız Analiz', value: '∞' },
                { label: 'AI Önerileri', value: '✓' },
                { label: 'Ön Yazı Desteği', value: '✓' },
              ].map((item) => (
                <div key={item.label} className="text-center p-4 rounded-lg bg-background border shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-1">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="h-14 px-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <span>Hemen Başlayın</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Geliştirilmiş Özellik Kartı Bileşeni ---
interface FeatureCardProps { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  features: string[];
}

function FeatureCard({ icon, title, description, features }: FeatureCardProps) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl transform group-hover:scale-105 transition-all duration-300 opacity-0 group-hover:opacity-100" />
      
      <div className="relative grid gap-4 p-6 rounded-2xl border bg-background/60 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30 h-full">
        <div className="flex justify-center md:justify-start">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <div className="text-center md:text-left space-y-3">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          
          <ul className="space-y-2 pt-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}