import type { ReadingSource, ReadingStatus } from '../../types';
import { READING_SOURCE_BADGE, READING_STATUS_BADGE } from '../../constants/statusConfig';

export function ReadingStatusBadge({
  status,
  className,
}: {
  status: ReadingStatus;
  className?: string;
}) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${READING_STATUS_BADGE[status]} ${className ?? ''}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function ReadingSourceBadge({
  source,
  className,
}: {
  source: ReadingSource;
  className?: string;
}) {
  const label = source === 'AI_EXTRACTED' ? 'AI' : source === 'MANUAL' ? 'Manual' : 'Corrected';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${READING_SOURCE_BADGE[source]} ${className ?? ''}`}>
      {label}
    </span>
  );
}

