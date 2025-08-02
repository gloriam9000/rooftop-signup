import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Select, { SingleValue } from 'react-select';
import countryList from 'react-select-country-list';

interface OptionType {
  value: string;
  label: string;
}

export default function AddRooftop() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    country: null as SingleValue<OptionType>,
    systemSize: '',
    installDate: '',
    monthlyGeneration: '',
  });

  const countryOptions = countryList().getData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      console.log('Rooftop submitted:', formData);
      router.push('/');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (selected: SingleValue<OptionType>) => {
    setFormData(prev => ({ ...prev, country: selected }));
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 🔁 Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/out/homeownervideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* 🌓 Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80 z-10" />

      {/* 📋 Signup Form */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full space-y-6"
        >
<h2 className="text-2xl font-bold text-center text-gray-900">Connect Your Rooftop</h2>
<p className="text-center text-sm text-gray-700 mt-1">
  Earn B3TR rewards for every kilowatt-hour your rooftop solar panels produce.
</p>
          {/* Multi-step form for rooftop registration */}

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <Select
                options={countryOptions}
                value={formData.country}
                onChange={handleCountryChange}
                placeholder="Select your country"
                isSearchable
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Size (kWp)</label>
                <input
                  type="number"
                  name="systemSize"
                  value={formData.systemSize}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                  placeholder="e.g., 8.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installation Date</label>
                <input
                  type="date"
                  name="installDate"
                  value={formData.installDate}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Generation (kWh)</label>
              <input
                type="number"
                name="monthlyGeneration"
                value={formData.monthlyGeneration}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg"
                placeholder="e.g., 950"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            {step < 3 ? 'Next' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
