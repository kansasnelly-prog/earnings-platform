import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

// Translation dictionary for all supported languages
export const TRANSLATIONS = {
  en: {
    // Header / Navigation
    platformActive: 'Platform Active',
    usersOnline: 'users online',
    signIn: 'Sign In',
    getStarted: 'Get Started',
    
    // Hero Section
    optimizeYour: 'Optimize Your',
    digitalEarnings: 'Digital Earnings',
    heroDescription: 'Join thousands of users earning through our optimized task platform. Complete your VIP tier tasks, bind your digital wallet, and withdraw your earnings seamlessly.',
    startEarningNow: 'Start Earning Now',
    signInToDashboard: 'Sign In to Dashboard',
    
    // Stats
    activeUsers: 'Active Users',
    totalPaidOut: 'Total Paid Out',
    countries: 'Countries',
    support: 'Support',
    
    // Features Section
    whyChooseUs: 'Why Choose Us',
    builtForEarners: 'Built for Serious Earners',
    featuresDescription: 'Our platform combines cutting-edge technology with a proven task optimization system to maximize your earning potential.',
    quickTasks: 'Quick Tasks',
    quickTasksDesc: 'Complete optimized tasks designed for maximum efficiency and earnings potential.',
    securePlatform: 'Secure Platform',
    securePlatformDesc: 'Enterprise-grade security with encrypted transactions and verified withdrawals.',
    earnRewards: 'Earn Rewards',
    earnRewardsDesc: 'Progressive reward system that increases as you complete more tasks in your tier.',
    digitalWallet: 'Digital Wallet',
    digitalWalletDesc: 'Bind your USDT wallet for instant withdrawals after completing your task set.',
    
    // How It Works
    howItWorks: 'How It Works',
    simpleSteps: 'Simple Steps to Start Earning',
    step1Title: 'Create Account',
    step1Desc: 'Register with your email and phone number in under 60 seconds.',
    step2Title: 'Complete Tasks',
    step2Desc: 'Work through your VIP1 task set of 35 optimized assignments.',
    step3Title: 'Bind Wallet',
    step3Desc: 'Connect your USDT digital wallet to receive your earnings.',
    step4Title: 'Withdraw Funds',
    step4Desc: 'Request withdrawal after completing all tasks in your tier.',
    
    // VIP Tiers
    chooseYourPath: 'Choose Your Path',
    vipTiers: 'VIP Tiers & Rewards',
    tasks: 'tasks',
    reward: 'reward',
    total: 'Total',
    popular: 'Popular',
    
    // Language Selector
    selectLanguage: 'Select Language',
  },
  
  es: {
    // Spanish translations
    platformActive: 'Plataforma Activa',
    usersOnline: 'usuarios en línea',
    signIn: 'Iniciar Sesión',
    getStarted: 'Comenzar',
    
    optimizeYour: 'Optimiza Tus',
    digitalEarnings: 'Ganancias Digitales',
    heroDescription: 'Únete a miles de usuarios que ganan a través de nuestra plataforma de tareas optimizada. Completa tus tareas VIP, vincula tu billetera digital y retira tus ganancias sin problemas.',
    startEarningNow: 'Comienza a Ganar Ahora',
    signInToDashboard: 'Iniciar Sesión en el Panel',
    
    activeUsers: 'Usuarios Activos',
    totalPaidOut: 'Total Pagado',
    countries: 'Países',
    support: 'Soporte',
    
    whyChooseUs: 'Por Qué Elegirnos',
    builtForEarners: 'Construido para Ganadores Serios',
    featuresDescription: 'Nuestra plataforma combina tecnología de vanguardia con un sistema probado de optimización de tareas para maximizar tu potencial de ganancias.',
    quickTasks: 'Tareas Rápidas',
    quickTasksDesc: 'Completa tareas optimizadas diseñadas para máxima eficiencia y potencial de ganancias.',
    securePlatform: 'Plataforma Segura',
    securePlatformDesc: 'Seguridad de nivel empresarial con transacciones encriptadas y retiros verificados.',
    earnRewards: 'Gana Recompensas',
    earnRewardsDesc: 'Sistema de recompensas progresivo que aumenta a medida que completas más tareas.',
    digitalWallet: 'Billetera Digital',
    digitalWalletDesc: 'Vincula tu billetera USDT para retiros instantáneos después de completar tus tareas.',
    
    howItWorks: 'Cómo Funciona',
    simpleSteps: 'Pasos Simples para Comenzar a Ganar',
    step1Title: 'Crear Cuenta',
    step1Desc: 'Regístrate con tu correo y teléfono en menos de 60 segundos.',
    step2Title: 'Completar Tareas',
    step2Desc: 'Trabaja en tu conjunto de tareas VIP1 de 35 asignaciones optimizadas.',
    step3Title: 'Vincular Billetera',
    step3Desc: 'Conecta tu billetera digital USDT para recibir tus ganancias.',
    step4Title: 'Retirar Fondos',
    step4Desc: 'Solicita retiro después de completar todas las tareas de tu nivel.',
    
    chooseYourPath: 'Elige Tu Camino',
    vipTiers: 'Niveles VIP y Recompensas',
    tasks: 'tareas',
    reward: 'recompensa',
    total: 'Total',
    popular: 'Popular',
    
    selectLanguage: 'Seleccionar Idioma',
  },
  
  fr: {
    // French translations
    platformActive: 'Plateforme Active',
    usersOnline: 'utilisateurs en ligne',
    signIn: 'Se Connecter',
    getStarted: 'Commencer',
    
    optimizeYour: 'Optimisez Vos',
    digitalEarnings: 'Gains Numériques',
    heroDescription: 'Rejoignez des milliers d\'utilisateurs qui gagnent grâce à notre plateforme de tâches optimisée. Complétez vos tâches VIP, liez votre portefeuille numérique et retirez vos gains en toute simplicité.',
    startEarningNow: 'Commencez à Gagner Maintenant',
    signInToDashboard: 'Connexion au Tableau de Bord',
    
    activeUsers: 'Utilisateurs Actifs',
    totalPaidOut: 'Total Versé',
    countries: 'Pays',
    support: 'Support',
    
    whyChooseUs: 'Pourquoi Nous Choisir',
    builtForEarners: 'Conçu pour les Gagnants Sérieux',
    featuresDescription: 'Notre plateforme combine une technologie de pointe avec un système éprouvé d\'optimisation des tâches pour maximiser votre potentiel de gains.',
    quickTasks: 'Tâches Rapides',
    quickTasksDesc: 'Complétez des tâches optimisées conçues pour une efficacité maximale.',
    securePlatform: 'Plateforme Sécurisée',
    securePlatformDesc: 'Sécurité de niveau entreprise avec transactions cryptées et retraits vérifiés.',
    earnRewards: 'Gagnez des Récompenses',
    earnRewardsDesc: 'Système de récompenses progressif qui augmente à mesure que vous complétez des tâches.',
    digitalWallet: 'Portefeuille Numérique',
    digitalWalletDesc: 'Liez votre portefeuille USDT pour des retraits instantanés.',
    
    howItWorks: 'Comment Ça Marche',
    simpleSteps: 'Étapes Simples pour Commencer à Gagner',
    step1Title: 'Créer un Compte',
    step1Desc: 'Inscrivez-vous avec votre email et téléphone en moins de 60 secondes.',
    step2Title: 'Compléter les Tâches',
    step2Desc: 'Travaillez sur votre ensemble de tâches VIP1 de 35 missions optimisées.',
    step3Title: 'Lier le Portefeuille',
    step3Desc: 'Connectez votre portefeuille numérique USDT pour recevoir vos gains.',
    step4Title: 'Retirer les Fonds',
    step4Desc: 'Demandez un retrait après avoir complété toutes les tâches de votre niveau.',
    
    chooseYourPath: 'Choisissez Votre Chemin',
    vipTiers: 'Niveaux VIP et Récompenses',
    tasks: 'tâches',
    reward: 'récompense',
    total: 'Total',
    popular: 'Populaire',
    
    selectLanguage: 'Sélectionner la Langue',
  },
  
  zh: {
    // Chinese translations
    platformActive: '平台活跃',
    usersOnline: '用户在线',
    signIn: '登录',
    getStarted: '开始使用',
    
    optimizeYour: '优化您的',
    digitalEarnings: '数字收益',
    heroDescription: '加入数千名通过我们优化的任务平台赚钱的用户。完成您的VIP等级任务，绑定您的数字钱包，并无缝提取您的收益。',
    startEarningNow: '立即开始赚钱',
    signInToDashboard: '登录到仪表板',
    
    activeUsers: '活跃用户',
    totalPaidOut: '总支付',
    countries: '国家',
    support: '支持',
    
    whyChooseUs: '为什么选择我们',
    builtForEarners: '为认真赚钱的人打造',
    featuresDescription: '我们的平台将尖端技术与经过验证的任务优化系统相结合，以最大化您的赚钱潜力。',
    quickTasks: '快速任务',
    quickTasksDesc: '完成为最大效率和赚钱潜力而设计的优化任务。',
    securePlatform: '安全平台',
    securePlatformDesc: '企业级安全，加密交易和验证提款。',
    earnRewards: '赚取奖励',
    earnRewardsDesc: '渐进式奖励系统，随着您完成更多任务而增加。',
    digitalWallet: '数字钱包',
    digitalWalletDesc: '绑定您的USDT钱包，完成任务后可即时提款。',
    
    howItWorks: '如何运作',
    simpleSteps: '开始赚钱的简单步骤',
    step1Title: '创建账户',
    step1Desc: '在60秒内用您的电子邮件和电话号码注册。',
    step2Title: '完成任务',
    step2Desc: '完成您的VIP1任务集中的35个优化任务。',
    step3Title: '绑定钱包',
    step3Desc: '连接您的USDT数字钱包以接收您的收益。',
    step4Title: '提取资金',
    step4Desc: '完成您等级的所有任务后请求提款。',
    
    chooseYourPath: '选择您的道路',
    vipTiers: 'VIP等级和奖励',
    tasks: '任务',
    reward: '奖励',
    total: '总计',
    popular: '热门',
    
    selectLanguage: '选择语言',
  },
  
  ar: {
    // Arabic translations
    platformActive: 'المنصة نشطة',
    usersOnline: 'مستخدم متصل',
    signIn: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    
    optimizeYour: 'حسّن',
    digitalEarnings: 'أرباحك الرقمية',
    heroDescription: 'انضم إلى آلاف المستخدمين الذين يكسبون من خلال منصة المهام المحسّنة لدينا. أكمل مهام VIP الخاصة بك، اربط محفظتك الرقمية، وسحب أرباحك بسلاسة.',
    startEarningNow: 'ابدأ بالربح الآن',
    signInToDashboard: 'تسجيل الدخول إلى لوحة التحكم',
    
    activeUsers: 'المستخدمين النشطين',
    totalPaidOut: 'إجمالي المدفوعات',
    countries: 'الدول',
    support: 'الدعم',
    
    whyChooseUs: 'لماذا تختارنا',
    builtForEarners: 'مبني للمكسبين الجادين',
    featuresDescription: 'تجمع منصتنا بين التكنولوجيا المتقدمة ونظام تحسين المهام المثبت لتعظيم إمكانات ربحك.',
    quickTasks: 'مهام سريعة',
    quickTasksDesc: 'أكمل المهام المحسّنة المصممة للكفاءة القصوى وإمكانات الربح.',
    securePlatform: 'منصة آمنة',
    securePlatformDesc: 'أمان على مستوى المؤسسات مع معاملات مشفرة وعمليات سحب موثقة.',
    earnRewards: 'اكسب المكافآت',
    earnRewardsDesc: 'نظام مكافآت تدريجي يزداد كلما أكملت المزيد من المهام.',
    digitalWallet: 'المحفظة الرقمية',
    digitalWalletDesc: 'اربط محفظة USDT الخاصة بك للسحب الفوري بعد إكمال مهامك.',
    
    howItWorks: 'كيف يعمل',
    simpleSteps: 'خطوات بسيطة لبدء الربح',
    step1Title: 'إنشاء حساب',
    step1Desc: 'سجّل باستخدام بريدك الإلكتروني وهاتفك في أقل من 60 ثانية.',
    step2Title: 'إكمال المهام',
    step2Desc: 'اعمل على مجموعة مهام VIP1 المكونة من 35 مهمة محسّنة.',
    step3Title: 'ربط المحفظة',
    step3Desc: 'اربط محفظتك الرقمية USDT لاستلام أرباحك.',
    step4Title: 'سحب الأموال',
    step4Desc: 'اطلب السحب بعد إكمال جميع مهام مستواك.',
    
    chooseYourPath: 'اختر طريقك',
    vipTiers: 'مستويات VIP والمكافآت',
    tasks: 'مهام',
    reward: 'مكافأة',
    total: 'المجموع',
    popular: 'شائع',
    
    selectLanguage: 'اختر اللغة',
  },
  
  hi: {
    // Hindi translations
    platformActive: 'प्लेटफॉर्म सक्रिय',
    usersOnline: 'उपयोगकर्ता ऑनलाइन',
    signIn: 'साइन इन',
    getStarted: 'शुरू करें',
    
    optimizeYour: 'अपने को अनुकूलित करें',
    digitalEarnings: 'डिजिटल कमाई',
    heroDescription: 'हमारे अनुकूलित टास्क प्लेटफॉर्म के माध्यम से कमाई करने वाले हजारों उपयोगकर्ताओं में शामिल हों। अपने VIP टियर कार्य पूरे करें, अपना डिजिटल वॉलेट बाइंड करें, और अपनी कमाई सहजता से निकालें।',
    startEarningNow: 'अभी कमाई शुरू करें',
    signInToDashboard: 'डैशबोर्ड में साइन इन करें',
    
    activeUsers: 'सक्रिय उपयोगकर्ता',
    totalPaidOut: 'कुल भुगतान',
    countries: 'देश',
    support: 'सहायता',
    
    whyChooseUs: 'हमें क्यों चुनें',
    builtForEarners: 'गंभीर कमाई करने वालों के लिए बनाया गया',
    featuresDescription: 'हमारा प्लेटफॉर्म अत्याधुनिक तकनीक को सिद्ध टास्क ऑप्टिमाइजेशन सिस्टम के साथ जोड़ता है ताकि आपकी कमाई की क्षमता को अधिकतम किया जा सके।',
    quickTasks: 'त्वरित कार्य',
    quickTasksDesc: 'अधिकतम दक्षता और कमाई क्षमता के लिए डिज़ाइन किए गए अनुकूलित कार्य पूरे करें।',
    securePlatform: 'सुरक्षित प्लेटफॉर्म',
    securePlatformDesc: 'एंटरप्राइज-ग्रेड सुरक्षा एन्क्रिप्टेड लेनदेन और सत्यापित निकासी के साथ।',
    earnRewards: 'पुरस्कार अर्जित करें',
    earnRewardsDesc: 'प्रोग्रेसिव रिवार्ड सिस्टम जो आपके द्वारा अधिक कार्य पूरे करने पर बढ़ता है।',
    digitalWallet: 'डिजिटल वॉलेट',
    digitalWalletDesc: 'अपने कार्य सेट पूरे करने के बाद तत्काल निकासी के लिए अपना USDT वॉलेट बाइंड करें।',
    
    howItWorks: 'यह कैसे काम करता है',
    simpleSteps: 'कमाई शुरू करने के सरल चरण',
    step1Title: 'खाता बनाएं',
    step1Desc: '60 सेकंड से भी कम समय में अपने ईमेल और फोन नंबर के साथ पंजीकरण करें।',
    step2Title: 'कार्य पूरे करें',
    step2Desc: '35 अनुकूलित असाइनमेंट के अपने VIP1 कार्य सेट के माध्यम से काम करें।',
    step3Title: 'वॉलेट बाइंड करें',
    step3Desc: 'अपनी कमाई प्राप्त करने के लिए अपना USDT डिजिटल वॉलेट कनेक्ट करें।',
    step4Title: 'फंड निकालें',
    step4Desc: 'अपने टियर के सभी कार्य पूरे करने के बाद निकासी का अनुरोध करें।',
    
    chooseYourPath: 'अपना रास्ता चुनें',
    vipTiers: 'VIP टियर और पुरस्कार',
    tasks: 'कार्य',
    reward: 'पुरस्कार',
    total: 'कुल',
    popular: 'लोकप्रिय',
    
    selectLanguage: 'भाषा चुनें',
  },
  
  pt: {
    // Portuguese translations
    platformActive: 'Plataforma Ativa',
    usersOnline: 'usuários online',
    signIn: 'Entrar',
    getStarted: 'Começar',
    
    optimizeYour: 'Otimize Seus',
    digitalEarnings: 'Ganhos Digitais',
    heroDescription: 'Junte-se a milhares de usuários ganhando através da nossa plataforma de tarefas otimizada. Complete suas tarefas VIP, vincule sua carteira digital e retire seus ganhos sem problemas.',
    startEarningNow: 'Comece a Ganhar Agora',
    signInToDashboard: 'Entrar no Painel',
    
    activeUsers: 'Usuários Ativos',
    totalPaidOut: 'Total Pago',
    countries: 'Países',
    support: 'Suporte',
    
    whyChooseUs: 'Por Que Nos Escolher',
    builtForEarners: 'Construído para Ganhadores Sérios',
    featuresDescription: 'Nossa plataforma combina tecnologia de ponta com um sistema comprovado de otimização de tarefas para maximizar seu potencial de ganhos.',
    quickTasks: 'Tarefas Rápidas',
    quickTasksDesc: 'Complete tarefas otimizadas projetadas para máxima eficiência e potencial de ganhos.',
    securePlatform: 'Plataforma Segura',
    securePlatformDesc: 'Segurança de nível empresarial com transações criptografadas e saques verificados.',
    earnRewards: 'Ganhe Recompensas',
    earnRewardsDesc: 'Sistema de recompensas progressivo que aumenta à medida que você completa mais tarefas.',
    digitalWallet: 'Carteira Digital',
    digitalWalletDesc: 'Vincule sua carteira USDT para saques instantâneos após completar suas tarefas.',
    
    howItWorks: 'Como Funciona',
    simpleSteps: 'Passos Simples para Começar a Ganhar',
    step1Title: 'Criar Conta',
    step1Desc: 'Registre-se com seu email e telefone em menos de 60 segundos.',
    step2Title: 'Completar Tarefas',
    step2Desc: 'Trabalhe em seu conjunto de tarefas VIP1 de 35 atribuições otimizadas.',
    step3Title: 'Vincular Carteira',
    step3Desc: 'Conecte sua carteira digital USDT para receber seus ganhos.',
    step4Title: 'Sacar Fundos',
    step4Desc: 'Solicite saque após completar todas as tarefas do seu nível.',
    
    chooseYourPath: 'Escolha Seu Caminho',
    vipTiers: 'Níveis VIP e Recompensas',
    tasks: 'tarefas',
    reward: 'recompensa',
    total: 'Total',
    popular: 'Popular',
    
    selectLanguage: 'Selecionar Idioma',
  },
  
  de: {
    // German translations
    platformActive: 'Plattform Aktiv',
    usersOnline: 'Benutzer online',
    signIn: 'Anmelden',
    getStarted: 'Loslegen',
    
    optimizeYour: 'Optimieren Sie Ihre',
    digitalEarnings: 'Digitalen Einnahmen',
    heroDescription: 'Schließen Sie sich Tausenden von Benutzern an, die über unsere optimierte Aufgabenplattform verdienen. Erledigen Sie Ihre VIP-Aufgaben, verbinden Sie Ihre digitale Geldbörse und heben Sie Ihre Einnahmen nahtlos ab.',
    startEarningNow: 'Jetzt Mit Dem Verdienen Beginnen',
    signInToDashboard: 'Zum Dashboard Anmelden',
    
    activeUsers: 'Aktive Benutzer',
    totalPaidOut: 'Insgesamt Ausgezahlt',
    countries: 'Länder',
    support: 'Support',
    
    whyChooseUs: 'Warum Uns Wählen',
    builtForEarners: 'Für Seriöse Verdiener Gebaut',
    featuresDescription: 'Unsere Plattform kombiniert modernste Technologie mit einem bewährten Aufgabenoptimierungssystem, um Ihr Verdienstpotenzial zu maximieren.',
    quickTasks: 'Schnelle Aufgaben',
    quickTasksDesc: 'Erledigen Sie optimierte Aufgaben, die für maximale Effizienz und Verdienstpotenzial entwickelt wurden.',
    securePlatform: 'Sichere Plattform',
    securePlatformDesc: 'Unternehmenssicherheit mit verschlüsselten Transaktionen und verifizierten Abhebungen.',
    earnRewards: 'Prämien Verdienen',
    earnRewardsDesc: 'Progressives Prmiensystem, das steigt, je mehr Aufgaben Sie erledigen.',
    digitalWallet: 'Digitale Geldbörse',
    digitalWalletDesc: 'Binden Sie Ihre USDT-Geldbörse für sofortige Abhebungen nach Abschluss Ihrer Aufgaben.',
    
    howItWorks: 'Wie Es Funktioniert',
    simpleSteps: 'Einfache Schritte Zum Verdienen',
    step1Title: 'Konto Erstellen',
    step1Desc: 'Registrieren Sie sich mit Ihrer E-Mail und Telefonnummer in unter 60 Sekunden.',
    step2Title: 'Aufgaben Erledigen',
    step2Desc: 'Arbeiten Sie sich durch Ihren VIP1-Aufgabensatz mit 35 optimierten Aufgaben.',
    step3Title: 'Geldbörse Verbinden',
    step3Desc: 'Verbinden Sie Ihre USDT-Digitalgeldbörse, um Ihre Einnahmen zu erhalten.',
    step4Title: 'Geld Abheben',
    step4Desc: 'Beantragen Sie eine Abhebung nach Abschluss aller Aufgaben Ihrer Stufe.',
    
    chooseYourPath: 'Wählen Sie Ihren Weg',
    vipTiers: 'VIP-Stufen & Prämien',
    tasks: 'Aufgaben',
    reward: 'Prämie',
    total: 'Gesamt',
    popular: 'Beliebt',
    
    selectLanguage: 'Sprache Wählen',
  },
  
  ja: {
    // Japanese translations
    platformActive: 'プラットフォーム稼働中',
    usersOnline: 'ユーザーがオンライン',
    signIn: 'ログイン',
    getStarted: '始める',
    
    optimizeYour: 'あなたのを最適化',
    digitalEarnings: 'デジタル収益',
    heroDescription: '最適化されたタスクプラットフォームを通じて収入を得ている数千人のユーザーに参加しましょう。VIPティアタスクを完了し、デジタルウォレットをバインドし、シームレスに収益を引き出します。',
    startEarningNow: '今すぐ収入を始める',
    signInToDashboard: 'ダッシュボードにログイン',
    
    activeUsers: 'アクティブユーザー',
    totalPaidOut: '総支払額',
    countries: '国',
    support: 'サポート',
    
    whyChooseUs: '選ぶ理由',
    builtForEarners: '真剣な収入者のために構築',
    featuresDescription: '当社のプラットフォームは、最先端の技術と実績のあるタスク最適化システムを組み合わせて、収入の可能性を最大化します。',
    quickTasks: 'クイックタスク',
    quickTasksDesc: '最大の効率と収益可能性を設計された最適化されたタスクを完了します。',
    securePlatform: '安全なプラットフォーム',
    securePlatformDesc: '暗号化された取引と確認された引き出しを備えたエンタープライズグレードのセキュリティ。',
    earnRewards: '報酬を獲得',
    earnRewardsDesc: 'より多くのタスクを完了するにつれて増加するプログレッシブ報酬システム。',
    digitalWallet: 'デジタルウォレット',
    digitalWalletDesc: 'タスクセットを完了した後、即座に引き出すためにUSDTウォレットをバインドします。',
    
    howItWorks: '使い方',
    simpleSteps: '収入を始める簡単なステップ',
    step1Title: 'アカウント作成',
    step1Desc: '60秒以内にメールと電話番号で登録します。',
    step2Title: 'タスクを完了',
    step2Desc: '35の最適化された課題のVIP1タスクセットを進めます。',
    step3Title: 'ウォレットをバインド',
    step3Desc: '収益を受け取るためにUSDTデジタルウォレットを接続します。',
    step4Title: '資金を引き出す',
    step4Desc: 'ティアのすべてのタスクを完了した後、引き出しをリクエストします。',
    
    chooseYourPath: 'あなたの道を選ぶ',
    vipTiers: 'VIPティアと報酬',
    tasks: 'タスク',
    reward: '報酬',
    total: '合計',
    popular: '人気',
    
    selectLanguage: '言語を選択',
  },
  
  ru: {
    // Russian translations
    platformActive: 'Платформа Активна',
    usersOnline: 'пользователей онлайн',
    signIn: 'Войти',
    getStarted: 'Начать',
    
    optimizeYour: 'Оптимизируйте Свои',
    digitalEarnings: 'Цифровые Доходы',
    heroDescription: 'Присоединяйтесь к тысячам пользователей, зарабатывающих через нашу оптимизированную платформу задач. Выполняйте задачи VIP уровня, привязывайте свой цифровой кошелек и беспрепятственно выводите свои доходы.',
    startEarningNow: 'Начните Зарабатывать Сейчас',
    signInToDashboard: 'Войти в Панель Управления',
    
    activeUsers: 'Активных Пользователей',
    totalPaidOut: 'Всего Выплачено',
    countries: 'Стран',
    support: 'Поддержка',
    
    whyChooseUs: 'Почему Выбирают Нас',
    builtForEarners: 'Создано для Серьезных Заработчиков',
    featuresDescription: 'Наша платформа сочетает передовые технологии с проверенной системой оптимизации задач для максимизации вашего потенциала заработка.',
    quickTasks: 'Быстрые Задачи',
    quickTasksDesc: 'Выполняйте оптимизированные задачи, разработанные для максимальной эффективности и потенциала заработка.',
    securePlatform: 'Безопасная Платформа',
    securePlatformDesc: 'Корпоративная безопасность с зашифрованными транзакциями и проверенными выводами.',
    earnRewards: 'Получайте Награды',
    earnRewardsDesc: 'Прогрессивная система наград, которая увеличивается по мере выполнения задач.',
    digitalWallet: 'Цифровой Кошелек',
    digitalWalletDesc: 'Привяжите свой USDT кошелек для мгновенного вывода после выполнения задач.',
    
    howItWorks: 'Как Это Работает',
    simpleSteps: 'Простые Шаги для Начала Заработка',
    step1Title: 'Создать Аккаунт',
    step1Desc: 'Зарегистрируйтесь с email и телефоном менее чем за 60 секунд.',
    step2Title: 'Выполнять Задачи',
    step2Desc: 'Работайте с набором задач VIP1 из 35 оптимизированных заданий.',
    step3Title: 'Привязать Кошелек',
    step3Desc: 'Подключите свой USDT цифровой кошелек для получения доходов.',
    step4Title: 'Вывести Средства',
    step4Desc: 'Запросите вывод после выполнения всех задач вашего уровня.',
    
    chooseYourPath: 'Выберите Свой Путь',
    vipTiers: 'VIP Уровни и Награды',
    tasks: 'Задачи',
    reward: 'Награда',
    total: 'Итого',
    popular: 'Популярный',
    
    selectLanguage: 'Выбрать Язык',
  },
  
  bn: {
    // Bengali translations
    platformActive: 'প্ল্যাটফর্ম সক্রিয়',
    usersOnline: 'ব্যবহারকারী অনলাইন',
    signIn: 'সাইন ইন',
    getStarted: 'শুরু করুন',
    
    optimizeYour: 'আপনার অপ্টিমাইজ করুন',
    digitalEarnings: 'ডিজিটাল আয়',
    heroDescription: 'আমাদের অপ্টিমাইজড টাস্ক প্ল্যাটফর্মের মাধ্যমে উপার্জনকারী হাজার হাজার ব্যবহারকারীর সাথে যোগ দিন। আপনার VIP টিয়ার টাস্ক সম্পূর্ণ করুন, আপনার ডিজিটাল ওয়ালেট বাইন্ড করুন, এবং নিরবিচ্ছিন্নভাবে আপনার আয় তুলে নিন।',
    startEarningNow: 'এখনই উপার্জন শুরু করুন',
    signInToDashboard: 'ড্যাশবোর্ডে সাইন ইন করুন',
    
    activeUsers: 'সক্রিয় ব্যবহারকারী',
    totalPaidOut: 'মোট পরিশোধ',
    countries: 'দেশ',
    support: 'সহায়তা',
    
    whyChooseUs: 'কেন আমাদের বেছে নেবেন',
    builtForEarners: 'গম্ভীর উপার্জনকারীদের জন্য তৈরি',
    featuresDescription: 'আমাদের প্ল্যাটফর্ম আপনার উপার্জনের ক্ষমতা সর্বাধিক করতে অত্যাধুনিক প্রযুক্তিকে প্রমাণিত টাস্ক অপ্টিমাইজেশন সিস্টেমের সাথে সংযুক্ত করে।',
    quickTasks: 'দ্রুত কাজ',
    quickTasksDesc: 'সর্বোচ্চ দক্ষতা এবং উপার্জনের ক্ষমতার জন্য ডিজাইন করা অপ্টিমাইজড কাজ সম্পূর্ণ করুন।',
    securePlatform: 'নিরাপদ প্ল্যাটফর্ম',
    securePlatformDesc: 'এনক্রিপ্টেড লেনদেন এবং যাচাইকৃত উত্তোলন সহ এন্টারপ্রাইজ-গ্রেড নিরাপত্তা।',
    earnRewards: 'পুরস্কার অর্জন করুন',
    earnRewardsDesc: 'প্রগ্রেসিভ রিওয়ার্ড সিস্টেম যা আপনি আরও কাজ সম্পূর্ণ করার সাথে সাথে বাড়ে।',
    digitalWallet: 'ডিজিটাল ওয়ালেট',
    digitalWalletDesc: 'আপনার কাজের সেট সম্পূর্ণ করার পরে তাৎক্ষণিক উত্তোলনের জন্য আপনার USDT ওয়ালেট বাইন্ড করুন।',
    
    howItWorks: 'এটি কীভাবে কাজ করে',
    simpleSteps: 'উপার্জন শুরু করার সহজ পদক্ষেপ',
    step1Title: 'অ্যাকাউন্ট তৈরি করুন',
    step1Desc: '60 সেকেন্ডেরও কম সময়ে আপনার ইমেইল এবং ফোন নম্বর দিয়ে নিবন্ধন করুন।',
    step2Title: 'কাজ সম্পূর্ণ করুন',
    step2Desc: '35 অপ্টিমাইজড অ্যাসাইনমেন্টের আপনার VIP1 কাজের সেটের মাধ্যমে কাজ করুন।',
    step3Title: 'ওয়ালেট বাইন্ড করুন',
    step3Desc: 'আপনার আয় গ্রহণ করতে আপনার USDT ডিজিটাল ওয়ালেট সংযুক্ত করুন।',
    step4Title: 'ফান্ড উত্তোলন করুন',
    step4Desc: 'আপনার টিয়ারের সমস্ত কাজ সম্পূর্ণ করার পরে উত্তোলনের অনুরোধ করুন।',
    
    chooseYourPath: 'আপনার পথ বেছে নিন',
    vipTiers: 'VIP টিয়ার এবং পুরস্কার',
    tasks: 'কাজ',
    reward: 'পুরস্কার',
    total: 'মোট',
    popular: 'জনপ্রিয়',
    
    selectLanguage: 'ভাষা নির্বাচন করুন',
  },
  
  pa: {
    // Punjabi translations
    platformActive: 'ਪਲੇਟਫਾਰਮ ਸਰਗਰਮ',
    usersOnline: 'ਉਪਯੋਗਕਰਤਾ ਔਨਲਾਈਨ',
    signIn: 'ਸਾਈਨ ਇਨ',
    getStarted: 'ਸ਼ੁਰੂ ਕਰੋ',
    
    optimizeYour: 'ਆਪਣੇ ਨੂੰ ਵਧੀਆ ਬਣਾਓ',
    digitalEarnings: 'ਡਿਜੀਟਲ ਕਮਾਈ',
    heroDescription: 'ਸਾਡੇ ਓਪਟੀਮਾਈਜ਼ਡ ਟਾਸਕ ਪਲੇਟਫਾਰਮ ਰਾਹੀਂ ਕਮਾਈ ਕਰਨ ਵਾਲੇ ਹਜ਼ਾਰਾਂ ਉਪਯੋਗਕਰਤਾਵਾਂ ਨਾਲ ਜੁੜੋ। ਆਪਣੇ VIP ਟੀਅਰ ਟਾਸਕ ਪੂਰੇ ਕਰੋ, ਆਪਣਾ ਡਿਜੀਟਲ ਵਾਲਿਟ ਬਾਈਂਡ ਕਰੋ, ਅਤੇ ਆਪਣੀ ਕਮਾਈ ਸਮੂਥ ਢੰਗ ਨਾਲ ਕੱਢੋ।',
    startEarningNow: 'ਹੁਣੇ ਕਮਾਈ ਸ਼ੁਰੂ ਕਰੋ',
    signInToDashboard: 'ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ',
    
    activeUsers: 'ਸਰਗਰਮ ਉਪਯੋਗਕਰਤਾ',
    totalPaidOut: 'ਕੁੱਲ ਭੁਗਤਾਨ',
    countries: 'ਦੇਸ਼',
    support: 'ਸਹਾਇਤਾ',
    
    whyChooseUs: 'ਸਾਨੂੰ ਕਿਉਂ ਚੁਣੋ',
    builtForEarners: 'ਗੰਭੀਰ ਕਮਾਈ ਕਰਨ ਵਾਲਿਆਂ ਲਈ ਬਣਾਇਆ',
    featuresDescription: 'ਸਾਡਾ ਪਲੇਟਫਾਰਮ ਤੁਹਾਡੀ ਕਮਾਈ ਦੀ ਸਮਰੱਥਾ ਨੂੰ ਵੱਧ ਤੋਂ ਵੱਧ ਕਰਨ ਲਈ ਅਤਿ-ਆਧੁਨਿਕ ਤਕਨਾਲੋਜੀ ਨੂੰ ਸਾਬਤ ਟਾਸਕ ਓਪਟੀਮਾਈਜ਼ੇਸ਼ਨ ਸਿਸਟਮ ਨਾਲ ਜੋੜਦਾ ਹੈ।',
    quickTasks: 'ਤੁਰੰਤ ਕੰਮ',
    quickTasksDesc: 'ਵੱਧ ਤੋਂ ਵੱਧ ਦਕਾਰੀਅਤੀ ਅਤੇ ਕਮਾਈ ਸਮਰੱਥਾ ਲਈ ਡਿਜ਼ਾਈਨ ਕੀਤੇ ਓਪਟੀਮਾਈਜ਼ਡ ਕੰਮ ਪੂਰੇ ਕਰੋ।',
    securePlatform: 'ਸੁਰੱਖਿਅਤ ਪਲੇਟਫਾਰਮ',
    securePlatformDesc: 'ਇੰਕ੍ਰਿਪਟਡ ਲੈਣ-ਦੇਣ ਅਤੇ ਪੁਸ਼ਟੀ ਕੀਤੀਆਂ ਵਾਪਸੀਆਂ ਨਾਲ ਉੱਦਮ-ਗ੍ਰੇਡ ਸੁਰੱਖਿਆ।',
    earnRewards: 'ਇਨਾਮ ਕਮਾਓ',
    earnRewardsDesc: 'ਪ੍ਰਗਤੀਸ਼ੀਲ ਇਨਾਮ ਪ੍ਰਣਾਲੀ ਜੋ ਤੁਸੀਂ ਹੋਰ ਕੰਮ ਪੂਰੇ ਕਰਨ ਨਾਲ ਵਧਦੀ ਹੈ।',
    digitalWallet: 'ਡਿਜੀਟਲ ਵਾਲਿਟ',
    digitalWalletDesc: 'ਆਪਣੇ ਕੰਮ ਸੈੱਟ ਪੂਰੇ ਕਰਨ ਤੋਂ ਬਾਅਦ ਤੁਰੰਤ ਵਾਪਸੀ ਲਈ ਆਪਣਾ USDT ਵਾਲਿਟ ਬਾਈਂਡ ਕਰੋ।',
    
    howItWorks: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    simpleSteps: 'ਕਮਾਈ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਧਾਰਨ ਕਦਮ',
    step1Title: 'ਖਾਤਾ ਬਣਾਓ',
    step1Desc: '60 ਸਕਿੰਟ ਤੋਂ ਘੱਟ ਸਮੇਂ ਵਿੱਚ ਆਪਣੇ ਈਮੇਲ ਅਤੇ ਫੋਨ ਨੰਬਰ ਨਾਲ ਰਜਿਸਟਰ ਕਰੋ।',
    step2Title: 'ਕੰਮ ਪੂਰੇ ਕਰੋ',
    step2Desc: '35 ਓਪਟੀਮਾਈਜ਼ਡ ਕੰਮਾਂ ਦੇ ਆਪਣੇ VIP1 ਕੰਮ ਸੈੱਟ ਰਾਹੀਂ ਕੰਮ ਕਰੋ।',
    step3Title: 'ਵਾਲਿਟ ਬਾਈਂਡ ਕਰੋ',
    step3Desc: 'ਆਪਣੀ ਕਮਾਈ ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ ਆਪਣਾ USDT ਡਿਜੀਟਲ ਵਾਲਿਟ ਕਨੈਕਟ ਕਰੋ।',
    step4Title: 'ਫੰਡ ਵਾਪਸ ਲਓ',
    step4Desc: 'ਆਪਣੇ ਟੀਅਰ ਦੇ ਸਾਰੇ ਕੰਮ ਪੂਰੇ ਕਰਨ ਤੋਂ ਬਾਅਦ ਵਾਪਸੀ ਦੀ ਬੇਨਤੀ ਕਰੋ।',
    
    chooseYourPath: 'ਆਪਣਾ ਰਾਹ ਚੁਣੋ',
    vipTiers: 'VIP ਟੀਅਰ ਅਤੇ ਇਨਾਮ',
    tasks: 'ਕੰਮ',
    reward: 'ਇਨਾਮ',
    total: 'ਕੁੱਲ',
    popular: 'ਪ੍ਰਸਿੱਧ',
    
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
  },

  km: {
    // Khmer translations
    platformActive: 'កម្មវិធីសកម្ម',
    usersOnline: 'អ្នកប្រើប្រាស់លើបណ្តាញ',
    signIn: 'ចូលគណនី',
    getStarted: 'ចាប់ផ្តើម',
    
    optimizeYour: 'បង្កើនប្រសិទ្ធិភាព',
    digitalEarnings: 'ប្រាក់ចំណូលឌីជីថល',
    heroDescription: 'ចូលរួមជាមួយអ្នកប្រើប្រាស់ពាន់នាក់ដែលកំពុងរកប្រាក់តាមរយៈវេទិកាកិច្ចបានបង្កើនប្រសិទ្ធិភាពរបស់យើង។ បំពេញកិច្ចការ VIP របស់អ្នក ភ្ជាប់កាបូបឌីជីថលរបស់អ្នក ហើយដកប្រាក់ចំណូលរបស់អ្នកយ៉ាងងាយស្រួល។',
    startEarningNow: 'ចាប់ផ្តើមរកប្រាក់ឥឡូវនេះ',
    signInToDashboard: 'ចូលទៅក្នុងផ្ទាំងគ្រប់គ្រង',
    
    activeUsers: 'អ្នកប្រើប្រាស់សកម្ម',
    totalPaidOut: 'បានបង់សរុប',
    countries: 'ប្រទេស',
    support: 'គាំទ្រ',
    
    whyChooseUs: 'ហេតុអ្វីបានជាជ្រើសរើសយើង',
    builtForEarners: 'ស្ថាបនាសម្រាប់អ្នករកប្រាក់យ៉ាងស៊ីជម្រៅ',
    featuresDescription: 'វេទិការបស់យើងរួមបញ្ចូលបច្ចេកវិទ្យាកំពូលជាមួយប្រព័ន្ធបង្កើនប្រសិទ្ធិភាពកិច្ចការដែលបានសាកល្បងហើយដើម្បីបង្កើនសមត្ថភាពការរកប្រាក់របស់អ្នក។',
    quickTasks: 'កិច្ចការរហ័ស',
    quickTasksDesc: 'បំពេញកិច្ចការដែលបានបង្កើនប្រសិទ្ធិភាពសម្រាប់ប្រសិទ្ធិភាពអតិបរមា និងសមត្ថភាពការរកប្រាក់។',
    securePlatform: 'វេទិកាសុវត្ថិភាព',
    securePlatformDesc: 'សុវត្ថិភាពកម្រិតសហគ្រាសជាមួយប្រតិបត្តិការដែលបានអ៊ិនគ្រីប និងការដកប្រាក់ដែលបានផ្ទៀងផ្ទាត់។',
    earnRewards: 'រកបានរង្វាន់',
    earnRewardsDesc: 'ប្រព័ន្ធរង្វាន់កាន់តែច្រើនដែលកើនឡើងនៅពេលអ្នកបំពេញកិច្ចការបន្ថែមទៀត។',
    digitalWallet: 'កាបូបឌីជីថល',
    digitalWalletDesc: 'ភ្ជាប់កាបូប USDT របស់អ្នកសម្រាប់ការដកប្រាក់ភ្លាមៗបន្ទាប់ពីបំពេញកិច្ចការរបស់អ្នក។',
    
    howItWorks: 'របៀបដំណើរការ',
    simpleSteps: 'ជំហានសាមញ្ញដើម្បីចាប់ផ្តើមរកប្រាក់',
    step1Title: 'បង្កើតគណនី',
    step1Desc: 'ចុះឈ្មោះជាមួយអ៊ីមែល និងលេខទូរស័ព្ទរបស់អ្នកក្នុងរយៈពេលតិចជាង ៦០ វិនាទី។',
    step2Title: 'បំពេញកិច្ចការ',
    step2Desc: 'ធ្វើការលើសំណុំកិច្ចការ VIP1 របស់អ្នកដែលមាន ៣៥ កិច្ចការដែលបានបង្កើនប្រសិទ្ធិភាព។',
    step3Title: 'ភ្ជាប់កាបូប',
    step3Desc: 'ភ្ជាប់កាបូបឌីជីថល USDT របស់អ្នកដើម្បីទទួលបានប្រាក់ចំណូលរបស់អ្នក។',
    step4Title: 'ដកប្រាក់',
    step4Desc: 'ស្នើសុំការដកប្រាក់បន្ទាប់ពីបំពេញកិច្ចការទាំងអស់នៅក្នុងកម្រិតរបស់អ្នក។',
    
    chooseYourPath: 'ជ្រើសរើសផ្លូវរបស់អ្នក',
    vipTiers: 'កម្រិត VIP និងរង្វាន់',
    tasks: 'កិច្ចការ',
    reward: 'រង្វាន់',
    total: 'សរុប',
    popular: 'ពេញនិយម',
    
    selectLanguage: 'ជ្រើសរើសភាសា',
    
    // Dating & Social Network specific translations
    taskRewardHub: 'មជ្ឈមណ្ឌលរង្វាន់ភារកិច្ច',
    datingSocialNetwork: 'បណ្តាញសង្គម និងការស្វែងរកគូស្រករ',
    nellyCoinBalanceWallet: 'កាបូបលុយ NellyCoin',
    speedMatchCard: 'កាតស្វែងរកគូជម្រើសលឿន (ចំណាយ ១០ កាក់)',
    sevenMinuteAudioMatch: 'បន្ទប់រង់ចាំការផ្គូផ្គងសំឡេង ៧ នាទី',
  },
};

export const LANGUAGES: Language[] = [
  // Primary languages (English first as default)
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  
  // Other major world languages
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycanca' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'me', name: 'Montenegrin', nativeName: 'Crnogorski' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'ast', name: 'Asturian', nativeName: 'Asturianu' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
  { code: 'li', name: 'Limburgish', nativeName: 'Limburgs' },
  { code: 'fy', name: 'West Frisian', nativeName: 'Frysk' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'st', name: 'Southern Sotho', nativeName: 'Sesotho' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga' },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa' },
  { code: 'nr', name: 'Southern Ndebele', nativeName: 'isiNdebele' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi' },
  { code: 'kr', name: 'Kanuri', nativeName: 'Kanuri' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
  { code: 'sn', name: 'Shona', nativeName: 'ChiShona' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'na', name: 'Nauru', nativeName: 'Dorerin Naoero' },
  { code: 'kj', name: 'Kuanyama', nativeName: 'Kuanyama' },
  { code: 'ng', name: 'Ndonga', nativeName: 'Oshiwambo' },
  { code: 'ii', name: 'Nuosu', nativeName: 'ꆈꌠꉙ' },
  { code: 'za', name: 'Zhuang', nativeName: 'Vahcuengh' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
  { code: 'mad', name: 'Madurese', nativeName: 'Basa Mathura' },
  { code: 'min', name: 'Minangkabau', nativeName: 'Baso Minangkabau' },
  { code: 'ace', name: 'Acehnese', nativeName: 'Bahsa Acèh' },
  { code: 'bjn', name: 'Banjar', nativeName: 'Bahasa Banjar' },
  { code: 'bug', name: 'Buginese', nativeName: 'Basa Ugi' },
  { code: 'btx', name: 'Batak Karo', nativeName: 'Batak Karo' },
  { code: 'bew', name: 'Betawi', nativeName: 'Bahasa Betawi' },
  { code: 'bbc', name: 'Batak Toba', nativeName: 'Batak Toba' },
  { code: 'btm', name: 'Batak Mandailing', nativeName: 'Batak Mandailing' },
  { code: 'btd', name: 'Batak Dairi', nativeName: 'Batak Dairi' },
  { code: 'bts', name: 'Batak Simalungun', nativeName: 'Batak Simalungun' },
  { code: 'bta', name: 'Batak Angkola', nativeName: 'Batak Angkola' },
  { code: 'btj', name: 'Batak Pakpak', nativeName: 'Batak Pakpak' },
  { code: 'bty', name: 'Batak Alas-Kluet', nativeName: 'Batak Alas-Kluet' },
  { code: 'btw', name: 'Baban', nativeName: 'Baban' },
  { code: 'bxu', name: 'Buhid', nativeName: 'Buhid' },
  { code: 'bvk', name: 'Bukat', nativeName: 'Bukat' },
  { code: 'bvo', name: 'Bolgo', nativeName: 'Bolgo' },
  { code: 'bwb', name: 'Baba', nativeName: 'Baba' },
  { code: 'bwc', name: 'Bwile', nativeName: 'Bwile' },
  { code: 'bwd', name: 'Bwaidoka', nativeName: 'Bwaidoka' },
  { code: 'bwe', name: 'Bwe Karen', nativeName: 'Bwe Karen' },
  { code: 'bwg', name: 'Barwe', nativeName: 'Barwe' },
  { code: 'bwh', name: 'Bwoo', nativeName: 'Bwoo' },
  { code: 'bwi', name: 'Baniwa', nativeName: 'Baniwa' },
  { code: 'bwk', name: 'Bauwaki', nativeName: 'Bauwaki' },
  { code: 'bwm', name: 'Biwat', nativeName: 'Biwat' },
  { code: 'bwn', name: 'Wunai Bunu', nativeName: 'Wunai Bunu' },
  { code: 'bwo', name: 'Boro', nativeName: 'Boro' },
  { code: 'bwp', name: 'Mandobo Bawah', nativeName: 'Mandobo Bawah' },
  { code: 'bwr', name: 'Bura', nativeName: 'Bura' },
  { code: 'bww', name: 'Bwa', nativeName: 'Bwa' },
  { code: 'bwx', name: 'Bo-Rukul', nativeName: 'Bo-Rukul' },
  { code: 'bxz', name: 'Binahari', nativeName: 'Binahari' },
  { code: 'bya', name: 'Batak', nativeName: 'Batak' },
  { code: 'byb', name: 'Bikya', nativeName: 'Bikya' },
  { code: 'byc', name: 'Ubaghara', nativeName: 'Ubaghara' },
  { code: 'byd', name: 'Benyadu', nativeName: 'Benyadu' },
  { code: 'bye', name: 'Pouye', nativeName: 'Pouye' },
  { code: 'byf', name: 'Bete', nativeName: 'Bete' },
  { code: 'byg', name: 'Baygo', nativeName: 'Baygo' },
  { code: 'byh', name: 'Bujhyal', nativeName: 'Bujhyal' },
  { code: 'byi', name: 'Buyu', nativeName: 'Buyu' },
  { code: 'byj', name: 'Bina', nativeName: 'Bina' },
  { code: 'byk', name: 'Biao', nativeName: 'Biao' },
  { code: 'byl', name: 'Bayono', nativeName: 'Bayono' },
  { code: 'bym', name: 'Bidyara', nativeName: 'Bidyara' },
  { code: 'byn', name: 'Bilin', nativeName: 'Bilin' },
  { code: 'byo', name: 'Biyo', nativeName: 'Biyo' },
  { code: 'byp', name: 'Bumaji', nativeName: 'Bumaji' },
  { code: 'byq', name: 'Basay', nativeName: 'Basay' },
  { code: 'byr', name: 'Baruya', nativeName: 'Baruya' },
  { code: 'bys', name: 'Burak', nativeName: 'Burak' },
  { code: 'byt', name: 'Berti', nativeName: 'Berti' },
  { code: 'byv', name: 'Medumba', nativeName: 'Medumba' },
  { code: 'byw', name: 'Belhariya', nativeName: 'Belhariya' },
  { code: 'byx', name: 'Qaqet', nativeName: 'Qaqet' },
  { code: 'byy', name: 'Buya', nativeName: 'Buya' },
  { code: 'byz', name: 'Banaro', nativeName: 'Banaro' },
];

interface TranslationKey {
  [key: string]: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  availableLanguages: Language[];
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'selected-language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]); // Default to English

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window === "undefined") return;
    
    // Load saved language from localStorage
    const savedLanguageCode = localStorage.getItem(STORAGE_KEY);
    if (savedLanguageCode) {
      const savedLanguage = LANGUAGES.find(lang => lang.code === savedLanguageCode);
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language.code);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const langCode = currentLanguage.code as keyof typeof TRANSLATIONS;
    const translations = TRANSLATIONS[langCode] || TRANSLATIONS['en'];
    return translations[key as keyof typeof translations] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages: LANGUAGES,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
