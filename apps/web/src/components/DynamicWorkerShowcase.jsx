import React from 'react';
import FindWorkersView from './FindWorkersView';

export default function DynamicWorkerShowcase({
  workers = [],
  onSelectWorker,
  onBookWorker,
  onFindWorker,
  onOpenCallbot,
  selectedPincode = '462011'
}) {
  return (
    <div style={{ padding: '24px 0 48px', backgroundColor: 'var(--bg-main)' }}>
      <FindWorkersView
        workers={workers}
        selectedService="Electrician"
        selectedLocation={`Govindpura, Bihar (${selectedPincode})`}
        onBack={onFindWorker}
        onSelectWorker={onSelectWorker}
        onBookWorker={onBookWorker}
      />
    </div>
  );
}
