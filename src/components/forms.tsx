"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthState } from "@/lib/actions/auth";
import { createBookingAction, payBookingAction, type BookingState } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBox } from "@/components/states";
import { formatNaira } from "@/lib/money";
import { classLabel } from "@/lib/seats";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, {} as AuthState);

  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state.error} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@email.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {} as AuthState);

  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state.error} />
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required placeholder="Amina Bello" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" placeholder="0801 234 5678" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function BookingForm({
  tripId,
  fares,
}: {
  tripId: string;
  fares: { travelClass: "ECONOMY" | "BUSINESS" | "FIRST"; priceKobo: number; remainingSeats: number }[];
}) {
  const [count, setCount] = useState(1);
  const [travelClass, setTravelClass] = useState(fares[0]?.travelClass ?? "ECONOMY");
  const [state, action, pending] = useActionState(createBookingAction, {} as BookingState);
  const fare = fares.find((f) => f.travelClass === travelClass);
  const total = fare ? fare.priceKobo * count : 0;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="passengerCount" value={count} />
      <ErrorBox message={state.error} />
      <div>
        <Label htmlFor="travelClass">Class</Label>
        <select
          id="travelClass"
          name="travelClass"
          value={travelClass}
          onChange={(e) => setTravelClass(e.target.value as typeof travelClass)}
          className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm"
        >
          {fares.map((item) => (
            <option key={item.travelClass} value={item.travelClass} disabled={item.remainingSeats < 1}>
              {classLabel(item.travelClass)} — {item.remainingSeats} seats left
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="passengerCountUi">Passengers</Label>
        <select
          id="passengerCountUi"
          className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n} disabled={Boolean(fare && n > fare.remainingSeats)}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="grid gap-3 rounded-lg border border-[var(--line)] p-4 md:grid-cols-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] md:col-span-2">
              Passenger {i + 1}
            </div>
            <div>
              <Label htmlFor={`passengerName_${i}`}>Full name</Label>
              <Input id={`passengerName_${i}`} name={`passengerName_${i}`} required />
            </div>
            <div>
              <Label htmlFor={`passengerPhone_${i}`}>Phone</Label>
              <Input id={`passengerPhone_${i}`} name={`passengerPhone_${i}`} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--muted)]">
        Total due: <span className="font-semibold text-[var(--navy)]">{formatNaira(total)}</span>
      </p>
      <Button className="w-full" disabled={pending || !fare || fare.remainingSeats < count} type="submit">
        {pending ? "Holding seats…" : "Continue to payment"}
      </Button>
    </form>
  );
}

export function PayForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(payBookingAction, {} as BookingState);

  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <ErrorBox message={state.error} />
      <Button className="w-full" size="lg" disabled={pending} type="submit">
        {pending ? "Charging mock wallet…" : "Pay with mock wallet"}
      </Button>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">
        Demo only. No real charge.
      </p>
    </form>
  );
}
