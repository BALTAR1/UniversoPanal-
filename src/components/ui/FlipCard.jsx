
import React from 'react';


const Card = ({ frontTitle, backTitle, backItems, size = "md", buttonLabel, buttonHref, buttonColor }) => {
  let sizeClasses = "w-[320px] h-[420px]";
  if (size === "xl") sizeClasses = "w-[420px] h-[560px]";
  else if (size === "lg") sizeClasses = "w-[370px] h-[480px]";
  else if (size === "md") sizeClasses = "w-[320px] h-[420px]";
  return (
    <div className={`[perspective:1000px] ${sizeClasses} font-sans`}>
      <div className="relative w-full h-full text-center transition-transform duration-700 [transform-style:preserve-3d] group hover:[transform:rotateY(180deg)]">
        {/* Front */}
        <div className="absolute flex flex-col justify-center items-center w-full h-full rounded-3xl border-2 border-[#5ec6fa] shadow-xl bg-gradient-to-br from-[#b9e3fe] via-white to-[#eaf6fd] text-[#1a4e89] [backface-visibility:hidden]">
          <p className="text-3xl font-black mb-4">{frontTitle}</p>
          <p className="font-semibold text-lg">Ver detalles</p>
        </div>
        {/* Back */}
        <div className="absolute flex flex-col justify-center items-center w-full h-full rounded-3xl border-2 border-[#5ec6fa] shadow-xl bg-gradient-to-br from-[#5ec6fa] via-[#b9e3fe] to-[#eaf6fd] text-[#1a4e89] [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-2xl font-black mb-4">{backTitle}</p>
          <ul className="list-disc text-left mx-auto pl-6 max-w-[85%] text-2xl font-bold">
            {Array.isArray(backItems) && backItems.map((item, idx) => (
              <li key={idx} className="mb-3">{item}</li>
            ))}
          </ul>
          {buttonLabel && buttonHref && (
            <div className="mt-8">
              <a href={buttonHref} className={`inline-block px-8 py-3 rounded-full font-bold text-lg shadow transition ${buttonColor === 'blue' ? 'bg-[#1a4e89] text-white hover:bg-[#2563eb]' : 'bg-[#5ec6fa] text-[#1a4e89] hover:bg-[#38bdf8]'}`}>{buttonLabel}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;
