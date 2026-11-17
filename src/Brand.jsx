import { CarFront } from 'lucide-react';

export default function Brand({ href = '#top' }) {
  return (
    <a className="brand" href={href} aria-label="Velo, trang chủ">
      <span className="brand-mark"><CarFront size={20} strokeWidth={2.25} aria-hidden="true" /></span>
      <span>velo<span className="brand-dot">.</span></span>
    </a>
  );
}
