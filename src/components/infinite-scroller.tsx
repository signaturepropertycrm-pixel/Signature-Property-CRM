
'use client';

import { cn } from "@/lib/utils";

const logos = [
    'Zameen.com', 'Graana.com', 'Agency21', 'Sky Marketing', 'Park View City', 'JagahOnline.com', 'Homes.com.pk'
];

export function InfiniteScroller() {
    const allLogos = [...logos, ...logos]; // Duplicate for seamless loop

    return (
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div className="animate-infinite-scroll flex w-max">
                {allLogos.map((logo, index) => (
                    <div key={index} className="flex items-center justify-center w-64 mx-4">
                        <span className="text-xl font-bold text-muted-foreground/80 tracking-wider">
                           {logo}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
