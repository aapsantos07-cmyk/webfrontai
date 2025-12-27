import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate - new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-4 sm:p-6 min-w-[70px] sm:min-w-[90px] shadow-2xl group-hover:scale-105 transition-transform duration-300">
          <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-b from-white via-blue-100 to-blue-300 bg-clip-text text-transparent tabular-nums animate-pulse">
            {String(value).padStart(2, '0')}
          </div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider mt-3">
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center gap-3 sm:gap-6 mb-10">
      <TimeUnit value={timeLeft.days} label="Days" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <div className="flex items-center text-3xl sm:text-5xl font-bold text-blue-500 animate-pulse -mt-4">:</div>
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
