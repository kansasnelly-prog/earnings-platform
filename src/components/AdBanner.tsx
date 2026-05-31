import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && adRef.current.children.length === 0) {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : '5b6088cc5e954c3cf7b7f168f04ed4bf',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      adRef.current.appendChild(configScript);

      const loadScript = document.createElement('script');
      loadScript.type = 'text/javascript';
      loadScript.src = '//://highperformanceformat.com';
      adRef.current.appendChild(loadScript);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center my-6 py-3 bg-slate-900/20 rounded-xl border border-slate-800/60 shadow-lg backdrop-blur-sm">
      <div ref={adRef} className="min-h-[90px] min-w-[728px] overflow-hidden rounded" />
    </div>
  );
}
