import React from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { NetworkSimulator } from '@/components/landing/NetworkSimulator';
import { ArchitectureSection } from '@/components/landing/ArchitectureSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#090d16] text-white selection:bg-indigo-500 selection:text-white">
      <HeroSection />
      <NetworkSimulator />
      <ArchitectureSection />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
