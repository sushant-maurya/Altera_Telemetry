import companyGif from '../assets/altera-logo.gif';
import companyBg from '../assets/altera-bg.svg';

export default function Header() {
  return (
    <header className="h-[8vh] w-full relative">
      {/* Background SVG filling header */}
      <img
        src={companyBg}
        alt="Background"
        className="absolute top-0 left-0 h-full w-full object-cover"
      />

      {/* GIF pinned in top-left corner */}
      <img
        src={companyGif}
        alt="Company Logo"
        className="absolute top-0 left-0 h-full w-auto object-contain"
      />

      {/* Overlay container */}
      <div className="relative flex items-center justify-between h-full px-6">
        {/* Center: Title */}
        <h1 className="text-white font-bold text-2xl md:text-3xl mx-auto">
          ALTERA TELEMETRY
        </h1>

        {/* Right: Logged-in user */}
        <div className="flex items-center space-x-2 text-white font-medium">
          <span>Hello,</span>
          <span className="font-bold">sushant</span>
        </div>
      </div>
    </header>
  );
}
