import React, { useState } from 'react';
import FloatingLabelInput, { SelectOption } from './FloatingLabelInput';

export default function FloatingLabelExamples() {
  const [salePrice, setSalePrice] = useState<string>('');
  const [salePriceWithSymbol, setSalePriceWithSymbol] = useState<string>('150.00');
  const [city, setCity] = useState<string | number>('');

  const cityOptions: SelectOption[] = [
    { value: '1', label: 'Alabama' },
    { value: '2', label: 'Boston' },
    { value: '3', label: 'Ohio' },
    { value: '4', label: 'New York' },
    { value: '5', label: 'Washington' },
  ];

  return (
    <>
      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f4f7f6;
        }
        .container {
          width: 100%;
          max-width: 400px;
          padding: 20px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div className="container">
        <h2 style={{ textAlign: 'center', color: '#1e4c82', marginBottom: '24px' }}>
          Floating Label Form
        </h2>

        <FloatingLabelInput
          label="Sale Price"
          type="text"
          value={salePrice}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalePrice(e.target.value)}
        />

        <FloatingLabelInput
          label="Sale Price with $ symbol"
          type="text"
          prefix="$"
          value={salePriceWithSymbol}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalePriceWithSymbol(e.target.value)}
        />

        <FloatingLabelInput
          label="Select"
          type="select"
          options={cityOptions}
          value={city}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCity(e.target.value)}
        />
      </div>
    </>
  );
}
