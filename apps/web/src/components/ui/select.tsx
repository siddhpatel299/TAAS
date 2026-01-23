import * as React from "react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    labels: Record<string, string>;
    registerLabel: (value: string, label: string) => void;
} | null>(null);

const Select = ({ children, value, onValueChange, open, onOpenChange }: any) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlledOpen = open !== undefined;
    const currentOpen = isControlledOpen ? open : internalOpen;

    // To handle the label display issue, we keep a registry of value -> label
    const [labels, setLabels] = React.useState<Record<string, string>>({});
    const registerLabel = React.useCallback((val: string, label: string) => {
        setLabels((prev) => {
            if (prev[val] === label) return prev;
            return { ...prev, [val]: label };
        });
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlledOpen) setInternalOpen(newOpen);
        onOpenChange?.(newOpen);
    }

    return (
        <SelectContext.Provider value={{ value, onValueChange, open: currentOpen, setOpen: handleOpenChange, labels, registerLabel }}>
            <DropdownMenu open={currentOpen} onOpenChange={handleOpenChange}>
                {children}
            </DropdownMenu>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuTrigger asChild>
        <button
            ref={ref}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    </DropdownMenuTrigger>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    const { value, labels } = context || {};
    const displayValue = (value && labels && labels[value]) ? labels[value] : value;

    return (
        <span ref={ref} className={cn("block truncate", className)} {...props} >
            {displayValue || placeholder}
        </span>
    )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuContent>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuContent
        ref={ref}
        className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
            className
        )}
        {...props}
    >
        <div className={cn("p-1", className)}>
            {children}
        </div>
    </DropdownMenuContent>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & { value: string }
>(({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);

    // Register label on mount/update
    React.useEffect(() => {
        if (typeof children === 'string') {
            context?.registerLabel(value, children);
        }
    }, [value, children, context?.registerLabel]);

    return (
        <DropdownMenuItem
            ref={ref}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            onClick={() => {
                context?.onValueChange(value);
                context?.setOpen(false);
            }}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {context?.value === value && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </DropdownMenuItem>
    )
})
SelectItem.displayName = "SelectItem"

const SelectLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <DropdownMenuLabel className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
)

const SelectSeparator = DropdownMenuSeparator;
const SelectGroup = ({ children }: any) => <>{children}</>;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }
