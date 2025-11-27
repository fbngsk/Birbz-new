import React from 'react';

// Base skeleton with shimmer animation
const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

// Bird card skeleton
export const BirdCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
            <SkeletonBase className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-4 w-3/4 rounded" />
                <SkeletonBase className="h-3 w-1/2 rounded" />
            </div>
            <SkeletonBase className="w-12 h-6 rounded-full" />
        </div>
    </div>
);

// Leaderboard entry skeleton
export const LeaderboardSkeleton: React.FC = () => (
    <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <SkeletonBase className="w-8 h-8 rounded-full" />
                <SkeletonBase className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="h-4 w-1/3 rounded" />
                    <SkeletonBase className="h-3 w-1/4 rounded" />
                </div>
                <SkeletonBase className="w-16 h-6 rounded-full" />
            </div>
        ))}
    </div>
);

// Daily horoscope skeleton
export const HoroscopeSkeleton: React.FC = () => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4">
            <SkeletonBase className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-3">
                <SkeletonBase className="h-5 w-1/2 rounded" />
                <SkeletonBase className="h-3 w-full rounded" />
                <SkeletonBase className="h-3 w-3/4 rounded" />
            </div>
        </div>
    </div>
);

// Grid of bird cards skeleton (for Dex view)
export const BirdGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
    <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <SkeletonBase className="w-full aspect-square" />
                <div className="p-3 space-y-2">
                    <SkeletonBase className="h-4 w-3/4 rounded" />
                    <SkeletonBase className="h-3 w-1/2 rounded" />
                </div>
            </div>
        ))}
    </div>
);

// Profile stats skeleton
export const ProfileStatsSkeleton: React.FC = () => (
    <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex gap-4">
                <div className="flex-1 bg-white rounded-lg p-3">
                    <SkeletonBase className="h-8 w-12 mx-auto rounded" />
                    <SkeletonBase className="h-2 w-16 mx-auto mt-2 rounded" />
                </div>
                <div className="flex-1 bg-white rounded-lg p-3">
                    <SkeletonBase className="h-8 w-12 mx-auto rounded" />
                    <SkeletonBase className="h-2 w-16 mx-auto mt-2 rounded" />
                </div>
            </div>
        </div>
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <SkeletonBase className="w-6 h-6 rounded" />
                    <SkeletonBase className="h-4 flex-1 rounded" />
                    <SkeletonBase className="w-8 h-5 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

// Image loading skeleton with bird icon
export const ImageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-gray-300 text-4xl">🐦</div>
    </div>
);

export { SkeletonBase };
