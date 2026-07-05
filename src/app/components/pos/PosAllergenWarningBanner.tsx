export interface PosAllergenWarningBannerProps {
  matchingAllergenNames: string[];
}

export function PosAllergenWarningBanner({ matchingAllergenNames }: PosAllergenWarningBannerProps) {
  if (matchingAllergenNames.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-orange-300 bg-orange-50 px-3 py-2">
      <p className="text-xs font-medium text-orange-800">
        Contains: {matchingAllergenNames.join(', ')}
      </p>
    </div>
  );
}
