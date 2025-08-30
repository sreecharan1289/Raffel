
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_STATES } from '../../lib/constants';

const formSchema = z.object({
  name: z.string()
    .min(3, { message: 'Name must be at least 3 characters.' })
    .max(50, { message: 'Name must not exceed 50 characters.' })
    .regex(/^[a-zA-Z\s]+$/, { message: 'Name can only contain alphabets and spaces.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit phone number starting with 6-9.' }),
  address: z.string()
    .min(10, { message: 'Address must be at least 10 characters.' })
    .max(200, { message: 'Address must not exceed 200 characters.' }),
  state: z.string().min(1, { message: 'Please select a state.' }),
  pincode: z.string().regex(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits.' }),
  numberOfEntries: z.number().min(1, { message: 'Must buy at least 1 entry.' }).max(60, { message: 'Maximum 60 entries per purchase.' }),
});

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RaffleFormProps {
  isWinnerAnnounced?: boolean;
}

export function RaffleForm({ isWinnerAnnounced = false }: RaffleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfEntries, setNumberOfEntries] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      state: '',
      pincode: '',
      numberOfEntries: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      console.log('Starting payment process...');

      // Create Razorpay order
      const orderResponse = await fetch('/api/raffle/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      console.log('Order response status:', orderResponse.status);

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        console.error('Order creation failed');
        throw new Error(error.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      console.log('Order created successfully');

      // Check if we're in demo mode
      if (orderData.demoMode) {
        console.log('Running in demo mode...');

        const entryText = orderData.numberOfEntries > 1
          ? `${orderData.numberOfEntries} entries have been confirmed!`
          : 'Your entry has been confirmed.';

        toast({
          title: 'Payment Successful! 🎉',
          description: entryText,
        });

        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Redirect to success page with multiple tokens
        const tokensParam = orderData.tokens.join(',');
        router.push(`/success?tokens=${tokensParam}&numberOfEntries=${orderData.numberOfEntries}`);
        return;
      }

      // Check if Razorpay is configured for production mode
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      // Razorpay configuration check

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded. Please refresh the page.');
      }

      // Initialize Razorpay payment
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Sneaker Raffle',
        description: 'Entry fee for Aether-Glide X1 Raffle',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...');

            // Verify payment
            const verifyResponse = await fetch('/api/raffle/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            // Handle both single and multiple entries
            if (verifyData.tokens && verifyData.numberOfEntries > 1) {
              // Multiple entries
              const tokensParam = verifyData.tokens.join(',');
              router.push(`/success?tokens=${tokensParam}&numberOfEntries=${verifyData.numberOfEntries}`);
            } else {
              // Single entry (backward compatibility)
              const token = verifyData.tokens ? verifyData.tokens[0] : verifyData.token;
              router.push(`/success?tokens=${token}&numberOfEntries=1`);
            }
          } catch (error) {
            console.error('Payment verification failed');
            toast({
              variant: 'destructive',
              title: 'Payment Verification Failed',
              description: 'Please contact support if amount was deducted.',
            });
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: values.name,
          email: values.email,
          contact: values.phone,
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
        },
      };

      console.log('Opening Razorpay modal...');
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment process failed');
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
      setIsLoading(false);
    }
  }

  if (isWinnerAnnounced) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">🎉 Raffle Closed</CardTitle>
          <CardDescription className="text-center">
            The winner has been announced!
            <br />
            Thank you to everyone who participated.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🏆 Congratulations to our winner!
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Stay tuned for future raffles and giveaways.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Enter the Raffle</CardTitle>
        <CardDescription>
          More entries mean more chances to win.
          <br />
          Good luck!
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter 10-digit mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Street / Locality)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your complete address"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="numberOfEntries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Entries</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = Math.max(1, field.value - 1);
                            field.onChange(newValue);
                            setNumberOfEntries(newValue);
                          }}
                          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          -
                        </button>
                        <div className="flex-1 text-center">
                          <div className="text-2xl font-bold">{field.value}</div>
                          <div className="text-sm text-muted-foreground">
                            {field.value === 1 ? 'Entry' : 'Entries'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = Math.min(60, field.value + 1);
                            field.onChange(newValue);
                            setNumberOfEntries(newValue);
                          }}
                          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          💡 More entries = Better chances of winning!
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Each entry gets a unique token and increases your odds
                        </p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground animate-pulse-glow" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ₹${numberOfEntries * 100} for ${numberOfEntries} ${numberOfEntries === 1 ? 'Entry' : 'Entries'}`
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
