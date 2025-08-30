
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trophy, Users, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Confetti from 'react-confetti';


type Participant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  token: string;
  paymentId: string;
  date: Date;
};

// Mock data
const mockParticipants: Participant[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '9876543210', token: 'SD-482910-F8A2B', paymentId: 'pay_Nf9s8d7...', date: new Date('2024-07-28T10:00:00Z') },
  { id: 2, name: 'Bob Williams', email: 'bob@example.com', phone: '9876543211', token: 'SD-921034-C3D4E', paymentId: 'pay_Nf9s9e8...', date: new Date('2024-07-28T10:05:00Z') },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', phone: '9876543212', token: 'SD-104829-G5H6J', paymentId: 'pay_Nf9t1f9...', date: new Date('2024-07-28T10:15:00Z') },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', phone: '9876543213', token: 'SD-582910-K7L8M', paymentId: 'pay_Nf9u2g0...', date: new Date('2024-07-28T11:00:00Z') },
  { id: 5, name: 'Ethan Hunt', email: 'ethan@example.com', phone: '9876543214', token: 'SD-692103-N9P0Q', paymentId: 'pay_Nf9v3h1...', date: new Date('2024-07-28T11:30:00Z') },
  { id: 6, name: 'Fiona Glenanne', email: 'fiona@example.com', phone: '9876543215', token: 'SD-820482-R1S2T', paymentId: 'pay_Nf9w4i2...', date: new Date('2024-07-28T12:00:00Z') },
];


export function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [highlighted, setHighlighted] = useState<Participant | null>(null);
  const [isWinnerPicked, setIsWinnerPicked] = useState(false);
  const [showAdminConfetti, setShowAdminConfetti] = useState(false);

  useEffect(() => {
    setParticipants(mockParticipants);
    const storedWinner = localStorage.getItem('raffleWinner');
    if (storedWinner) {
      const winnerData = JSON.parse(storedWinner);
      const winnerParticipant = mockParticipants.find(p => p.token === winnerData.token);
      if(winnerParticipant) {
        setWinner(winnerParticipant);
        setHighlighted(winnerParticipant);
        setIsWinnerPicked(true);
      }
    }
  }, []);

  const pickWinner = () => {
    if (participants.length === 0) return;
    setIsPicking(true);
    setWinner(null);
    setHighlighted(null);
    setIsWinnerPicked(false);

    const spinDuration = 5000;
    const intervalTime = 100;
    let elapsed = 0;
    
    const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * participants.length);
        setHighlighted(participants[randomIndex]);
        elapsed += intervalTime;
        if(elapsed >= spinDuration) {
            clearInterval(spinInterval);
            const finalWinnerIndex = Math.floor(Math.random() * participants.length);
            const finalWinner = participants[finalWinnerIndex];
            
            // Persist winner to localStorage but don't reveal yet
            localStorage.setItem('raffleWinner', JSON.stringify({ name: finalWinner.name, token: finalWinner.token }));

            setIsPicking(false);
            setIsWinnerPicked(true);
            setHighlighted(null); // Clear highlight after spinning
        }
    }, intervalTime);
  };

  const revealWinner = () => {
    const storedWinner = localStorage.getItem('raffleWinner');
    if(storedWinner) {
        const winnerData = JSON.parse(storedWinner);
        const winnerParticipant = participants.find(p => p.token === winnerData.token);
        if(winnerParticipant) {
            setWinner(winnerParticipant);
            setHighlighted(winnerParticipant);
            setShowAdminConfetti(true);
            setTimeout(() => setShowAdminConfetti(false), 8000);
        }
    }
  }
  
  const resetRaffle = () => {
    localStorage.removeItem('raffleWinner');
    setWinner(null);
    setHighlighted(null);
    setIsWinnerPicked(false);
    setShowAdminConfetti(false);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Token', 'Payment ID', 'Entry Date'];
    const rows = participants.map(p => [p.id, p.name, p.email, p.phone, p.token, p.paymentId, p.date.toISOString()].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pbn-x-raffle_participants_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayParticipant = isPicking ? highlighted : winner;

  return (
    <div className="space-y-8">
      {showAdminConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isPicking ? 'Picking...' : (winner ? 'Winner' : (isWinnerPicked ? 'Winner Picked' : 'Raffle Status'))}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold transition-all">
                {displayParticipant ? displayParticipant.name : (isWinnerPicked ? 'Ready to Reveal' : 'Not Picked')}
            </div>
            {displayParticipant && <p className="text-xs text-muted-foreground">{displayParticipant.token}</p>}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle>Raffle Participants</CardTitle>
                <CardDescription>A list of all users who have entered the raffle.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={exportToCSV} variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" disabled={!isWinnerPicked && !winner}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Reset
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear the current winner and allow you to pick a new one. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetRaffle}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {isWinnerPicked && !winner ? (
                     <Button onClick={revealWinner} className="bg-green-600 hover:bg-green-700 text-accent-foreground">
                        <Eye className="mr-2 h-4 w-4" /> Reveal Winner
                    </Button>
                ) : !isWinnerPicked && !winner ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={isPicking} className="bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50">
                                {isPicking ? 'Picking...' : <><Trophy className="mr-2 h-4 w-4" /> Pick Winner</>}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to pick a winner?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will randomly select a winner. This process is final and cannot be undone until you reset.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={pickWinner}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : null}
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden md:table-cell">Raffle Token</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id} className={highlighted?.id === participant.id ? 'bg-primary/10' : ''}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.phone}</TableCell>
                  <TableCell className="font-mono hidden md:table-cell">{participant.token}</TableCell>
                  <TableCell className="hidden sm:table-cell">{participant.date.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {winner?.id === participant.id && (
                       <Badge className="bg-green-600 hover:bg-green-700 text-white">Winner</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    
