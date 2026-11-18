import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function CarImage({ car }) {
  const [failed, setFailed] = useState(false);
  const source = car.img || car.IMG;
  if (!source || failed) {
    return (
      <span className="rental-image-missing">
        <ImageOff size={24} aria-hidden="true" />
        {car.brand || car.Brand}
      </span>
    );
  }
  return <img src={source} alt={car.productName} loading="lazy" onError={() => setFailed(true)} />;
}
