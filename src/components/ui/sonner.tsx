import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-neutral-900 group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-400",
          success: "group-[.toaster]:bg-green-900/50 group-[.toaster]:border-green-500/20",
          error: "group-[.toaster]:bg-red-900/50 group-[.toaster]:border-red-500/20",
          warning: "group-[.toaster]:bg-yellow-900/50 group-[.toaster]:border-yellow-500/20",
          info: "group-[.toaster]:bg-blue-900/50 group-[.toaster]:border-blue-500/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
