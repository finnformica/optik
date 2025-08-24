import { cn } from "@/lib/utils";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "p"
  | "blockquote"
  | "list"
  | "inlineCode"
  | "lead"
  | "large"
  | "small"
  | "muted";

export const Typography = ({
  variant,
  children,
  className,
}: {
  variant: TypographyVariant;
  children: React.ReactNode;
  className?: string;
}) => {
  switch (variant) {
    case "h1":
      return <TypographyH1 className={className}>{children}</TypographyH1>;
    case "h2":
      return <TypographyH2 className={className}>{children}</TypographyH2>;
    case "h3":
      return <TypographyH3 className={className}>{children}</TypographyH3>;
    case "h4":
      return <TypographyH4 className={className}>{children}</TypographyH4>;
    case "blockquote":
      return (
        <TypographyBlockquote className={className}>
          {children}
        </TypographyBlockquote>
      );
    case "list":
      return <TypographyList className={className}>{children}</TypographyList>;
    case "inlineCode":
      return (
        <TypographyInlineCode className={className}>
          {children}
        </TypographyInlineCode>
      );
    case "lead":
      return <TypographyLead className={className}>{children}</TypographyLead>;
    case "large":
      return (
        <TypographyLarge className={className}>{children}</TypographyLarge>
      );
    case "small":
      return (
        <TypographySmall className={className}>{children}</TypographySmall>
      );
    case "muted":
      return (
        <TypographyMuted className={className}>{children}</TypographyMuted>
      );
    case "p":
    default:
      return <TypographyP className={className}>{children}</TypographyP>;
  }
};

export const TypographyH1 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
    >
      {children}
    </h1>
  );
};

export const TypographyH2 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={cn(
        "scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
    >
      {children}
    </h2>
  );
};

export const TypographyH3 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const TypographyH4 = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h4>
  );
};

export const TypographyP = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
      {children}
    </p>
  );
};

export const TypographyBlockquote = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  );
};

export const TypographyList = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>
  );
};

export const TypographyInlineCode = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
    >
      {children}
    </code>
  );
};

export const TypographyLead = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <p className="text-xl text-muted-foreground">{children}</p>;
};

export const TypographyLarge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
};

export const TypographySmall = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <small className={cn("text-sm font-medium leading-none", className)}>
      {children}
    </small>
  );
};

export const TypographyMuted = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
};
