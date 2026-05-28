import React from 'react';

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        style={{ animation: 'rotate 2s linear infinite' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
          transform="rotate(-90 25 25)"
          style={{ strokeDashoffset: 0, animation: 'dash 1.5s ease-in-out infinite' }}
        />
        <style>
          {`
            @keyframes rotate {
              100% { transform: rotate(360deg); }
            }
            @keyframes dash {
              0% {
                stroke-dashoffset: 31.4;
              }
              50% {
                stroke-dashoffset: 15.7;
                transform: rotate(45deg);
              }
              100% {
                stroke-dashoffset: 31.4;
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </svg>
    </div>
  );
}