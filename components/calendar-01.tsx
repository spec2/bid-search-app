"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

interface Calendar01Props {
  onSelect: (date: Date | undefined) => void;
}

export function Calendar01({ onSelect }: Calendar01Props) {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(2025, 5, 12)
  )

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (onSelect) {
      onSelect(newDate);
    }
  };

  return (
    <Calendar
      mode="single"
      defaultMonth={date}
      selected={date}
      onSelect={handleSelect}
      className="rounded-lg border shadow-sm bg-white"
    />
  )
}