import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    openItems: string[];
    toggleItem: (value: string) => void;
} | null>(null);

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple", collapsible?: boolean, defaultValue?: string | string[] }
>(({ className, type = "single", collapsible, defaultValue, children, ...props }, ref) => {
    // Basic state management
    const [openItems, setOpenItems] = React.useState<string[]>(
        Array.isArray(defaultValue) ? defaultValue : (defaultValue ? [defaultValue] : [])
    );

    const toggleItem = React.useCallback((value: string) => {
        setOpenItems(prev => {
            if (type === "single") {
                if (prev.includes(value)) {
                    return collapsible ? [] : prev;
                }
                return [value];
            } else {
                return prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value];
            }
        });
    }, [type, collapsible]);

    return (
        <AccordionContext.Provider value={{ openItems, toggleItem }}>
            <div ref={ref} className={cn("space-y-1", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
});
Accordion.displayName = "Accordion";

const AccordionItemContext = React.createContext<{ value: string } | null>(null);

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={{ value }}>
        <div ref={ref} className={cn("border-b", className)} {...props}>
            {children}
        </div>
    </AccordionItemContext.Provider>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value } = React.useContext(AccordionItemContext)!;
    const { openItems, toggleItem } = React.useContext(AccordionContext)!;
    const isOpen = openItems.includes(value);

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => toggleItem(value)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext);
    const accordionContext = React.useContext(AccordionContext);

    if (!itemContext || !accordionContext) return null;

    const isOpen = accordionContext.openItems.includes(itemContext.value);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all animate-accordion-down data-[state=closed]:animate-accordion-up",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
