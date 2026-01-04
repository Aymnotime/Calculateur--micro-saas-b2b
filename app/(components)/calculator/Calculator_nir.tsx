"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  CalculatorIcon, 
  DocumentDuplicateIcon, 
  ShieldCheckIcon, 
  InformationCircleIcon, 
  XMarkIcon, 
  ChevronDownIcon, 
  MapPinIcon, 
  CalendarIcon, 
  UserIcon, 
  KeyIcon,
  BuildingLibraryIcon,
  LockClosedIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolid, 
  ExclamationTriangleIcon as ExclamationTriangleSolid,
  ShieldCheckIcon as ShieldCheckSolid
} from '@heroicons/react/24/solid';

interface ValidationResult {
  isValid: boolean;
  message: string;
  details: string[];
  gender?: string;
  birthYear?: number;
  birthMonth?: number;
  birthDepartment?: string;
  birthCommune?: string;
  birthOrder?: number;
  calculatedKey?: number;
  isForeignBorn?: boolean;
  isTemporaryNumber?: boolean;
}

const VALID_EXAMPLES = [
  '1881275123456',
  '2910513987654', 
  '1051269345678',
];

const calculateNIRKey = (nir13Digits: string): number => {
  if (nir13Digits.length !== 13) return 0;
  const nirNumber = BigInt(nir13Digits);
  const remainder = Number(nirNumber % 97n);
  return 97 - remainder;
};

const validateSecurityNumber = (num: string): ValidationResult => {
  const cleanNum = num.replace(/\s/g, '');
  
  if (!cleanNum) {
    return {
      isValid: false,
      message: 'Veuillez saisir un numéro',
      details: ['Champ vide']
    };
  }
  
  if (cleanNum.length !== 13) {
    return {
      isValid: false,
      message: 'Format invalide',
      details: ['Le numéro doit contenir exactement 13 chiffres']
    };
  }
  
  if (!/^\d{13}$/.test(cleanNum)) {
    return {
      isValid: false,
      message: 'Format invalide',
      details: ['Seuls les chiffres sont autorisés']
    };
  }
  
  const genderCode = parseInt(cleanNum.charAt(0));
  const year = parseInt(cleanNum.substring(1, 3));
  const month = parseInt(cleanNum.substring(3, 5));
  const department = cleanNum.substring(5, 7);
  const commune = cleanNum.substring(7, 10);
  const birthOrder = parseInt(cleanNum.substring(10, 13));
  
  const details: string[] = [];
  let isValid = true;
  
  let genderText = '';
  let isForeignBorn = false;
  let isTemporaryNumber = false;
  
  switch (genderCode) {
    case 1:
      genderText = 'Homme';
      break;
    case 2:
      genderText = 'Femme';
      break;
    case 3:
      genderText = 'Homme né à l\'étranger';
      isForeignBorn = true;
      break;
    case 4:
      genderText = 'Femme née à l\'étranger';
      isForeignBorn = true;
      break;
    case 7:
      genderText = 'Homme (numéro temporaire)';
      isTemporaryNumber = true;
      break;
    case 8:
      genderText = 'Femme (numéro temporaire)';
      isTemporaryNumber = true;
      break;
    default:
      isValid = false;
      details.push('Code genre invalide (doit être 1, 2, 3, 4, 7 ou 8)');
  }
  
  const yearValid = year >= 0 && year <= 99;
  if (!yearValid) {
    isValid = false;
    details.push('Année de naissance invalide (doit être entre 00 et 99)');
  }
  
  const monthValid = month >= 1 && month <= 12;
  if (!monthValid) {
    isValid = false;
    details.push('Mois de naissance invalide (doit être entre 01 et 12)');
  }
  
  const deptNum = parseInt(department);
  const isCorsica = department === '2A' || department === '2B';
  const isMetropolitanDept = !isCorsica && deptNum >= 1 && deptNum <= 95;
  const isForeign = department === '99';
  const isOverseasDept = department.length === 2 && deptNum >= 97 && deptNum <= 99;
  const deptValid = isMetropolitanDept || isCorsica || isOverseasDept || isForeign;
  
  if (!deptValid) {
    isValid = false;
    details.push(`Département "${department}" invalide (01-95, 2A/B, 97-99, 99)`);
  }
  
  const communeNum = parseInt(commune);
  const communeValid = communeNum >= 1 && communeNum <= 999;
  
  if (!communeValid) {
    isValid = false;
    details.push('Code commune invalide (doit être entre 001 et 999)');
  }
  
  const birthOrderValid = birthOrder >= 1 && birthOrder <= 999;
  if (!birthOrderValid) {
    isValid = false;
    details.push('Numéro d\'ordre invalide (doit être entre 001 et 999)');
  }
  
  const calculatedKey = calculateNIRKey(cleanNum);
  
  const currentYear = new Date().getFullYear();
  const currentYearShort = currentYear % 100;
  let fullYear: number;
  
  if (year <= currentYearShort || year < 20) {
    fullYear = 2000 + year;
  } else {
    fullYear = 1900 + year;
  }
  
  if (isTemporaryNumber) {
    details.push('Numéro temporaire identifié (série 7 ou 8)');
  }
  
  if (isForeignBorn) {
    details.push('Né(e) à l\'étranger (série 3 ou 4)');
  }
  
  if (fullYear > currentYear) {
    details.push('Attention : année de naissance postérieure à l\'année en cours');
  }
  
  if (fullYear < 1900) {
    details.push('Attention : année de naissance antérieure à 1900');
  }
  
  return {
    isValid,
    message: isValid ? 'Numéro NIR valide' : 'Numéro NIR invalide',
    details,
    gender: genderText,
    birthYear: fullYear,
    birthMonth: month,
    birthDepartment: department,
    birthCommune: commune,
    birthOrder,
    calculatedKey,
    isForeignBorn,
    isTemporaryNumber
  };
};

const formatMonth = (month: number): string => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month - 1] || `Mois ${month}`;
};

const getDepartmentName = (code: string): string => {
  const departments: Record<string, string> = {
    '75': 'Paris', '13': 'Bouches-du-Rhône', '69': 'Rhône', '59': 'Nord',
    '33': 'Gironde', '31': 'Haute-Garonne', '44': 'Loire-Atlantique',
    '67': 'Bas-Rhin', '93': 'Seine-Saint-Denis', '92': 'Hauts-de-Seine',
    '06': 'Alpes-Maritimes', '34': 'Hérault', '76': 'Seine-Maritime',
    '35': 'Ille-et-Vilaine', '57': 'Moselle', '2A': 'Corse-du-Sud',
    '2B': 'Haute-Corse', '971': 'Guadeloupe', '972': 'Martinique',
    '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte',
    '99': 'Étranger'
  };
  
  return departments[code] || `Département ${code}`;
};

export default function SecurityNumberCalculator() {
  const [number, setNumber] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  const [isEnterpriseMode, setIsEnterpriseMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 13);
    
    let formatted = cleanValue;
    if (cleanValue.length > 10) {
      formatted = `${cleanValue.substring(0, 1)} ${cleanValue.substring(1, 3)} ${cleanValue.substring(3, 5)} ${cleanValue.substring(5, 7)} ${cleanValue.substring(7, 10)} ${cleanValue.substring(10, 13)}`;
    } else if (cleanValue.length > 7) {
      formatted = `${cleanValue.substring(0, 1)} ${cleanValue.substring(1, 3)} ${cleanValue.substring(3, 5)} ${cleanValue.substring(5, 7)} ${cleanValue.substring(7, 10)}`;
    } else if (cleanValue.length > 5) {
      formatted = `${cleanValue.substring(0, 1)} ${cleanValue.substring(1, 3)} ${cleanValue.substring(3, 5)} ${cleanValue.substring(5, 7)}`;
    } else if (cleanValue.length > 3) {
      formatted = `${cleanValue.substring(0, 1)} ${cleanValue.substring(1, 3)} ${cleanValue.substring(3, 5)}`;
    } else if (cleanValue.length > 1) {
      formatted = `${cleanValue.substring(0, 1)} ${cleanValue.substring(1, 3)}`;
    }
    
    setNumber(formatted);
    
    setIsCalculating(true);
    setTimeout(() => {
      if (cleanValue.length === 13) {
        const result = validateSecurityNumber(cleanValue);
        setValidation(result);
      } else if (cleanValue.length > 0) {
        setValidation({
          isValid: false,
          message: 'Numéro incomplet',
          details: ['Saisissez les 13 chiffres pour la validation complète']
        });
      } else {
        setValidation(null);
      }
      setIsCalculating(false);
    }, 150);
  };
  
  const generateExample = () => {
    const randomExample = VALID_EXAMPLES[Math.floor(Math.random() * VALID_EXAMPLES.length)];
    handleChange(randomExample);
  };
  
  const copyToClipboard = (fullNumber: boolean = false) => {
    const cleanNum = number.replace(/\s/g, '');
    if (cleanNum.length === 13 && validation?.calculatedKey) {
      const textToCopy = fullNumber 
        ? `${cleanNum}${validation.calculatedKey.toString().padStart(2, '0')}`
        : cleanNum;
      
      navigator.clipboard.writeText(textToCopy);
      
      if (fullNumber) {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };
  
  const clearField = () => {
    setNumber('');
    setValidation(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && number.replace(/\s/g, '').length === 13) {
      const cleanNum = number.replace(/\s/g, '');
      const result = validateSecurityNumber(cleanNum);
      setValidation(result);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0LjUxNWMwLTEuNDY4LjQ3Ni0yLjc4MyAxLjI2Ni0zLjk0OUE3Ljk1IDcuOTUgMCAwMDM0IDI0Yy0yLjIgMC00LjE1NS43NjctNS43MDcgMi4wMjlBNi45NSA2Ljk1IDAgMDAyNCAxOGE2IDYgMCAwMC02IDZjMCAxLjU4Ny41MjMgMy4wNCAxLjQwMyA0LjIxOUE4IDggMCAwMDEwIDM0YTggOCAwIDAwOCA4YTcuOTYgNy45NiAwIDAwNS42NTctMi40MjhBNi45NyA2Ljk3IDAgMDAzMCAzNGE2IDYgMCAwMDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheckSolid className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <SparklesIcon className="w-2 h-2 md:w-3 md:h-3 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-white">
                      Calculateur NIR Pro
                    </span>
                  </h1>
                  <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 mt-1">
                    <div className="flex items-center text-cyan-200 text-xs md:text-sm">
                      <LockClosedIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      <span>Validation sécurisée</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 bg-slate-500 rounded-full"></div>
                    <div className="text-slate-300 text-xs md:text-sm">Normes INSEE certifiées</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsEnterpriseMode(!isEnterpriseMode)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-all text-sm ${
                  isEnterpriseMode 
                    ? 'bg-white text-slate-900 shadow-lg' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isEnterpriseMode ? 'Pro' : 'Standard'}
              </button>
            </div>
            
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
              <div className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-full border border-cyan-500/30">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <CalculatorIcon className="w-3 h-3 md:w-4 md:h-4 text-cyan-300" />
                  <span className="text-xs md:text-sm text-white">Calcul automatique</span>
                </div>
              </div>
              
              <div className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <ShieldCheckIcon className="w-3 h-3 md:w-4 md:h-4 text-emerald-300" />
                  <span className="text-xs md:text-sm text-white">Conforme INSEE</span>
                </div>
              </div>
              
              <div className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-full border border-violet-500/30">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <BuildingLibraryIcon className="w-3 h-3 md:w-4 md:h-4 text-violet-300" />
                  <span className="text-xs md:text-sm text-white">Usage professionnel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          <div className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 border transition-all duration-300 ${
            isEnterpriseMode ? 'border-cyan-200 shadow-cyan-100/50' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                  isEnterpriseMode 
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200' 
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200'
                }`}>
                  <CalculatorIcon className={`w-4 h-4 md:w-5 md:h-5 ${
                    isEnterpriseMode ? 'text-cyan-600' : 'text-slate-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">Saisie du numéro</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">13 chiffres requis, notre outil calcule la clé</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowVisualGuide(!showVisualGuide)}
                className={`flex items-center space-x-2 px-3 py-1.5 md:px-3 md:py-2 rounded-lg transition-all text-sm ${
                  showVisualGuide
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <InformationCircleIcon className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-medium">Guide</span>
                <ChevronDownIcon className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showVisualGuide ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {showVisualGuide && (
              <div className="mb-6 md:mb-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 md:p-6 border border-slate-300">
                <div className="grid grid-cols-6 gap-2 md:gap-3 mb-4 md:mb-6">
                  {[
                    { label: 'Sexe', value: '1', color: 'bg-gradient-to-b from-cyan-500 to-cyan-600' },
                    { label: 'Année', value: '88', color: 'bg-gradient-to-b from-blue-500 to-blue-600' },
                    { label: 'Mois', value: '02', color: 'bg-gradient-to-b from-indigo-500 to-indigo-600' },
                    { label: 'Dépt', value: '75', color: 'bg-gradient-to-b from-violet-500 to-violet-600' },
                    { label: 'Commune', value: '123', color: 'bg-gradient-to-b from-purple-500 to-purple-600' },
                    { label: 'Ordre', value: '456', color: 'bg-gradient-to-b from-fuchsia-500 to-fuchsia-600' },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`${item.color} text-white text-xs md:text-sm font-bold py-2 md:py-3 rounded-t-lg md:rounded-t-xl`}>
                        {item.value}
                      </div>
                      <div className="bg-white text-slate-700 text-xs font-medium p-1 md:p-2 rounded-b-lg md:rounded-b-xl border border-slate-300">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-600">
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-lg flex items-center justify-center border border-cyan-200 flex-shrink-0">
                      <UserIcon className="w-2 h-2 md:w-3 md:h-3 text-cyan-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Sexe : </span>
                      1=Homme, 2=Femme, 3/4=Étranger, 7/8=Temporaire
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center border border-blue-200 flex-shrink-0">
                      <CalendarIcon className="w-2 h-2 md:w-3 md:h-3 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Année : </span>
                      2 derniers chiffres de l'année de naissance
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg flex items-center justify-center border border-violet-200 flex-shrink-0">
                      <MapPinIcon className="w-2 h-2 md:w-3 md:h-3 text-violet-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Département : </span>
                      01-95, 2A/B, 97-99, 99 pour l'étranger
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Numéro de sécurité sociale
                </label>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                  13 chiffres
                </span>
              </div>
              
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={number}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="1 88 02 75 123 456"
                  className={`
                    w-full px-4 md:px-5 py-3 md:py-4 text-base md:text-lg border-2 rounded-xl 
                    focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 
                    transition-all duration-300 font-mono placeholder-slate-400
                    ${validation?.isValid ? 'border-emerald-500 bg-gradient-to-r from-emerald-50/50 to-white' : 
                      validation && !validation.isValid ? 'border-red-500 bg-gradient-to-r from-red-50/50 to-white' : 
                      'border-slate-300 hover:border-slate-400'
                    }
                    ${isEnterpriseMode ? 'shadow-lg shadow-cyan-500/5' : ''}
                  `}
                  maxLength={18}
                />
                
                {number && (
                  <button
                    onClick={clearField}
                    className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Effacer"
                  >
                    <XMarkIcon className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 md:gap-3 mt-4 md:mt-6">
                <button
                  onClick={generateExample}
                  className="px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 rounded-lg md:rounded-xl font-medium hover:from-slate-200 hover:to-slate-100 transition-all duration-300 flex items-center space-x-2 border border-slate-300 hover:border-slate-400 text-sm"
                >
                  <CalculatorIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Exemple</span>
                </button>
                
                {number.replace(/\s/g, '').length === 13 && (
                  <button
                    onClick={() => copyToClipboard(false)}
                    className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${
                      isEnterpriseMode
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25'
                        : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900'
                    }`}
                  >
                    <DocumentDuplicateIcon className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{copied ? 'Copié !' : 'Copier 13 chiffres'}</span>
                  </button>
                )}
              </div>
            </div>
            
            {validation?.calculatedKey && (
              <div className={`rounded-xl p-4 md:p-6 border transition-all duration-300 ${
                isEnterpriseMode
                  ? 'bg-gradient-to-br from-cyan-50/50 to-blue-50/50 border-cyan-300'
                  : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-5">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                    isEnterpriseMode
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      : 'bg-gradient-to-br from-slate-900 to-slate-800'
                  }`}>
                    <KeyIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base md:text-lg">Clé de contrôle calculée</h3>
                    <p className="text-xs md:text-sm text-slate-500">Conforme aux normes INSEE</p>
                  </div>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-300 text-center">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500">Clé calculée</div>
                      <div className={`font-mono text-2xl md:text-4xl font-bold px-3 py-2 md:py-4 rounded border ${
                        isEnterpriseMode
                          ? 'text-cyan-700 bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-300'
                          : 'text-slate-900 bg-gradient-to-r from-slate-100 to-slate-200 border-slate-400'
                      }`}>
                        {validation.calculatedKey.toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200 flex-shrink-0">
                      <ShieldCheckIcon className="w-2 h-2 md:w-3 md:h-3 text-emerald-600" />
                    </div>
                    <span>Calcul : 97 - (NIR modulo 97) selon les normes officielles</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className={`rounded-2xl shadow-xl p-6 md:p-8 border transition-all duration-300 ${
            isEnterpriseMode 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
              : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center space-x-3 mb-6 md:mb-8">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                isEnterpriseMode
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  : 'bg-gradient-to-br from-slate-900 to-slate-800'
              }`}>
                {validation?.isValid ? (
                  <CheckCircleSolid className="w-4 h-4 md:w-5 md:h-5 text-white" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className={`text-lg md:text-xl font-bold ${
                  isEnterpriseMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Résultat de la validation
                </h2>
                <p className={`text-xs md:text-sm ${
                  isEnterpriseMode ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Analyse conforme aux spécifications INSEE
                </p>
              </div>
            </div>
            
            {isCalculating ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-300 border-t-cyan-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheckIcon className="w-4 h-4 md:w-6 md:h-6 text-cyan-500" />
                  </div>
                </div>
                <p className={`mt-4 md:mt-6 font-medium ${
                  isEnterpriseMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Validation en cours...
                </p>
                <p className={`text-xs md:text-sm mt-1 md:mt-2 ${
                  isEnterpriseMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Analyse algorithmique
                </p>
              </div>
            ) : validation ? (
              <>
                <div className={`rounded-xl p-4 md:p-6 mb-6 md:mb-8 border transition-all duration-300 ${
                  validation.isValid 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-emerald-500/30' 
                    : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`text-lg md:text-2xl font-bold mb-2 ${
                        validation.isValid 
                          ? isEnterpriseMode ? 'text-emerald-400' : 'text-emerald-700'
                          : isEnterpriseMode ? 'text-red-400' : 'text-red-700'
                      }`}>
                        {validation.message}
                      </div>
                      
                      {validation.details.length > 0 && (
                        <div className="space-y-1 md:space-y-2">
                          {validation.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-1 md:mt-1.5 flex-shrink-0 ${
                                detail.includes('invalide') || detail.includes('Code genre')
                                  ? 'bg-red-500' 
                                  : detail.startsWith('Attention')
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}></div>
                              <span className={`text-xs md:text-sm ${
                                isEnterpriseMode ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                {detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {validation.isValid && (
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ml-3 flex-shrink-0 ${
                        isEnterpriseMode
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                          : 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                      }`}>
                        <CheckCircleSolid className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                {validation.isValid && validation.gender && (
                  <div>
                    <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
                      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${
                        isEnterpriseMode
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                          : 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200'
                      }`}>
                        <InformationCircleIcon className={`w-3 h-3 md:w-4 md:h-4 ${
                          isEnterpriseMode ? 'text-cyan-400' : 'text-cyan-600'
                        }`} />
                      </div>
                      <h3 className={`font-bold text-sm md:text-base ${
                        isEnterpriseMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        Décodage du numéro
                      </h3>
                    </div>
                    
                    <div className={`rounded-xl p-4 md:p-6 border ${
                      isEnterpriseMode
                        ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700'
                        : 'bg-gradient-to-br from-slate-50 to-white border-slate-300'
                    }`}>
                      <div className={`mb-4 md:mb-6 rounded-lg p-3 md:p-4 border ${
                        isEnterpriseMode
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30'
                          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                      }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
                          <div className="flex-1">
                            <div className={`text-xs md:text-sm font-medium mb-1 md:mb-2 flex items-center space-x-2 ${
                              isEnterpriseMode ? 'text-slate-400' : 'text-indigo-600'
                            }`}>
                              <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center border border-indigo-200">
                                <KeyIcon className="w-2 h-2 md:w-3 md:h-3 text-indigo-600" />
                              </div>
                              <span>Numéro complet</span>
                            </div>
                            <div className={`font-mono text-base md:text-xl font-bold ${
                              isEnterpriseMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              {number.replace(/\s/g, '')}{validation.calculatedKey!.toString().padStart(2, '0')}
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(true)}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-xs md:text-sm ${
                              isEnterpriseMode
                                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            <DocumentDuplicateIcon className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{copiedFull ? 'Copié !' : 'Copier'}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-1">
                          <div className={`text-xs md:text-sm font-medium flex items-center space-x-2 ${
                            isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center border border-cyan-200">
                              <UserIcon className="w-2 h-2 md:w-3 md:h-3 text-cyan-600" />
                            </div>
                            <span>Genre</span>
                          </div>
                          <div className={`font-semibold text-base md:text-lg ${
                            isEnterpriseMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {validation.gender}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className={`text-xs md:text-sm font-medium flex items-center space-x-2 ${
                            isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-200">
                              <CalendarIcon className="w-2 h-2 md:w-3 md:h-3 text-blue-600" />
                            </div>
                            <span>Date de naissance</span>
                          </div>
                          <div className={`font-semibold text-base md:text-lg ${
                            isEnterpriseMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {formatMonth(validation.birthMonth!)} {validation.birthYear}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className={`text-xs md:text-sm font-medium flex items-center space-x-2 ${
                            isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center border border-violet-200">
                              <MapPinIcon className="w-2 h-2 md:w-3 md:h-3 text-violet-600" />
                            </div>
                            <span>Lieu de naissance</span>
                          </div>
                          <div className={`font-semibold text-base md:text-lg ${
                            isEnterpriseMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {getDepartmentName(validation.birthDepartment!)}
                          </div>
                          <div className={`text-xs ${
                            isEnterpriseMode ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            Commune : {validation.birthCommune}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className={`text-xs md:text-sm font-medium ${
                            isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            Numéro d'ordre
                          </div>
                          <div className={`font-semibold text-base md:text-lg ${
                            isEnterpriseMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {validation.birthOrder!.toString().padStart(3, '0')}
                          </div>
                          <div className={`text-xs ${
                            isEnterpriseMode ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            Registre d'état civil
                          </div>
                        </div>
                      </div>
                      
                      {(validation.isForeignBorn || validation.isTemporaryNumber) && (
                        <div className={`mt-4 md:mt-6 pt-4 md:pt-6 border-t ${
                          isEnterpriseMode ? 'border-slate-700' : 'border-slate-300'
                        }`}>
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${
                              isEnterpriseMode
                                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200'
                            }`}>
                              <ShieldCheckIcon className={`w-3 h-3 md:w-4 md:h-4 ${
                                isEnterpriseMode ? 'text-amber-400' : 'text-amber-600'
                              }`} />
                            </div>
                            <div>
                              <div className={`font-medium text-sm ${
                                isEnterpriseMode ? 'text-amber-400' : 'text-amber-700'
                              }`}>
                                {validation.isForeignBorn && 'Personne née à l\'étranger'}
                                {validation.isTemporaryNumber && 'Numéro temporaire'}
                              </div>
                              <div className={`text-xs ${
                                isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                Identification spécifique
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 md:py-16">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 ${
                  isEnterpriseMode
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300'
                }`}>
                  <InformationCircleIcon className={`w-8 h-8 md:w-10 md:h-10 ${
                    isEnterpriseMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                </div>
                <h3 className={`text-base md:text-lg font-bold mb-1 md:mb-2 ${
                  isEnterpriseMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Saisie attendue
                </h3>
                <p className={`text-xs md:text-sm ${
                  isEnterpriseMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Entrez un numéro NIR de 13 chiffres pour commencer l'analyse
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className={`mt-6 md:mt-8 rounded-2xl p-6 md:p-8 border transition-all duration-300 ${
          isEnterpriseMode
            ? 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-cyan-200/30'
            : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isEnterpriseMode
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  : 'bg-gradient-to-br from-slate-900 to-slate-800'
              }`}>
                <LockClosedIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Sécurité totale</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  Tous les calculs sont effectués localement. Aucune donnée n'est transmise.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isEnterpriseMode
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-slate-900 to-slate-800'
              }`}>
                <ShieldCheckIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Conformité INSEE</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  Validation basée sur les normes officielles françaises.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isEnterpriseMode
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                  : 'bg-gradient-to-br from-slate-900 to-slate-800'
              }`}>
                <BuildingLibraryIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Usage professionnel</h4>
                <p className="text-xs md:text-sm text-slate-600">
                  Pour professionnels de santé, RH et administrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}