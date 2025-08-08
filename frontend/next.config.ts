import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress CSS preload warnings in development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

};

export default nextConfig;
