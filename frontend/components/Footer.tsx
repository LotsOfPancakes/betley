import Image from 'next/image'

export function Footer() {
    return (
        <footer className="bg-gray-950/80 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <a 
                href="https://app.hyperliquid.xyz/trade/PLSNODUMP"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium px-6 py-3 rounded-2xl hover:from-teal-300 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-105 transform"
                >
                <span>Support me by trading on HyperLiquid</span>
                    <div className="bg-white/15 p-0.5 rounded-full">
                        <Image 
                        src="/images/hl-blob.gif" 
                        alt="Animated HL icon"
                        width={12}
                        height={12}
                        className="w-5 h-5"
                        unoptimized={true}
                        loading="lazy"  // Only load when footer comes into view
                        />
                    </div>
                </a>
                <p className="text-gray-300 text-sm mt-2">Use my ref for a 4% Fee Discount!</p>
                <br />
                <p className="text-gray-400 text-sm mt-2">By <span className="hover:text-green-400 transition-colors"><a href="https://x.com/Jin_8315">@Jin</a></span></p>
            </div>
        </footer>
    )
}