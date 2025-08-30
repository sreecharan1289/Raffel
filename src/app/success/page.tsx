"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle, Copy, Home, Trophy, Gift } from 'lucide-react';
import Confetti from 'react-confetti';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const tokensParam = searchParams.get('tokens');
  const numberOfEntriesParam = searchParams.get('numberOfEntries');
  
  // Parse tokens and number of entries
  const tokens = tokensParam ? tokensParam.split(',') : [];
  const numberOfEntries = numberOfEntriesParam ? parseInt(numberOfEntriesParam) : 1;
  const isMultipleEntries = numberOfEntries > 1;
  
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Stop confetti after 8 seconds
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    if (tokens.length > 0) {
      const tokenText = isMultipleEntries 
        ? `My Raffle Tokens:\n${tokens.map((token, i) => `Entry ${i + 1}: ${token}`).join('\n')}`
        : tokens[0];
      
      navigator.clipboard.writeText(tokenText);
      toast({
        title: 'Copied! 📋',
        description: isMultipleEntries 
          ? `All ${numberOfEntries} tokens copied to clipboard.`
          : 'Your raffle token has been copied to the clipboard.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in-50 zoom-in-95 border-2 border-green-200 dark:border-green-800">
          <CardHeader className="space-y-4">
            <div className="flex justify-center space-x-2 text-4xl">
              <span className="animate-bounce">🎉</span>
              <span className="animate-bounce delay-100">🎊</span>
              <span className="animate-bounce delay-200">🎉</span>
            </div>
            <div className="mx-auto bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full p-4 w-fit">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <CardTitle className="font-headline text-4xl mt-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              🎉 Success! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              {isMultipleEntries 
                ? `You now have ${numberOfEntries} entries in the raffle! 🎫🎫🎫`
                : 'You\'re officially entered in the raffle! 🎫'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                {isMultipleEntries ? `Your ${numberOfEntries} Entry Tokens` : 'Your Entry Token'}
              </h3>
              
              {isMultipleEntries ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {tokens.map((token, index) => (
                    <div key={token} className="bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-700 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Entry {index + 1}</p>
                        <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">{token}</p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={copyToClipboard} 
                    className="w-full mt-3 hover:bg-green-100 dark:hover:bg-green-900"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Tokens
                  </Button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 flex items-center justify-between transform hover:scale-105 transition-transform">
                  <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">{tokens[0] || 'TOKEN-ERROR'}</p>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy token" className="hover:bg-green-100 dark:hover:bg-green-900">
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              )}
              
              <p className="text-sm text-green-700 dark:text-green-300 mt-3">
                💾 Save {isMultipleEntries ? 'these tokens' : 'this token'}! You'll need {isMultipleEntries ? 'them' : 'it'} if you win.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center justify-center gap-2">
                <Gift className="w-5 h-5" />
                What's Next?
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 text-left">
                <li>• Winner will be announced on the main page</li>
                <li>• Keep your token safe - you'll need it to claim your prize</li>
                <li>• Follow us for updates and announcements</li>
              </ul>
            </div>

            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <span>The winner will be announced soon. Good luck!</span>
              <span className="text-2xl animate-bounce">🍀</span>
            </p>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={() => window.print()} variant="outline" className="flex-1">
              🖨️ Print Token
            </Button>
            <Button asChild className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
