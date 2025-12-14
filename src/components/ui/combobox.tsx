
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { countries } from "@/lib/countries"

interface ComboboxProps {
    items: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
}

export function Combobox({ items, value, onChange, placeholder, searchPlaceholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = items.find((item) => item.value === value);
  const country = countries.find(c => c.dial_code === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {country ? `${country.flag} ${country.dial_code}` : placeholder || "Select..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        sideOffset={8}
        collisionPadding={8}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search..."} />
          <CommandList className="max-h-[250px] overflow-y-auto overflow-x-hidden">
                <CommandEmpty>No item found.</CommandEmpty>
                <CommandGroup>
                {items.map((item) => (
                    <CommandItem
                    key={item.label}
                    value={item.label}
                    onSelect={() => {
                        onChange(item.value)
                        setOpen(false)
                    }}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === item.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {item.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
