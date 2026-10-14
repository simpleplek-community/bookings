"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRightIcon, ClockIcon, MoonIcon, PackageIcon, PlusIcon, SparklesIcon } from "lucide-react"
import { formatZar, rateLabel, resolveBookingType, type Property, type PropertyPackage } from "@/lib/types"

interface PropertyCardProps {
    property: Property
    packages: PropertyPackage[]
    onOpenPackages: () => void
}

export function PropertyCard({ property, packages, onOpenPackages }: PropertyCardProps) {
    const bookingType = resolveBookingType(property)
    const isHourly = bookingType === "hourly"
    const proCount = packages.filter((p) => p.isPro || p.category === "pro").length
    const standardCount = packages.filter((p) => p.category === "standard" || (!p.category && !p.isPro)).length
    const addonCount = packages.filter((p) => p.category === "addon" || p.category === "hosted" || p.category === "special").length
    const hasPackages = packages.length > 0

    return (
        <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
                {property.images?.[0] ? (
                    <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.title || property.name || ""}
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                        No image
                    </div>
                )}

                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <Badge variant="default" className="gap-1.5 rounded-full bg-foreground/75 px-2.5 py-1 text-[10px] tracking-wider uppercase text-background backdrop-blur-sm hover:bg-foreground/75">
                        {isHourly ? <ClockIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
                        {isHourly ? "Hourly slots" : "Nightly stay"}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                        {property.isPro && (
                            <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-1 text-[10px] tracking-wider uppercase shadow-xs">
                                <SparklesIcon aria-hidden="true" />
                                Pro Only
                            </Badge>
                        )}
                        {!property.bookingType && (
                            <span
                                className="rounded-full bg-background/85 px-2 py-1 text-[10px] font-bold tracking-wide uppercase text-muted-foreground backdrop-blur-sm"
                                title="This record has no bookingType field — defaulting to nightly."
                            >
                                Inferred
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <CardHeader className="flex-1 gap-3 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <CardTitle className="text-pretty text-base leading-snug">{property.title || property.name}</CardTitle>
                        <p className="mt-0.5 text-xs font-semibold text-primary">
                            {property.location || <span className="text-muted-foreground">No location set</span>}
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                            {rateLabel(property)}
                        </p>
                        <p className="text-lg leading-tight font-bold text-foreground">{formatZar(property.basePricePerNight)}</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-5 pt-0">
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {property.description || "No description yet."}
                </p>

                {isHourly && property.slots && property.slots.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {property.slots.map((slot) => (
                            <Badge key={slot} variant="secondary" className="font-mono text-[10px]">
                                {slot}
                            </Badge>
                        ))}
                    </div>
                )}

                </CardContent>

                <CardFooter className="mt-auto flex-col items-stretch gap-3 border-t border-border px-5 pb-5 pt-4">
                    <div className="flex items-center justify-between gap-3">
                    <Button
                        variant={hasPackages ? "secondary" : "outline"}
                        size="sm"
                        onClick={onOpenPackages}
                        className="font-semibold"
                    >
                        {hasPackages ? (
                            <>
                                <PackageIcon data-icon="inline-start" aria-hidden="true" />
                                {packages.length} package{packages.length === 1 ? "" : "s"}
                            </>
                        ) : (
                            <>
                                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                                Add packages
                            </>
                        )}
                    </Button>

                    {hasPackages && (
                        <p className="text-[11px] font-medium text-muted-foreground">
                            {standardCount} std{proCount > 0 ? ` · ${proCount} pro` : ""} · {addonCount} add-on
                        </p>
                    )}
                    </div>

                    <Link
          href={`/admin/properties/${property.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-mb-1 justify-start px-0 text-xs font-bold tracking-wide uppercase text-muted-foreground hover:bg-transparent hover:text-primary",
          })}
        >
          Configure
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                    </Link>
                </CardFooter>
            </Card>
    )
}
