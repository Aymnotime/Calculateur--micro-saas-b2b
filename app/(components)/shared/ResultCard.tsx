"use client";

import React from 'react';

export interface ResultCardProps {
  titre: string;
  valeur: string;
  description?: string;
  couleur?: 'green' | 'red';
}

export default function ResultCard({ titre, valeur, description, couleur }: ResultCardProps) {
  const bg = couleur === 'green' ? 'bg-green-100' : couleur === 'red' ? 'bg-red-100' : 'bg-white';
  const ring = couleur === 'green' ? 'ring-green-400' : couleur === 'red' ? 'ring-red-400' : 'ring-gray-200';

  return (
    <div className={`${bg} ring-1 ${ring} rounded-xl p-4`}
      role={description ? 'note' : undefined}
      aria-label={description ? description : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-700">{titre}</h3>
        {description ? (
          <span className="text-gray-400" title={description} aria-label={description}>
            {/* Icône info grise, SVG */}
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
              <rect x="9" y="8" width="2" height="5" rx="1" fill="currentColor" />
              <rect x="9" y="5" width="2" height="2" rx="1" fill="currentColor" />
            </svg>
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{valeur}</div>
    </div>
  );
}
