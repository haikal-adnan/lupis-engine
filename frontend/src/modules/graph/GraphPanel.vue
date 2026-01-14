<template>
    <div class="h-full w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#64748b 1px, transparent 1px); background-size: 20px 20px;"></div>
        
        <div class="absolute top-1/3 left-1/4 w-32 bg-slate-800 border border-slate-600 rounded shadow-xl p-0 overflow-hidden">
        <div class="bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white uppercase">Start</div>
        <div class="p-2 text-xs text-slate-300">On Trigger</div>
        </div>

        <div class="absolute top-1/2 left-1/2 w-40 bg-slate-800 border border-slate-600 rounded shadow-xl p-0 overflow-hidden transform -translate-x-1/2 -translate-y-1/2">
        <div class="bg-blue-600 px-2 py-1 text-[10px] font-bold text-white uppercase">Condition</div>
        <div class="p-2 text-xs text-slate-300">Is Player Near?</div>
        </div>
        
        <svg class="absolute inset-0 pointer-events-none">
            <line x1="28%" y1="36%" x2="50%" y2="50%" stroke="#475569" stroke-width="2" />
        </svg>
    </div>
</template>