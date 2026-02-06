'use client';

export function GlobalNoise() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03]">
            <svg className="h-full w-full">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.85"
                        numOctaves="1"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
}
