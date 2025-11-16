// Mock data for wearable devices - All available for pairing by default

// No connected devices initially
export const mockDevices = [];

// Available devices for pairing (6 devices: 2 watches, 2 rings, 2 weighing scales)
export const availableDevices = [
  // Smart Watches
  {
    id: 1,
    name: "Smart Watch Pro",
    model: "SW-PRO-2024",
    brand: "TechFit",
    deviceType: "watch",
    image: "/src/assets/images/watch.png",
    connectionStatus: "available",
    signalStrength: -45,
    color: "Black",
    batteryLevel: null,
    features: ["Heart Rate", "GPS", "Sleep Tracking", "Blood Oxygen"]
  },
  {
    id: 2,
    name: "Sport Watch Elite",
    model: "SW-ELITE-2024",
    brand: "ActiveGear",
    deviceType: "watch",
    image: "/src/assets/images/watch.png",
    connectionStatus: "available",
    signalStrength: -62,
    color: "Blue",
    batteryLevel: null,
    features: ["Heart Rate", "Step Counter", "Water Resistant", "Notifications"]
  },

  // Smart Rings
  {
    id: 3,
    name: "Health Ring Ultra",
    model: "HR-ULTRA-2024",
    brand: "RingTech",
    deviceType: "ring",
    image: "/src/assets/images/ring.webp",
    connectionStatus: "available",
    signalStrength: -55,
    color: "Silver",
    batteryLevel: null,
    features: ["Heart Rate", "HRV", "Temperature", "Sleep Stages"]
  },
  {
    id: 4,
    name: "Wellness Ring Pro",
    model: "WR-PRO-2025",
    brand: "WellnessHub",
    deviceType: "ring",
    image: "/src/assets/images/ring.webp",
    connectionStatus: "available",
    signalStrength: -48,
    color: "Rose Gold",
    batteryLevel: null,
    features: ["SpO2", "Activity Tracking", "Stress Monitor", "7-Day Battery"]
  },

  // Weighing Scales
  {
    id: 5,
    name: "Smart Scale Plus",
    model: "SS-PLUS-2024",
    brand: "HealthMetrics",
    deviceType: "scale",
    image: "/src/assets/images/weighing-scale.avif",
    connectionStatus: "available",
    signalStrength: -70,
    color: "White",
    batteryLevel: null,
    features: ["Weight", "BMI", "Body Fat", "Muscle Mass"]
  },
  {
    id: 6,
    name: "Body Composition Scale",
    model: "BCS-2024",
    brand: "FitMetrics",
    deviceType: "scale",
    image: "/src/assets/images/weighing-scale.avif",
    connectionStatus: "available",
    signalStrength: -58,
    color: "Black",
    batteryLevel: null,
    features: ["Weight", "Body Fat %", "Water %", "Bone Mass"]
  }
];

// Helper function to get signal strength text
export const getSignalStrengthText = (rssi) => {
  if (rssi >= -50) return "Excellent";
  if (rssi >= -60) return "Good";
  if (rssi >= -70) return "Fair";
  if (rssi >= -80) return "Weak";
  return "Very Weak";
};

// Helper function to get signal strength color
export const getSignalStrengthColor = (rssi) => {
  if (rssi >= -50) return "#4CAF50";
  if (rssi >= -60) return "#8BC34A";
  if (rssi >= -70) return "#FF9800";
  if (rssi >= -80) return "#F44336";
  return "#9E9E9E";
};

// Helper function to get signal bars (0-4)
export const getSignalBars = (rssi) => {
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -80) return 1;
  return 0;
};

// Battery status helper functions (for connected devices)
export const getBatteryIcon = (level) => {
  if (level >= 80) return "🔋";
  if (level >= 50) return "🔋";
  if (level >= 20) return "🪫";
  return "🪫";
};

export const getBatteryColor = (level) => {
  if (level >= 50) return "#4CAF50";
  if (level >= 20) return "#FF9800";
  return "#F44336";
};

export const getConnectionStatusColor = (status) => {
  if (status === "connected") return "#4CAF50";
  if (status === "available") return "#2196F3";
  return "#999999";
};

// Get device type icon
export const getDeviceTypeIcon = (type) => {
  switch(type) {
    case "watch": return "⌚";
    case "ring": return "💍";
    case "scale": return "⚖️";
    default: return "📱";
  }
};

// Export default object with all mock data
export default {
  devices: mockDevices,
  availableDevices,
  helpers: {
    getBatteryIcon,
    getBatteryColor,
    getConnectionStatusColor,
    getSignalStrengthText,
    getSignalStrengthColor,
    getSignalBars,
    getDeviceTypeIcon
  }
};
