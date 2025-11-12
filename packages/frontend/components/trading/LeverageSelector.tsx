"use client";

import { useState } from "react";
import { TRADING_CONFIG } from "@/lib/config/contracts";

interface LeverageSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function LeverageSelector({ value, onChange }: LeverageSelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const presetLeverages = [1, 2, 5, 10];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= TRADING_CONFIG.MIN_LEVERAGE && numValue <= TRADING_CONFIG.MAX_LEVERAGE) {
      onChange(numValue);
    }
  };

  const handlePresetClick = (preset: number) => {
    onChange(preset);
    setInputValue(preset.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Leverage</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            min={TRADING_CONFIG.MIN_LEVERAGE}
            max={TRADING_CONFIG.MAX_LEVERAGE}
            className="w-16 px-2 py-1 text-right bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">x</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={TRADING_CONFIG.MIN_LEVERAGE}
        max={TRADING_CONFIG.MAX_LEVERAGE}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((value - TRADING_CONFIG.MIN_LEVERAGE) / (TRADING_CONFIG.MAX_LEVERAGE - TRADING_CONFIG.MIN_LEVERAGE)) * 100}%, rgb(55, 65, 81) ${((value - TRADING_CONFIG.MIN_LEVERAGE) / (TRADING_CONFIG.MAX_LEVERAGE - TRADING_CONFIG.MIN_LEVERAGE)) * 100}%, rgb(55, 65, 81) 100%)`
        }}
      />

      {/* Preset Buttons */}
      <div className="flex space-x-2">
        {presetLeverages.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              value === preset
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {preset}x
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Initial Margin:</span>
          <span className="text-white">{TRADING_CONFIG.INITIAL_MARGIN_BPS / 100}%</span>
        </div>
        <div className="flex justify-between">
          <span>Maintenance Margin:</span>
          <span className="text-white">{TRADING_CONFIG.MAINTENANCE_MARGIN_BPS / 100}%</span>
        </div>
      </div>
    </div>
  );
}
