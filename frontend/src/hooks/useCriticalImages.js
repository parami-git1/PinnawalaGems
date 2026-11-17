import { useEffect, useState } from 'react';

export function useCriticalImages(urls) {
  const key = [...new Set(urls.filter(Boolean))].join('\n');
  const [result, setResult] = useState({ key: '', ready: false });
  useEffect(() => {
    let active = true;
    const cleanup = [];
    const jobs = key.split('\n').filter(Boolean).map((src) => new Promise((resolve) => {
      const image = new Image();
      let complete = false;
      const finish = () => { if (complete) return; complete = true; clearTimeout(timeout); resolve(); };
      const timeout = setTimeout(finish, 6500);
      image.onload = () => { if (image.decode) image.decode().catch(() => {}).then(finish); else finish(); };
      image.onerror = finish;
      image.src = src;
      cleanup.push(() => { image.onload = null; image.onerror = null; finish(); });
    }));
    Promise.all(jobs).then(() => { if (active) setResult({ key, ready: true }); });
    return () => { active = false; cleanup.forEach((cancel) => cancel()); };
  }, [key]);
  return result.key === key && result.ready;
}
