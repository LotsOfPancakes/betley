import Image from 'next/image'

export function Footer() {
    return (
        <footer className="bg-gray-900 py-8"> {/* temp remove border-t border-gray-800*/}
            <div className="max-w-7xl mx-auto px-4 text-center">
                <a 
                href="https://app.hyperliquid.xyz/trade/PLSNODUMP"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium px-6 py-3 rounded-xl hover:from-teal-300 hover:to-cyan-300 transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-102 transform"
                >
                <span>Support me by trading on HyperLiquid</span>
                    <div className="bg-black/15 p-0.5 rounded-full">
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
                <p className="text-gray-200 text-sm mt-2">Use my ref for a 4% Fee Discount!</p>
                <br></br>
                <p className="text-green-200 text-s mt-2">By <span className ="hover:text-green-300 transition-colors"><a href="https://x.com/Jin_8315">@Jin</a></span></p>

            </div>
        </footer>
    )
}