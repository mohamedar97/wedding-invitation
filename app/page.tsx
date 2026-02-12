"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
};

const WEDDING_DATE = new Date("2026-04-18T00:00:00");

function getCountdown(): Countdown {
  const now = new Date().getTime();
  const target = WEDDING_DATE.getTime();
  const distance = target - now;

  if (distance <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      finished: true,
    };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    finished: false,
  };
}

export default function Home() {
  const [countdown, setCountdown] = useState<Countdown>(getCountdown);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const items = useMemo(
    () => [
      { label: "Days", value: countdown.days },
      { label: "Hours", value: countdown.hours },
      { label: "Minutes", value: countdown.minutes },
      { label: "Seconds", value: countdown.seconds },
    ],
    [countdown],
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-amber-50 via-orange-50 to-emerald-50 px-4 py-12">
      <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-yellow-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-600/20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-4xl border-amber-200/80 bg-white/75 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-5 text-center">
          <Badge className="mx-auto w-fit rounded-full bg-amber-700 px-4 py-1 text-xs tracking-widest text-amber-50 uppercase">
            Mohamed and Habiba's Wedding{" "}
          </Badge>
          <CardTitle className="text-3xl leading-tight font-semibold text-amber-900 md:text-5xl">
            We are counting down to our big day
          </CardTitle>
          <p className="text-sm text-amber-800/90 md:text-base">
            April 18, 2026
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {countdown.finished ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
              <p className="text-2xl font-semibold">The day is here.</p>
              <p className="mt-2 text-sm">
                Welcome to our wedding celebration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-amber-200 bg-linear-to-b from-yellow-100/80 to-amber-100 p-4 text-center shadow-sm"
                >
                  <p className="text-3xl font-bold tabular-nums text-amber-900 md:text-5xl">
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-xs tracking-widest text-amber-700 uppercase">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
