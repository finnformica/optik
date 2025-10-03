import { Logo } from "@/components/global/logo";

export function Footer() {
  const quickLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  const supportLinks = [
    { href: "/help", label: "Help Centre" },
    { href: "/docs", label: "Documentation" },
  ];

  return (
    <footer className="border-border bg-card/50 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Logo size="sm" showText className="text-xl font-bold" />
            <p className="text-muted-foreground">Track smarter, trade better</p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <div className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Support links */}
          {/* <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <div className="space-y-2 text-sm">
              {supportLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground block transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div> */}
        </div>

        <div className="border-border text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          © {new Date().getFullYear()} Optik. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
