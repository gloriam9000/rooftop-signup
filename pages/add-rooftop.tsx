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
    monthlyGeneration: '',
    appProvider: null as SingleValue<OptionType>,
    apiKey: '',
    systemId: '',
  });

  const countryOptions = countryList().getData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
    } else {
      console.log('Rooftop submitted:', formData);
      router.push('/');
    }
  };

  const handleConnect = () => {
    // Simulate OAuth connection
    console.log('Connecting to', formData.appProvider?.label);
    alert(`Connecting to ${formData.appProvider?.label}...`);
    router.push('/');
  };

  // OAuth providers that support direct connection
  const oauthProviders = ['enphase', 'solaredge', 'tesla', 'sunpower'];
  const isOAuthProvider = formData.appProvider && oauthProviders.includes(formData.appProvider.value);

  const canProceedToStep5 = formData.appProvider !== null;

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

          {step === 4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which app do you use to track your solar production?
              </label>
              <Select
                options={[
                  { value: 'enphase', label: 'Enphase Enlighten' },
                  { value: 'solaredge', label: 'SolarEdge Monitoring' },
                  { value: 'sma', label: 'SMA Sunny Portal' },
                  { value: 'tesla', label: 'Tesla Solar App' },
                  { value: 'sunpower', label: 'SunPower Monitoring' },
                  { value: 'other', label: 'Other / Not Listed' },
                ]}
                value={formData.appProvider}
                onChange={(selected) => setFormData(prev => ({ ...prev, appProvider: selected }))}
                placeholder="Select your app"
                isSearchable
              />
              <p className="text-xs text-gray-600 mt-2">
                Can&apos;t find your app? We&apos;re constantly onboarding more systems. Please check back soon or 
                <a href="mailto:support@solarwise.vet" className="text-blue-600 underline"> suggest one via email</a>.
              </p>
            </div>
          )}

          {step === 5 && (
            <div>
              {isOAuthProvider ? (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Connect to {formData.appProvider?.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    We&apos;ll securely connect to your {formData.appProvider?.label} account to track your solar production automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect to {formData.appProvider?.label}
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Connect Your System
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide your API credentials to connect your solar monitoring system.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="text"
                        name="apiKey"
                        value={formData.apiKey}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded-lg"
                        placeholder="Enter your API key"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System ID
                      </label>
                      <input
                        type="text"
                        name="systemId"
                        value={formData.systemId}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded-lg"
                        placeholder="Enter your system ID"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Need help finding these credentials? Check your app&apos;s settings or 
                    <a href="mailto:support@solarwise.vet" className="text-blue-600 underline"> contact our support team</a>.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={step === 4 && !canProceedToStep5}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              step === 4 && !canProceedToStep5
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : step === 5 && isOAuthProvider
                ? 'hidden' // Hide submit button when OAuth connect button is shown
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            {step < 4 ? 'Next' : step === 4 ? 'Next' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
