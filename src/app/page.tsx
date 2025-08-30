
"use client";

import Image from 'next/image';
import { Header } from '@/components/Header';
import { RaffleForm } from '@/components/RaffleForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import Confetti from 'react-confetti';

type Winner = {
  name: string;
  token: string;
};

export default function Home() {
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch current winner from API
    const fetchWinner = async () => {
      try {
        const response = await fetch('/api/winner');
        if (response.ok) {
          const data = await response.json();
          if (data.winner) {
            setWinner(data.winner);
            setShowConfetti(true);
            // Show confetti for longer
            setTimeout(() => setShowConfetti(false), 10000);
          }
        }
      } catch (error) {
        console.error('Failed to fetch winner:', error);
      }
    };

    fetchWinner();

    // Poll for winner updates every 30 seconds
    const interval = setInterval(fetchWinner, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    if (newCount >= 7) {
      router.push('/login');
      setAdminClickCount(0);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <Header />
      <main className="flex-1 container mx-auto py-1 md:py-2">
        {winner && (
          <Card className="mb-12 md:mb-16 text-center shadow-2xl animate-in fade-in-50 zoom-in-95 border-2 border-primary bg-primary/5">
            <CardHeader>
              <div className="mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 w-fit ring-4 ring-yellow-300 dark:ring-yellow-700">
                <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="font-headline text-3xl mt-4">We Have a Winner!</CardTitle>
              <CardDescription>Congratulations to the lucky winner of the "Aether-Glide" X1!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-bold font-headline text-primary">{winner.name}</p>
              <div className="border-dashed border-2 border-primary/50 bg-primary/10 rounded-lg p-2 flex items-center justify-center w-fit mx-auto">
                <p className="text-primary font-mono text-sm font-bold">Winning Token: {winner.token}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="flex flex-col items-center mt-16 md:mt-20 animate-in fade-in-50 zoom-in-90">
            <Card className="w-full max-w-2xl overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:scale-105 duration-300">
              <CardContent className="p-0">
                <Image
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Aether-Glide X1 - Limited Edition Sneaker"
                  width={1000}
                  height={750}
                  className="object-cover w-full h-auto aspect-[4/3]"
                  priority
                />
              </CardContent>
            </Card>
            <div className="mt-6 text-center">
              <h2 className="text-4xl font-headline font-bold">The "Aether-Glide" X1</h2>
              <p className="text-muted-foreground mt-2"></p>
            </div>
          </div>
          <div className="w-full max-w-lg mx-auto mt-4 md:mt-6 animate-in fade-in-50 zoom-in-95 duration-500 delay-150">
            <RaffleForm isWinnerAnnounced={!!winner} />
          </div>
        </div>
        <Card className="mt-12 md:mt-20 animate-in fade-in-50 duration-500 delay-300">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Fill the Form:</span> Enter your name, email, and phone number.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Pay the Fee:</span> A small entry fee of ₹100 is required to enter the raffle.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Get Your Token:</span> After successful payment, you'll receive a unique raffle token.</span>
              </li>
              <li className="flex items-start gap-3 cursor-pointer" onClick={handleAdminClick}>
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><span className="font-semibold text-foreground">Winner Announcement:</span> A winner will be chosen at random. Keep an eye on your email!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
