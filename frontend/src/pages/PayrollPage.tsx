import React, { useState } from 'react';
import PayrunsList from './PayrunsList';
import SalaryRules from './SalaryRules';
import SalaryStructures from './SalaryStructures';
import { Wallet, Briefcase, Layers } from 'lucide-react';

export default function PayrollPage() {
    const [activeTab, setActiveTab] = useState<'payruns' | 'rules' | 'structures'>('payruns');

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Top Sub-navigation Bar */}
            <div className="bg-white border-b border-gray-200/80 px-6 md:px-8 py-3 sticky top-0 z-20 shadow-xs">
                <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('payruns')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeTab === 'payruns'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Wallet className="w-4 h-4" /> Payruns Batch Center
                        </button>

                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeTab === 'rules'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Briefcase className="w-4 h-4" /> Salary Rules
                        </button>

                        <button
                            onClick={() => setActiveTab('structures')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeTab === 'structures'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Layers className="w-4 h-4" /> Salary Structures
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Tab View */}
            <div>
                {activeTab === 'payruns' && <PayrunsList />}
                {activeTab === 'rules' && <SalaryRules />}
                {activeTab === 'structures' && <SalaryStructures />}
            </div>
        </div>
    );
}
