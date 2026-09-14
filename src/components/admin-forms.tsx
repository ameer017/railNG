"use client";

import { useActionState } from "react";
import {
  saveStationAction,
  saveTrainAction,
  saveTripAction,
  saveFareAction,
  type AdminState,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ErrorBox } from "@/components/states";

export function StationForm({
  station,
}: {
  station?: { id: string; name: string; city: string; code: string };
}) {
  const [state, action, pending] = useActionState(saveStationAction, {} as AdminState);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-3">
      {station ? <input type="hidden" name="id" value={station.id} /> : null}
      <ErrorBox message={state.error} />
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={station?.name} placeholder="Mobolaji Johnson Station" />
      </div>
      <div>
        <Label>City</Label>
        <Input name="city" required defaultValue={station?.city} placeholder="Lagos" />
      </div>
      <div>
        <Label>Code</Label>
        <Input name="code" required defaultValue={station?.code} placeholder="LOS" />
      </div>
      <div className="md:col-span-3">
        <Button disabled={pending} type="submit">
          {station ? "Save station" : "Add station"}
        </Button>
      </div>
    </form>
  );
}

export function TrainForm({ train }: { train?: { id: string; name: string; code: string } }) {
  const [state, action, pending] = useActionState(saveTrainAction, {} as AdminState);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      {train ? <input type="hidden" name="id" value={train.id} /> : null}
      <ErrorBox message={state.error} />
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={train?.name} placeholder="Lagos–Ibadan Express" />
      </div>
      <div>
        <Label>Code</Label>
        <Input name="code" required defaultValue={train?.code} placeholder="LIEX" />
      </div>
      <div className="md:col-span-2">
        <Button disabled={pending} type="submit">
          {train ? "Save train" : "Add train"}
        </Button>
      </div>
    </form>
  );
}

export function TripForm({
  trip,
  trains,
  stations,
}: {
  trip?: {
    id: string;
    trainId: string;
    originId: string;
    destinationId: string;
    departsAt: string;
    arrivesAt: string;
    status: string;
  };
  trains: { id: string; name: string; code: string }[];
  stations: { id: string; city: string; code: string }[];
}) {
  const [state, action, pending] = useActionState(saveTripAction, {} as AdminState);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      {trip ? <input type="hidden" name="id" value={trip.id} /> : null}
      <ErrorBox message={state.error} />
      <div>
        <Label>Train</Label>
        <Select name="trainId" required defaultValue={trip?.trainId}>
          <option value="">Select</option>
          {trains.map((train) => (
            <option key={train.id} value={train.id}>
              {train.code} — {train.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select name="status" defaultValue={trip?.status ?? "SCHEDULED"}>
          {["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Origin</Label>
        <Select name="originId" required defaultValue={trip?.originId}>
          <option value="">Select</option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.code} · {station.city}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Destination</Label>
        <Select name="destinationId" required defaultValue={trip?.destinationId}>
          <option value="">Select</option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.code} · {station.city}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Departs (WAT)</Label>
        <Input type="datetime-local" name="departsAt" required defaultValue={trip?.departsAt} />
      </div>
      <div>
        <Label>Arrives (WAT)</Label>
        <Input type="datetime-local" name="arrivesAt" required defaultValue={trip?.arrivesAt} />
      </div>
      {!trip ? (
        <>
          <div>
            <Label>Economy ₦</Label>
            <Input type="number" name="economyNaira" defaultValue={6500} min={0} />
          </div>
          <div>
            <Label>Business ₦</Label>
            <Input type="number" name="businessNaira" defaultValue={12000} min={0} />
          </div>
          <div>
            <Label>First ₦</Label>
            <Input type="number" name="firstNaira" defaultValue={18500} min={0} />
          </div>
        </>
      ) : null}
      <div className="md:col-span-2">
        <Button disabled={pending} type="submit">
          {trip ? "Save trip" : "Create trip"}
        </Button>
      </div>
    </form>
  );
}

export function FareForm({
  fare,
}: {
  fare: { id: string; priceKobo: number; totalSeats: number };
}) {
  const [state, action, pending] = useActionState(saveFareAction, {} as AdminState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={fare.id} />
      <div>
        <Label>₦ price</Label>
        <Input type="number" name="priceNaira" defaultValue={fare.priceKobo / 100} min={0} className="w-28" />
      </div>
      <div>
        <Label>Seats</Label>
        <Input type="number" name="totalSeats" defaultValue={fare.totalSeats} min={1} className="w-24" />
      </div>
      <div>
        <Label className="invisible">Save</Label>
        <Button className="h-11" disabled={pending} type="submit">
          Save
        </Button>
      </div>
      {state.error ? <p className="w-full text-xs text-[#9b2335]">{state.error}</p> : null}
      {state.ok ? <p className="w-full text-xs text-[var(--green)]">{state.ok}</p> : null}
    </form>
  );
}
