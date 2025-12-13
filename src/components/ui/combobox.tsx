
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
import { ScrollArea } from "./scroll-area"

interface ComboboxProps {
    items: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
}

export function Combobox({ items, value, onChange, placeholder, searchPlaceholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.value === value)?.label.split('(')[0]
            : placeholder || "Select item..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search item..."} />
            <CommandList>
                <ScrollArea className="h-72">
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                    {items.map((item) => (
                        <CommandItem
                        key={item.label}
                        value={item.label}
                        onSelect={() => {
                            onChange(item.value === value ? "" : item.value)
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
                </ScrollArea>
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
