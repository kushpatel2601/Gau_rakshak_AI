import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PDFReport from "./components/PDFReport";
import { getHistory, predictCow } from "./api"; 
import { 
  Upload, Camera, Activity, Database, Shield, ChevronRight, 
  RefreshCw, AlertCircle, CheckCircle, ArrowLeft, Droplet, 
  Thermometer, Banknote, Info, History, Calendar, Clock, Globe, Home,
  Sparkles
} from "lucide-react";
import "leaflet/dist/leaflet.css";

// ==========================================
// ANIMATION VARIANTS
// ==========================================
const page = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// ==========================================
// 0. TRANSLATIONS (English / Hindi / Gujarati)
// ==========================================
const TRANSLATIONS = {
  en: {
    // Navbar
    app_title: "Gau-Raksha AI",
    nav_home: "Home",
    nav_breeds: "Breeds",
    
    // Home View
    hero_title_1: "Preserving Indigenous Cow Breed Through",
    hero_title_2: "Vision AI",
    hero_subtitle: "Gau-Raksha AI helps identify and protect India’s indigenous cattle breeds using advanced AI-based image analysis.",
    feature_instant: "Instant Results",
    feature_db: "Identifies 50 Indian Breeds",
    btn_identify_cow: "Identify Cow Breed",
    
    // Footer Features
    feat_db_title: "Comprehensive Database",
    feat_db_desc: "Trained on a specialized dataset including rare breeds like Krishna Valley, Amritmahal, and Gir.",
    feat_health_title: "Health & Yield Metrics",
    feat_health_desc: "Our predictive models estimate milk yield, fat percentage, and potential health markers instantly.",
    feat_privacy_title: "Data Privacy",
    feat_privacy_desc: "Your data is processed securely. We are dedicated to the preservation of indigenous cattle genetics.",

    // Identify View
    back_home: "Back to Home",
    view_history: "View History",
    id_title: "Identify Cattle Breed",
    id_subtitle: "Upload a clear image of the cow (side profile preferred)",
    click_upload: "Click to upload",
    drag_drop: "or drag and drop",
    analyzing: "Analyzing Features...",
    btn_identify_now: "Identify Breed Now",
    match: "Match",
    analyze_new: "Analyze New",
    breed_desc_label: "Breed Description",
    
    // Metrics
    metric_milk: "Milk Yield",
    metric_fat: "Fat Percentage",
    metric_climate: "Climate Tolerance",
    metric_value: "Estimated Market Value",
    
    // History View
    back_identify: "Back to Identify",
    db_history: "Database History",
    loading_db: "Loading database records...",
    no_history: "No prediction history found in database.",
    col_breed: "Breed",
    col_conf: "Confidence",
    col_date: "Date & Time",
    
    // Breeds View
    supported_breeds: "Supported",
    breeds_highlight: "Breeds",
    breeds_subtitle: "Our AI is rigorously trained on these 50 distinct cattle categories.",
    learn_more: "Learn more",
    
    // Detail View
    back_breeds: "Back to Breeds",
    profile_tag: "Indigenous Breed Profile",
    desc_title: "Description"
  },
  hi: {
    // Navbar
    app_title: "गौ-रक्षा एआई",
    nav_home: "मुख्य पृष्ठ",
    nav_breeds: "नस्लें",
    
    // Home View
    hero_title_1: "देसी गाय की नस्लों का संरक्षण",
    hero_title_2: "विज़न एआई द्वारा",
    hero_subtitle: "गौ-रक्षा एआई उन्नत एआई-आधारित छवि विश्लेषण का उपयोग करके भारत की देसी मवेशी नस्लों की पहचान और सुरक्षा में मदद करता है।",
    feature_instant: "तत्काल परिणाम",
    feature_db: "50 भारतीय नस्लों की पहचान",
    btn_identify_cow: "गाय की नस्ल पहचानें",
    
    // Footer Features
    feat_db_title: "व्यापक डेटाबेस",
    feat_db_desc: "कृष्णा वैली, अमृतमहल और गिर जैसी दुर्लभ नस्लों सहित विशेष डेटासेट पर प्रशिक्षित।",
    feat_health_title: "स्वास्थ्य और उत्पादन मेट्रिक्स",
    feat_health_desc: "हमारे मॉडल दूध की उपज, वसा प्रतिशत और संभावित स्वास्थ्य संकेतकों का तत्काल अनुमान लगाते हैं।",
    feat_privacy_title: "डेटा गोपनीयता",
    feat_privacy_desc: "आपका डेटा सुरक्षित रूप से संसाधित किया जाता है। हम देसी मवेशी आनुवंशिकी के संरक्षण के लिए समर्पित हैं।",

    // Identify View
    back_home: "वापस मुख्य पृष्ठ",
    view_history: "इतिहास देखें",
    id_title: "मवेशी नस्ल पहचानें",
    id_subtitle: "गाय की स्पष्ट तस्वीर अपलोड करें (साइड प्रोफाइल बेहतर है)",
    click_upload: "अपलोड करने के लिए क्लिक करें",
    drag_drop: "या ड्रैग और ड्रॉप करें",
    analyzing: "विशेषताओं का विश्लेषण...",
    btn_identify_now: "अभी पहचानें",
    match: "मिलान",
    analyze_new: "नई जांच करें",
    breed_desc_label: "नस्ल विवरण",
    
    // Metrics
    metric_milk: "दूध उत्पादन",
    metric_fat: "वसा प्रतिशत",
    metric_climate: "जलवायु सहनशीलता",
    metric_value: "अनुमानित बाजार मूल्य",
    
    // History View
    back_identify: "वापस पहचान पृष्ठ पर",
    db_history: "डेटाबेस इतिहास",
    loading_db: "डेटाबेस रिकॉर्ड लोड हो रहे हैं...",
    no_history: "डेटाबेस में कोई इतिहास नहीं मिला।",
    col_breed: "नस्ल",
    col_conf: "सटीकता",
    col_date: "दिनांक और समय",
    
    // Breeds View
    supported_breeds: "समर्थित",
    breeds_highlight: "नस्लें",
    breeds_subtitle: "हमारा एआई इन 50 विशिष्ट मवेशी श्रेणियों पर कठोरता से प्रशिक्षित है।",
    learn_more: "और जानें",
    
    // Detail View
    back_breeds: "वापस नस्लों पर",
    profile_tag: "देसी नस्ल प्रोफाइल",
    desc_title: "विवरण"
  },
  gu: {
    // Navbar
    app_title: "ગૌ-રક્ષા AI",
    nav_home: "મુખ્ય પૃષ્ઠ",
    nav_breeds: "ઓલાદો",
    
    // Home View
    hero_title_1: "દેશી ગાયની ઓલાદોનું સંરક્ષણ",
    hero_title_2: "વિઝન AI દ્વારા",
    hero_subtitle: "ગૌ-રક્ષા AI આધુનિક ઇમેજ એનાલિસિસનો ઉપયોગ કરીને ભારતની દેશી પશુ ઓલાદોની ઓળખ અને રક્ષણમાં મદદ કરે છે.",
    feature_instant: "ઝડપી પરિણામો",
    feature_db: "50 ભારતીય ઓલાદોની ઓળખ",
    btn_identify_cow: "ઓલાદ ઓળખો",
    
    // Footer Features
    feat_db_title: "વિશાળ ડેટાબેઝ",
    feat_db_desc: "કૃષ્ણા વેલી, અમૃતમહાલ અને ગીર જેવી દુર્લભ ઓલાદો સહિતના ખાસ ડેટાસેટ પર પ્રશિક્ષિત.",
    feat_health_title: "આરોગ્ય અને ઉત્પાદન",
    feat_health_desc: "અમારા મોડેલ દૂધ ઉત્પાદન, ચરબીની ટકાવારી અને સંભવિત આરોગ્ય સંકેતોનો અંદાજ લગાવે છે.",
    feat_privacy_title: "ડેટા ગોપનીયતા",
    feat_privacy_desc: "તમારો ડેટા સુરક્ષિત છે. અમે દેશી પશુ જિનેટિક્સના સંરક્ષણ માટે સમર્પિત છીએ.",

    // Identify View
    back_home: "હોમ પેજ",
    view_history: "ઇતિહાસ જુઓ",
    id_title: "પશુ ઓલાદ ઓળખો",
    id_subtitle: "ગાયનો સ્પષ્ટ ફોટો અપલોડ કરો (બાજુનો દેખાવ શ્રેષ્ઠ છે)",
    click_upload: "અપલોડ કરવા ક્લિક કરો",
    drag_drop: "અથવા ડ્રેગ અને ડ્રોપ કરો",
    analyzing: "વિશ્લેષણ ચાલુ છે...",
    btn_identify_now: "હવે ઓળખો",
    match: "મેચ",
    analyze_new: "ફરીથી તપાસો",
    breed_desc_label: "ઓલાદ વર્ણન",
    
    // Metrics
    metric_milk: "દૂધ ઉત્પાદન",
    metric_fat: "ચરબી %",
    metric_climate: "હવામાન સહનશીલતા",
    metric_value: "બજાર કિંમત",
    
    // History View
    back_identify: "પાછા જાઓ",
    db_history: "ડેટાબેઝ ઇતિહાસ",
    loading_db: "રેકોર્ડ્સ લોડ થઈ રહ્યા છે...",
    no_history: "કોઈ ઇતિહાસ મળ્યો નથી.",
    col_breed: "ઓલાદ",
    col_conf: "ચોકસાઈ",
    col_date: "તારીખ અને સમય",
    
    // Breeds View
    supported_breeds: "સમर्थિત",
    breeds_highlight: "ઓલાદો",
    breeds_subtitle: "અમારું AI આ 50 અલગ અલગ પશુ શ્રેણીઓ પર સચોટ રીતે પ્રશિક્ષિત છે.",
    learn_more: "વધુ જાણો",
    
    // Detail View
    back_breeds: "પાછા ઓલાદો પર",
    profile_tag: "દેશી ઓલાદ પ્રોફાઇલ",
    desc_title: "વર્ણન"
  }
};

// ==========================================
// 1. THE COMPLETE DATASET (All 50 Breeds)
// ==========================================
const BREED_DATA = {
  "Amritmahal": {
    "description": "Legendary draft breed from Karnataka, originally bred for war transport. Known for immense stamina and speed.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "3.8% - 4.2%",
    "climate_tolerance": "Semi-Arid & Heat Resistant",
    "market_value": "₹40,000 - ₹80,000"
  },
  "Ayrshire": {
    "description": "A dairy breed from Scotland. Known for high milk yield and hardiness. Red and white markings.",
    "milk_yield": "20-25 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Temperate/Cold",
    "market_value": "₹60,000 - ₹1,00,000"
  },
  "Bachaur": {
    "description": "Draft breed from Sitamarhi, Bihar. Closely resembles the Hariana breed but smaller. Excellent for field work.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "High Heat Tolerance",
    "market_value": "₹25,000 - ₹45,000"
  },
  "Badri": {
    "description": "Small hill cattle from Uttarakhand. Grazes on medicinal herbs, producing 'medicinal' quality milk. Cold tolerant.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "5.5% (Rich A2 Milk)",
    "climate_tolerance": "Extreme Cold & Hilly Terrain",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Bargur": {
    "description": "Forest-bred cattle from Erode, Tamil Nadu. Known for speed and endurance in trotting. Semi-wild behavior.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Forest Terrain & Heat",
    "market_value": "₹30,000 - ₹55,000"
  },
  "Belahi": {
    "description": "Migratory breed from the foothills of Haryana. Distinctive reddish-brown color with white markings. Hardy nature.",
    "milk_yield": "3-5 Liters/Day",
    "fat_percentage": "4.5% - 5.2%",
    "climate_tolerance": "Variable (Migratory)",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Dagri": {
    "description": "Found in Dahod, Gujarat. Mainly used for agricultural operations in hilly tribal areas. White/Grey color.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Hilly Terrain",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Dangi": {
    "description": "Draft breed from Maharashtra (Western Ghats). Unique black and white spots. Excellent for working in heavy rain/paddy fields.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Heavy Rainfall",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Deoni": {
    "description": "Dual-purpose breed from Maharashtra/Karnataka. Resembles Gir but with black/white spots. Good milkers.",
    "milk_yield": "6-10 Liters/Day",
    "fat_percentage": "4.2% - 4.8%",
    "climate_tolerance": "Semi-Arid",
    "market_value": "₹45,000 - ₹70,000"
  },
  "Gangatiri": {
    "description": "Native to the banks of the Ganga in UP/Bihar. Good dual-purpose breed. Very economical for small farmers.",
    "milk_yield": "4-8 Liters/Day",
    "fat_percentage": "4.5% - 4.9%",
    "climate_tolerance": "Riverine Plains",
    "market_value": "₹35,000 - ₹60,000"
  },
  "Gaolao": {
    "description": "Draft breed from Wardha, Maharashtra. Historically the military breed of the Marathas. Fast runners.",
    "milk_yield": "3-6 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Dry Heat",
    "market_value": "₹30,000 - ₹55,000"
  },
  "Ghumusari": {
    "description": "Draft breed from Odisha. Small but sturdy. Excellent for carting and ploughing in coastal/hilly areas.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Coastal Humidity",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Gir": {
    "description": "World-famous dairy breed from Gujarat. Distinct curved forehead and long ears. High milk yield and docile nature.",
    "milk_yield": "12-18 Liters/Day",
    "fat_percentage": "4.5% - 5.2%",
    "climate_tolerance": "High Heat & Disease Resistant",
    "market_value": "₹60,000 - ₹1,50,000"
  },
  "Hallikar": {
    "description": "The progenitor of all Mysore breeds. Famous for long, vertical, backward-bending horns. Sprint-like speed in field work.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "3.8% - 4.2%",
    "climate_tolerance": "Semi-Arid",
    "market_value": "₹50,000 - ₹1,00,000"
  },
  "Hariana": {
    "description": "Premier dual-purpose breed from North India. Powerful work animals and fair milkers. White/Grey color.",
    "milk_yield": "5-8 Liters/Day",
    "fat_percentage": "4.0% - 4.8%",
    "climate_tolerance": "Heat & Drought",
    "market_value": "₹40,000 - ₹75,000"
  },
  "Himachali Pahari": {
    "description": "Small, hardy mountain cattle from Himachal Pradesh. Sure-footed on steep slopes. High disease resistance.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Cold & Mountainous",
    "market_value": "₹15,000 - ₹30,000"
  },
  "Kangayam": {
    "description": "Pride of Tamil Nadu. Grey/White coat with dark markings. Known for immense strength and 'Jallikattu' cultural value.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "3.8% - 4.2%",
    "climate_tolerance": "Drought Resistant",
    "market_value": "₹50,000 - ₹1,50,000"
  },
  "Kankrej": {
    "description": "Heaviest indigenous breed. Native to Kutch, Gujarat. Massive lyre-shaped horns. 'Sawai Chal' (unique gait).",
    "milk_yield": "8-12 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Saline/Desert Terrain",
    "market_value": "₹50,000 - ₹90,000"
  },
  "Kenkatha": {
    "description": "Small draft breed from Bundelkhand (UP/MP). Known for thriving on poor quality feed and harsh terrain.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Rocky/Arid Terrain",
    "market_value": "₹20,000 - ₹40,000"
  },
  "Khariar": {
    "description": "From Nuapada, Odisha. All-purpose breed for tribal farmers. Very low maintenance requirements.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Drought Tolerant",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Kherigarh": {
    "description": "Draft breed from Lakhimpur Kheri, UP. Active grazers, often white in color. Good for light carting.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Humid Plains",
    "market_value": "₹25,000 - ₹40,000"
  },
  "Khillar": {
    "description": "The 'Race Car' of cattle breeds from Maharashtra. Aggressive, high energy, and extremely fast. Not for beginners.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "3.8% - 4.2%",
    "climate_tolerance": "Stony/Dry Terrain",
    "market_value": "₹50,000 - ₹1,20,000"
  },
  "Kokan Kapila": {
    "description": "Small cattle from Konkan region (Maharashtra/Goa). Adapted to high rainfall and rice farming. Various colors.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "High Humidity & Rain",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Kosali": {
    "description": "From Chhattisgarh. Small, sturdy, and efficient. Vital for small-scale paddy farmers.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "3.5% - 4.5%",
    "climate_tolerance": "Heat & Humidity",
    "market_value": "₹15,000 - ₹30,000"
  },
  "Krishna Valley": {
    "description": "Heavy draft breed from North Karnataka. Massive frame, bred for plowing sticky black cotton soil.",
    "milk_yield": "4-6 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Hot & Humid",
    "market_value": "₹40,000 - ₹70,000"
  },
  "Ladakhi": {
    "description": "Native to Ladakh. Adapted to high altitude, hypobaric hypoxia, and extreme cold (-30°C). Small black/brown cattle.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "6.0% - 8.0% (Very High)",
    "climate_tolerance": "Extreme Cold & Altitude",
    "market_value": "₹20,000 - ₹40,000"
  },
  "Lakhimi": {
    "description": "Entirely kept by small farmers in Assam. Integral to rural economy. Resistant to diverse parasites.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "High Humidity & Flood",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Malnad Gidda": {
    "description": "Dwarf cattle from Karnataka's Western Ghats. Highly disease resistant. Milk is rich in medicinal properties.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "5.0% - 6.0%",
    "climate_tolerance": "Heavy Rain & Forest",
    "market_value": "₹35,000 - ₹60,000"
  },
  "Malvi": {
    "description": "Draft breed from Malwa, MP. White coat, strong build. Very popular for agricultural work in Central India.",
    "milk_yield": "3-5 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Semi-Arid",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Mewati": {
    "description": "Dual purpose breed from Mewat (Rajasthan/Haryana). Docile and hard working. Good for both milk and plow.",
    "milk_yield": "4-7 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Heat Tolerant",
    "market_value": "₹35,000 - ₹60,000"
  },
  "Motu": {
    "description": "Dwarf breed from southern Odisha. Known for unique reddish-brown coat. Extremely hardy.",
    "milk_yield": "1-2 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Tribal/Hilly Terrain",
    "market_value": "₹15,000 - ₹25,000"
  },
  "Nagori": {
    "description": "Famous trotting draft breed from Nagaur, Rajasthan. Agile, tall, and spirited. Used for transport.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "3.8% - 4.2%",
    "climate_tolerance": "Desert Heat",
    "market_value": "₹35,000 - ₹65,000"
  },
  "Nari": {
    "description": "Migratory breed from Sirohi/Pali, Rajasthan. Dual purpose. Known for concave forehead and spiraled horns.",
    "milk_yield": "4-6 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Arid Migration",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Nimari": {
    "description": "Known as the 'Khillar of MP'. Copper-red color with white splashes. Very active and aggressive draft breed.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Dry Heat",
    "market_value": "₹30,000 - ₹55,000"
  },
  "Ongole": {
    "description": "World-renowned breed from AP. Ancestor of the American Brahman. Massive, muscular, and disease resistant.",
    "milk_yield": "5-8 Liters/Day",
    "fat_percentage": "4.0% - 5.0%",
    "climate_tolerance": "High Heat & Viral Resistant",
    "market_value": "₹60,000 - ₹2,00,000"
  },
  "Poda Thurpu": {
    "description": "Draft cattle from Telangana forests. Bred by Lambada tribes. Excellent for working in deep mud/wetlands.",
    "milk_yield": "2-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Forest/Humid",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Ponwar": {
    "description": "Draft breed from Pilibhit, UP. Black and white patches. Small, compact, and active. Good for fast carting.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Plains",
    "market_value": "₹25,000 - ₹40,000"
  },
  "Pulikulam": {
    "description": "The famous 'Jallikattu' bull breed from Tamil Nadu. Grazes in large herds. Aggressive and agile.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Hot & Dry",
    "market_value": "₹40,000 - ₹1,00,000"
  },
  "Punganur": {
    "description": "World's shortest humped cattle (Dwarf). Native to AP. Status symbol. Milk is extremely high in fat.",
    "milk_yield": "3-5 Liters/Day",
    "fat_percentage": "8.0% - 10.0% (Highest)",
    "climate_tolerance": "Dry Climate",
    "market_value": "₹2,00,000 - ₹5,00,000"
  },
  "Purnea": {
    "description": "Small red cattle from Purnea, Bihar. Used for plowing small holdings. Low feed requirement.",
    "milk_yield": "1-3 Liters/Day",
    "fat_percentage": "4.2% - 4.8%",
    "climate_tolerance": "Humid Plains",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Rathi": {
    "description": "Excellent dairy breed from Bikaner, Rajasthan. Called the 'Poor Man's Sahiwal'. Adaptable dual-purpose.",
    "milk_yield": "10-14 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Extreme Desert Heat",
    "market_value": "₹45,000 - ₹85,000"
  },
  "Red Kandhari": {
    "description": "Draft breed from Nanded, Maharashtra. Deep brick-red color. Very uniform and attractive appearance.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Dry Heat",
    "market_value": "₹35,000 - ₹60,000"
  },
  "Red Sindhi": {
    "description": "Top-tier dairy breed. Distinct deep red color. Genetically close to Sahiwal but hardier.",
    "milk_yield": "10-15 Liters/Day",
    "fat_percentage": "4.5% - 5.2%",
    "climate_tolerance": "Heat & Disease Resistant",
    "market_value": "₹50,000 - ₹90,000"
  },
  "Sahiwal": {
    "description": "India's best milch breed. Loose skin ('Lola'). Sweet milk. Exceptionally calm and high yielding.",
    "milk_yield": "12-18 Liters/Day",
    "fat_percentage": "4.5% - 5.2%",
    "climate_tolerance": "Heat & Parasite Resistant",
    "market_value": "₹60,000 - ₹1,00,000"
  },
  "Shweta Kapila": {
    "description": "Short, white cattle from Goa. Produces A2 milk rich in magnesium. Entirely white coat and eyes.",
    "milk_yield": "3-5 Liters/Day",
    "fat_percentage": "5.0% - 6.0%",
    "climate_tolerance": "Coastal Humidity",
    "market_value": "₹30,000 - ₹60,000"
  },
  "Siri": {
    "description": "Draught breed from Sikkim/Darjeeling. Black and white coat. Thick fur for cold protection.",
    "milk_yield": "2-4 Liters/Day",
    "fat_percentage": "4.5% - 5.5%",
    "climate_tolerance": "High Altitude Cold",
    "market_value": "₹25,000 - ₹45,000"
  },
  "Tharparkar": {
    "description": "The 'White Pearl' of the Desert. From Jaisalmer/Kutch. Milk yield increases during drought conditions.",
    "milk_yield": "10-14 Liters/Day",
    "fat_percentage": "4.5% - 4.9%",
    "climate_tolerance": "Extreme Drought",
    "market_value": "₹50,000 - ₹90,000"
  },
  "Thutho": {
    "description": "Indigenous cattle of Nagaland. Used for meat and draft. Semi-wild management system.",
    "milk_yield": "1-2 Liters/Day",
    "fat_percentage": "4.0% - 4.5%",
    "climate_tolerance": "Hilly Jungle",
    "market_value": "₹20,000 - ₹35,000"
  },
  "Umblachery": {
    "description": "Draft breed from coastal Tamil Nadu. Calves are born red and turn grey. Resistant to marshy rot.",
    "milk_yield": "2-3 Liters/Day",
    "fat_percentage": "4.5% - 5.0%",
    "climate_tolerance": "Marshy/Wetland",
    "market_value": "₹30,000 - ₹50,000"
  },
  "Vechur": {
    "description": "Smallest cattle breed from Kerala. Highly valued for medicinal milk properties (easy digestibility).",
    "milk_yield": "2-3 Liters/Day",
    "fat_percentage": "5.5% - 7.0%",
    "climate_tolerance": "Tropical Heat & Rain",
    "market_value": "₹1,00,000 - ₹2,00,000"
  }
};

function App() {
  // =========================
  // State Management
  // =========================
  const [currentView, setCurrentView] = useState("home"); 
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [lang, setLang] = useState('en'); 
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); 

  // --- Translation Helper ---
  const t = (key) => TRANSLATIONS[lang][key] || key;

  // =========================
  // Handlers
  // =========================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null); 
    setError(null);
  };

  const analyzeBreed = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await predictCow(image);

      if (data.error) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    const data = await getHistory();
    if(data) setHistory(data);
    setLoading(false);
  };

  const resetApp = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  // --- Navigation Functions ---
  const navigateToIdentify = () => {
    setCurrentView("identify");
    window.scrollTo(0, 0);
  };

  const navigateToHistory = () => {
    loadHistory(); 
    setCurrentView("history");
    window.scrollTo(0, 0);
  };

  const navigateToHome = () => {
    setCurrentView("home");
    window.scrollTo(0, 0);
  };

  const navigateToBreeds = () => {
    setCurrentView("breeds");
    setSelectedBreed(null); 
    window.scrollTo(0, 0);
  }

  const navigateToBreedDetail = (breedName) => {
    setSelectedBreed(breedName);
    setCurrentView("breed_detail");
    window.scrollTo(0, 0);
  }

  // =========================
  // UI Components (Views)
  // =========================

  // --- 1. The Home Page View ---
  const HomeView = () => (
    <motion.div variants={page} initial="hidden" animate="show" exit="exit">
      <div id="home" className="relative pt-24 pb-32 px-6 flex flex-col items-center justify-center text-center">
        {/* Animated Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none animate-pulse duration-[3000ms]" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-500/30 text-red-300 text-sm font-semibold mb-4 backdrop-blur-sm animate-bounce">
            <Sparkles size={16} /> Empowering Indian Dairy Farmers
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-2xl">
            {t('hero_title_1')} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 animate-gradient-x">
              {t('hero_title_2')}
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center pt-2">
             <div className="flex items-center gap-2 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50 backdrop-blur-md hover:bg-gray-800 transition duration-300 cursor-default">
                <CheckCircle size={20} className="text-green-500"/> {t('feature_instant')}
             </div>
             <div className="flex items-center gap-2 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50 backdrop-blur-md hover:bg-gray-800 transition duration-300 cursor-default">
                <CheckCircle size={20} className="text-green-500"/> {t('feature_db')}
             </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={navigateToIdentify}
              className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 rounded-full hover:from-red-500 hover:to-red-400 hover:scale-110 active:scale-95 shadow-lg shadow-red-600/30 ring-4 ring-transparent hover:ring-red-500/20"
            >
              <Camera className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              {t('btn_identify_cow')}
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer / Features Section */}
      <section className="py-20 bg-[#0E1117] border-t border-[#262730]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 bg-[#1E1F25]/60 backdrop-blur-md rounded-2xl border border-[#262730] hover:border-red-500/50 hover:bg-[#1E1F25] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-900/20">
              <div className="w-16 h-16 bg-red-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-red-500/20 group-hover:border-red-500/50">
                <Database className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-red-400 transition-colors">{t('feat_db_title')}</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{t('feat_db_desc')}</p>
            </div>

            <div className="group p-8 bg-[#1E1F25]/60 backdrop-blur-md rounded-2xl border border-[#262730] hover:border-blue-500/50 hover:bg-[#1E1F25] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20">
              <div className="w-16 h-16 bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-blue-500/20 group-hover:border-blue-500/50">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-blue-400 transition-colors">{t('feat_health_title')}</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{t('feat_health_desc')}</p>
            </div>

            <div className="group p-8 bg-[#1E1F25]/60 backdrop-blur-md rounded-2xl border border-[#262730] hover:border-green-500/50 hover:bg-[#1E1F25] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-900/20">
              <div className="w-16 h-16 bg-green-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-green-500/20 group-hover:border-green-500/50">
                <Shield className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-green-400 transition-colors">{t('feat_privacy_title')}</h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{t('feat_privacy_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );

  // --- 2. The Identify Page View ---
  const IdentifyView = () => (
    <motion.div variants={page} initial="hidden" animate="show" exit="exit">
      <div className="min-h-[80vh] py-12 px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Navigation Buttons Row */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <button 
              onClick={navigateToHome}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-[-4px]"
          >
              <ArrowLeft size={20} /> {t('back_home')}
          </button>

          <button 
              onClick={navigateToHistory}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#262730] hover:bg-[#3E404D] text-white rounded-lg border border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-500/30 active:scale-95"
          >
              <History size={18} /> {t('view_history')}
          </button>
        </div>

        <div className="w-full max-w-4xl bg-[#1E1F25]/80 backdrop-blur-xl border border-[#262730] rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/50 hover:shadow-red-900/5 transition-shadow duration-500">
          {!result ? (
            <div className="space-y-8">
              <div className="text-center">
                 <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{t('id_title')}</h2>
                 <p className="text-gray-400 text-lg">{t('id_subtitle')}</p>
              </div>

              {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-[#262730] border-dashed rounded-2xl cursor-pointer bg-[#0E1117] hover:bg-[#16181d] hover:border-red-500/50 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                    <div className="p-6 bg-[#1E1F25] rounded-full mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl border border-gray-700 group-hover:border-red-500/50">
                      <Upload className="w-12 h-12 text-gray-400 group-hover:text-red-500 transition-colors duration-300" />
                    </div>
                    <p className="mb-2 text-xl text-gray-400 group-hover:text-gray-200 transition-colors"><span className="font-bold text-white">{t('click_upload')}</span> {t('drag_drop')}</p>
                    <p className="text-sm text-gray-500 group-hover:text-gray-400">JPG, PNG (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative w-full h-96 bg-black/50 rounded-2xl overflow-hidden group border border-[#262730] shadow-inner">
                  <img src={preview} alt="Cow Preview" className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                  <button 
                    onClick={resetApp}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-red-600 p-3 rounded-full text-white transition-all duration-300 backdrop-blur-sm hover:scale-110 active:scale-90 shadow-lg"
                    title="Remove Image"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              )}

              <button
                onClick={analyzeBreed}
                disabled={!image || loading}
                className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                  !image || loading 
                    ? "bg-[#262730] text-gray-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-900/30 transform hover:-translate-y-1 hover:shadow-red-500/40 active:translate-y-0 active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <> <RefreshCw className="animate-spin" /> {t('analyzing')} </>
                ) : (
                  <> <Camera size={24} /> {t('btn_identify_now')} </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-200 animate-pulse">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500 space-y-8">
              <div className="flex justify-between items-start border-b border-[#262730] pb-6">
                 <div>
                    <h2 className="text-4xl font-extrabold text-white mb-1">{result.breed}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                        result.confidence > 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        <Activity size={14} /> {result.confidence.toFixed(1)}% {t('match')}
                      </span>
                    </div>
                 </div>
                <button 
                 onClick={resetApp} 
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-all duration-300 shadow-lg shadow-green-900/20 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                <RefreshCw size={16}/> {t('analyze_new')}
                </button>
              </div>

              {/* Description Box */}
              <div className="bg-[#0E1117]/50 p-6 rounded-2xl border border-[#262730] shadow-inner relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:h-full transition-all duration-300" />
                 <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                   <Info size={14}/> {t('breed_desc_label')}
                 </h3>
                 <p className="text-gray-200 italic text-base md:text-lg leading-relaxed">
                     "{result.description || BREED_DATA[result.breed]?.description || "Description not available for this breed."}"
                 </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                  <div className="h-80 bg-black rounded-2xl overflow-hidden border border-[#262730] shadow-2xl relative group">
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                       <img src={preview} alt="Result" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  </div>
                  
                  {/* --- METRICS SECTION --- */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Milk Yield */}
                    <div className="bg-[#0E1117] p-5 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-blue-500/50 transition-all duration-300 hover:bg-[#151921] group">
                      <div className="p-4 bg-blue-900/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-500/20">
                         <Droplet size={26} />
                      </div>
                      <div>
                         <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_milk')}</p>
                         <p className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{result.milk_yield || BREED_DATA[result.breed]?.milk_yield || "N/A"}</p>
                      </div>
                    </div>

                    {/* Fat Percentage */}
                    <div className="bg-[#0E1117] p-5 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-yellow-500/50 transition-all duration-300 hover:bg-[#151921] group">
                      <div className="p-4 bg-yellow-900/20 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform duration-300 ring-1 ring-yellow-500/20">
                         <Activity size={26} />
                      </div>
                      <div>
                         <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_fat')}</p>
                         <p className="text-xl font-bold text-white group-hover:text-yellow-200 transition-colors">{result.fat_percentage || BREED_DATA[result.breed]?.fat_percentage || "N/A"}</p>
                      </div>
                    </div>

                     {/* Climate Tolerance */}
                    <div className="bg-[#0E1117] p-5 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-orange-500/50 transition-all duration-300 hover:bg-[#151921] group">
                      <div className="p-4 bg-orange-900/20 rounded-xl text-orange-400 group-hover:scale-110 transition-transform duration-300 ring-1 ring-orange-500/20">
                         <Thermometer size={26} />
                      </div>
                      <div>
                         <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_climate')}</p>
                         <p className="text-xl font-bold text-white group-hover:text-orange-200 transition-colors">{result.climate_tolerance || BREED_DATA[result.breed]?.climate_tolerance || "N/A"}</p>
                      </div>
                    </div>

                    {/* Market Value */}
                    <div className="bg-[#0E1117] p-5 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-green-500/50 transition-all duration-300 hover:bg-[#151921] group">
                      <div className="p-4 bg-green-900/20 rounded-xl text-green-400 group-hover:scale-110 transition-transform duration-300 ring-1 ring-green-500/20">
                         <Banknote size={26} />
                      </div>
                      <div>
                         <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_value')}</p>
                         <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">{result.market_value || BREED_DATA[result.breed]?.market_value || "N/A"}</p>
                      </div>
                    </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-[#262730]">
                <PDFReport
                  breed={result.breed}
                  info={result}
                  image={image}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // --- 3. The History View ---
  const HistoryView = () => (
    <motion.div variants={page} initial="hidden" animate="show" exit="exit">
      <div className="min-h-[80vh] py-12 px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Back Button */}
          <button 
              onClick={navigateToIdentify}
              className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-x-1 self-start md:self-auto md:-ml-[600px]"
          >
              <ArrowLeft size={20} /> {t('back_identify')}
          </button>

          <div className="w-full max-w-5xl bg-[#1E1F25]/80 backdrop-blur-xl border border-[#262730] rounded-3xl p-8 md:p-10 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 border-b border-[#262730] pb-4">
                  <Database className="text-red-500" /> {t('db_history')}
              </h2>
              
              {loading ? (
                  <div className="text-center py-20 text-gray-500 animate-pulse">
                      <RefreshCw className="animate-spin inline-block mb-4 w-8 h-8" />
                      <p className="text-lg">{t('loading_db')}</p>
                  </div>
              ) : history.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-[#262730] rounded-2xl bg-[#0E1117]/50">
                      <p className="text-gray-400 text-lg">{t('no_history')}</p>
                  </div>
              ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#262730]">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-[#0E1117] border-b border-[#262730] text-gray-400 text-sm uppercase tracking-wider">
                                  <th className="p-5 font-bold">{t('col_breed')}</th>
                                  <th className="p-5 font-bold">{t('col_conf')}</th>
                                  <th className="p-5 font-bold hidden md:table-cell">{t('metric_milk')}</th>
                                  <th className="p-5 font-bold">{t('col_date')}</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-[#262730] bg-[#1E1F25]/40">
                              {history.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-[#2A2B35] transition-colors duration-200 group cursor-default">
                                      <td className="p-5 font-bold text-white flex items-center gap-3">
                                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-shadow"></div>
                                          {item.breed}
                                      </td>
                                      <td className="p-5">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                              item.confidence > 70 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                          }`}>
                                              {item.confidence}%
                                          </span>
                                      </td>
                                      <td className="p-5 text-gray-400 hidden md:table-cell">{item.milk_yield}</td>
                                      <td className="p-5 text-gray-500 text-sm">
                                          {new Date(item.timestamp).toLocaleDateString()} <span className="text-xs opacity-50 block mt-1">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      </div>
    </motion.div>
  );

  // --- 4. The Breeds View ---
  const BreedsView = () => (
    <motion.div variants={page} initial="hidden" animate="show" exit="exit">
      <div className="min-h-screen py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="max-w-7xl mx-auto mb-8">
              <button 
                  onClick={navigateToHome}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-x-1"
              >
                  <ArrowLeft size={20} /> {t('back_home')}
              </button>
          </div>

          <section id="encyclopedia" className="max-w-7xl mx-auto bg-[#1E1F25]/80 backdrop-blur-xl border border-[#262730] rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-5xl font-extrabold mb-4">{t('supported_breeds')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{t('breeds_highlight')}</span></h2>
                <p className="text-gray-400 text-xl max-w-2xl mx-auto">{t('breeds_subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Object.keys(BREED_DATA).sort().map((breed, index) => (
                  <div 
                    key={index} 
                    onClick={() => navigateToBreedDetail(breed)}
                    className="bg-[#0E1117] border border-[#262730] rounded-2xl overflow-hidden hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:-translate-y-2 shadow-lg hover:shadow-2xl hover:shadow-red-900/20 relative"
                  >
                  <div className="w-full h-48 bg-[#15171e] relative overflow-hidden">
                      <img 
                          src={`/breeds/${breed}.webp`} 
                          alt={breed}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                              if (e.target.src.includes('.webp')) {
                                  e.target.src = `/breeds/${breed}.jpg`;
                              } else {
                                  e.target.onerror = null; 
                                  e.target.src = "https://via.placeholder.com/300?text=No+Image"; 
                              }
                          }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-5 absolute bottom-0 left-0 w-full">
                      <h4 className="font-bold text-lg text-white truncate drop-shadow-md" title={breed}>{breed}</h4>
                      <div className="flex items-center text-xs text-red-400 mt-1 font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          {t('learn_more')} <ChevronRight size={14} className="ml-1" />
                      </div>
                  </div>
                  </div>
              ))}
              </div>
          </section>
      </div>
    </motion.div>
  );

  // --- 5. The Breed Detail View ---
  const BreedDetailView = () => {
    const data = BREED_DATA[selectedBreed];
    if (!data) return <div className="text-white text-center pt-20 text-xl">Breed data not found.</div>;

    const handleImageError = (e, breed) => {
        if (e.target.src.includes('.webp')) {
            e.target.src = `/breeds/${breed}.jpg`;
        } else {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/150?text=Cow";
        }
    };

    return (
      <motion.div variants={page} initial="hidden" animate="show" exit="exit">
        <div className="min-h-[80vh] py-12 px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <button 
            onClick={navigateToBreeds}
            className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-x-1 self-start md:self-auto md:-ml-[800px]"
          >
            <ArrowLeft size={20} /> {t('back_breeds')}
          </button>

          <div className="w-full max-w-5xl bg-[#1E1F25]/90 backdrop-blur-xl border border-[#262730] rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-72 md:h-96 w-full overflow-hidden group">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                
                <img 
                  src={`/breeds/${selectedBreed}.webp`} 
                  alt={selectedBreed}
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-60 scale-110"
                  onError={(e) => {
                      if (e.target.src.includes('.webp')) e.target.src = `/breeds/${selectedBreed}.jpg`;
                      else e.target.style.display = 'none';
                  }}
                />
                
                <div className="relative z-20 h-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 px-8 md:px-16 pt-10">
                  <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-red-500/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden bg-black shrink-0 relative group-hover:scale-105 transition-transform duration-500 ring-4 ring-white/10">
                    <img 
                      src={`/breeds/${selectedBreed}.webp`} 
                      alt={selectedBreed}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, selectedBreed)}
                    />
                  </div>
                  
                  <div className="text-center md:text-left space-y-4">
                      <h2 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg tracking-tight">{selectedBreed}</h2>
                      <span className="text-gray-100 text-sm font-bold bg-gradient-to-r from-red-600 to-red-500 px-4 py-1.5 rounded-full inline-block border border-red-400/30 shadow-lg uppercase tracking-wider">
                        {t('profile_tag')}
                      </span>
                  </div>
                </div>
            </div>

            <div className="p-8 md:p-12 space-y-10">
                <div className="bg-[#0E1117] p-8 rounded-2xl border border-[#262730] shadow-inner">
                  <h3 className="text-xl font-bold mb-4 text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <Info size={18} /> {t('desc_title')}
                  </h3>
                  <p className="text-gray-300 leading-loose text-lg font-light">
                      {data.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Milk Yield */}
                  <div className="bg-[#0E1117] p-6 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-blue-500/40 hover:bg-[#151921] transition-all duration-300 group">
                      <div className="p-4 bg-blue-900/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-900/20">
                        <Droplet size={28} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_milk')}</p>
                        <p className="text-2xl font-bold text-white group-hover:text-blue-100 transition-colors">{data.milk_yield}</p>
                      </div>
                  </div>

                  {/* Fat Percentage */}
                  <div className="bg-[#0E1117] p-6 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-yellow-500/40 hover:bg-[#151921] transition-all duration-300 group">
                      <div className="p-4 bg-yellow-900/20 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-900/20">
                        <Activity size={28} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_fat')}</p>
                        <p className="text-2xl font-bold text-white group-hover:text-yellow-100 transition-colors">{data.fat_percentage}</p>
                      </div>
                  </div>

                  {/* Climate Tolerance */}
                  <div className="bg-[#0E1117] p-6 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-orange-500/40 hover:bg-[#151921] transition-all duration-300 group">
                      <div className="p-4 bg-orange-900/20 rounded-xl text-orange-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-900/20">
                        <Thermometer size={28} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_climate')}</p>
                        <p className="text-2xl font-bold text-white group-hover:text-orange-100 transition-colors">{data.climate_tolerance}</p>
                      </div>
                  </div>

                  {/* Market Value */}
                  <div className="bg-[#0E1117] p-6 rounded-2xl border border-[#262730] flex items-center gap-5 hover:border-green-500/40 hover:bg-[#151921] transition-all duration-300 group">
                      <div className="p-4 bg-green-900/20 rounded-xl text-green-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-900/20">
                        <Banknote size={28} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('metric_value')}</p>
                        <p className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors">{data.market_value}</p>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // =========================
  // Main Render (Navbar & View Controller)
  // =========================
  return (
    <div className="relative min-h-screen bg-[#0E1117] text-white overflow-hidden selection:bg-red-500/30 selection:text-red-200">

      {/* 🌈 PREMIUM GRADIENT MESH BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-500/25 blur-[140px] rounded-full" />
        <div className="absolute top-20 right-[-200px] w-[600px] h-[600px] bg-orange-500/20 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-200px] left-1/3 w-[500px] h-[500px] bg-pink-500/20 blur-[160px] rounded-full" />
      </div>

      {/* --- Navbar --- */}
      <nav className="sticky top-0 z-50 bg-[#0E1117]/80 backdrop-blur-xl border-b border-[#262730] px-6 py-4 flex justify-between items-center transition-all duration-300 shadow-lg shadow-black/20">
        
        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={navigateToHome}>
          <span className="text-3xl bg-gray-800 rounded-full p-1 border border-gray-700 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-red-900/20">🐄</span>
          <h1 className="text-xl font-bold tracking-wide group-hover:text-red-400 transition-colors">
            {t('app_title')}
          </h1>
        </div>

        {/* RIGHT SIDE CONTROLS */}
        <div className="flex items-center gap-4">
            
            {/* NAV LINKS (Desktop) - Styled like Lang Button */}
            <div className="hidden md:flex gap-3">
                <button 
                    onClick={navigateToHome} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                        currentView === 'home' 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    <Home size={16} className={currentView === 'home' ? "text-white" : "text-red-500"} />
                    <span className="text-sm font-bold">{t('nav_home')}</span>
                </button>

                <button 
                    onClick={navigateToBreeds} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                        currentView === 'breeds' || currentView === 'breed_detail' 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    <Database size={16} className={currentView === 'breeds' ? "text-white" : "text-red-500"} />
                    <span className="text-sm font-bold">{t('nav_breeds')}</span>
                </button>
            </div>

            {/* LANGUAGE TOGGLE */}
            <div className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 px-4 py-2 rounded-xl border border-gray-700 hover:border-gray-500 transition-all duration-300 group cursor-pointer shadow-lg">
                 <Globe size={16} className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                 <select 
                   value={lang} 
                   onChange={(e) => setLang(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm font-bold text-gray-300 cursor-pointer focus:ring-0 uppercase"
                 >
                   <option value="en">ENG</option>
                   <option value="hi">HIN</option>
                   <option value="gu">GUJ</option>
                 </select>
            </div>
        </div>
      </nav>

      {/* --- View Switcher --- */}
      <AnimatePresence mode="wait">
        {currentView === "home" && <HomeView key="home" />}
        {currentView === "identify" && <IdentifyView key="identify" />}
        {currentView === "history" && <HistoryView key="history" />}
        {currentView === "breeds" && <BreedsView key="breeds" />}
        {currentView === "breed_detail" && <BreedDetailView key="detail" />}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="bg-[#0E1117] border-t border-[#262730] py-10 text-center text-gray-500 text-sm hover:text-gray-400 transition-colors">
        <p className="flex items-center justify-center gap-2">
            © 2024 {t('app_title')}. <span className="hidden md:inline">Empowering Dairy Farmers.</span>
        </p>
      </footer>

    </div>
  );
}

export default App;