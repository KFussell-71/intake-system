import * as React from "react"

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-indigo-500 transition-all"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
