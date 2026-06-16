/* ============================ KUT — premium food tracker ============================ */
"use strict";

/* ---------- CONFIG ---------- *
 * Set CLOUD_BASE to your deployed backend URL (e.g. https://kut-xyz.vercel.app)
 * to enable AI photo, USDA micros, web push, Whoop & Apple Health sync.
 * Leave "" to run fully local (built-in DB + Open Food Facts search still work). */
let CLOUD_BASE = ""; // overridden by Settings if user sets it

/* ---------- Nutrient reference (NIH/USDA DRI, adult) ---------- */
const VITAMINS = [
  {k:"vitA",name:"Vitamin A",rda:900,ul:3000,unit:"mcg"},
  {k:"vitC",name:"Vitamin C",rda:90,ul:2000,unit:"mg"},
  {k:"vitD",name:"Vitamin D",rda:600,ul:4000,unit:"IU"},
  {k:"vitE",name:"Vitamin E",rda:15,ul:1000,unit:"mg"},
  {k:"vitK",name:"Vitamin K",rda:120,unit:"mcg"},
  {k:"b1",name:"B1 (Thiamine)",rda:1.2,unit:"mg"},
  {k:"b2",name:"B2 (Riboflavin)",rda:1.3,unit:"mg"},
  {k:"b3",name:"B3 (Niacin)",rda:16,ul:35,unit:"mg"},
  {k:"b5",name:"B5 (Pantothenic Acid)",rda:5,unit:"mg"},
  {k:"b6",name:"B6 (Pyridoxine)",rda:1.3,ul:100,unit:"mg"},
  {k:"b12",name:"B12 (Cobalamin)",rda:2.4,unit:"mcg"},
  {k:"folate",name:"Folate",rda:400,ul:1000,unit:"mcg"},
  {k:"choline",name:"Choline",rda:550,ul:3500,unit:"mg"}
];
const MINERALS = [
  {k:"calcium",name:"Calcium",rda:1000,ul:2500,unit:"mg"},
  {k:"copper",name:"Copper",rda:0.9,ul:10,unit:"mg"},
  {k:"iron",name:"Iron",rda:8,ul:45,unit:"mg"},
  {k:"magnesium",name:"Magnesium",rda:400,unit:"mg"},
  {k:"manganese",name:"Manganese",rda:2.3,ul:11,unit:"mg"},
  {k:"phosphorus",name:"Phosphorus",rda:700,ul:4000,unit:"mg"},
  {k:"potassium",name:"Potassium",rda:3400,unit:"mg"},
  {k:"selenium",name:"Selenium",rda:55,ul:400,unit:"mcg"},
  {k:"sodium",name:"Sodium",rda:1500,ul:2300,unit:"mg"},
  {k:"zinc",name:"Zinc",rda:11,ul:40,unit:"mg"}
];
/* tracked health metrics (per day) */
const METRICS = {
  fiber:{name:"Fiber",goal:30,unit:"g",dir:"up"},
  sugar:{name:"Total sugar",goal:50,metabolic:36,unit:"g",dir:"down"},
  satfat:{name:"Saturated fat",goal:20,unit:"g",dir:"down"},
  sodium:{name:"Sodium",goal:2300,unit:"mg",dir:"down"},
  cholesterol:{name:"Cholesterol",goal:300,unit:"mg",dir:"down"}
};
const HEALTH_TAGS=["Brainpower","Muscle","Skin","Sleep","Energy","Bones","Immune","Hormones"];

/* ---------- Food database: values PER 100 g. defG = default serving grams ---------- *
 * m = micros/metrics per 100g. Keys match VITAMINS/MINERALS/METRICS above. */
const FOODDB = [
 // ----- Meats -----
 {n:"Chicken Breast (cooked)",cat:"me",defG:120,k:165,p:31,c:0,f:3.6,m:{b3:13.7,b6:0.9,phosphorus:228,selenium:27,potassium:256,zinc:1,satfat:1,cholesterol:85,sodium:74}},
 {n:"Chicken Thigh (cooked)",cat:"me",defG:120,k:209,p:26,c:0,f:11,m:{b3:6,zinc:2.2,selenium:24,satfat:3,cholesterol:95,sodium:88}},
 {n:"Turkey Breast (cooked)",cat:"me",defG:120,k:135,p:30,c:0,f:1,m:{b3:10,b6:0.8,selenium:31,phosphorus:230,zinc:1.5,satfat:0.3,cholesterol:70,sodium:55}},
 {n:"Ground Beef 85% (cooked)",cat:"me",defG:113,k:250,p:26,c:0,f:15,m:{b12:2.6,zinc:6,iron:2.5,b6:0.4,selenium:18,phosphorus:200,b3:5,satfat:6,cholesterol:88,sodium:75}},
 {n:"Beef Sirloin (cooked)",cat:"me",defG:113,k:206,p:27,c:0,f:10,m:{b12:1.5,zinc:5,iron:2.3,selenium:30,satfat:4,cholesterol:80,sodium:55}},
 {n:"Bison (cooked)",cat:"me",defG:113,k:143,p:28,c:0,f:2.4,m:{b12:2.7,zinc:5,iron:3,selenium:35,satfat:1,cholesterol:82,sodium:60}},
 {n:"Venison (cooked)",cat:"me",defG:113,k:158,p:30,c:0,f:3.2,m:{b12:2.7,iron:4,zinc:4.5,b3:7,phosphorus:230,satfat:1.3,cholesterol:95,sodium:54}},
 {n:"Pork Chop (cooked)",cat:"me",defG:120,k:231,p:26,c:0,f:14,m:{b1:0.7,b6:0.5,b12:0.6,selenium:38,phosphorus:220,zinc:2.4,b3:7,satfat:5,cholesterol:78,sodium:62}},
 {n:"Bacon (cooked)",cat:"me",defG:24,k:541,p:37,c:1.4,f:42,m:{satfat:14,cholesterol:110,sodium:1717,selenium:46}},
 {n:"Lamb (cooked)",cat:"me",defG:113,k:258,p:25,c:0,f:17,m:{b12:2.6,zinc:4,iron:1.9,satfat:7,cholesterol:97,sodium:72}},
 {n:"Ham (sliced)",cat:"me",defG:56,k:145,p:21,c:1.5,f:6,m:{sodium:1200,b1:0.6,selenium:18,satfat:2,cholesterol:53}},
 {n:"Pork Sausage (cooked)",cat:"me",defG:75,k:301,p:18,c:2,f:25,m:{satfat:9,cholesterol:71,sodium:740,b12:1}},
 {n:"Duck (cooked)",cat:"me",defG:113,k:337,p:19,c:0,f:28,m:{iron:2.7,zinc:1.9,satfat:10,cholesterol:84,sodium:59}},
 // ----- Fish/seafood -----
 {n:"Salmon (cooked)",cat:"fi",defG:113,k:206,p:22,c:0,f:13,m:{vitD:526,b12:3.2,b3:8.5,b6:0.6,selenium:36,potassium:384,phosphorus:252,satfat:3,cholesterol:63,sodium:61}},
 {n:"Tuna (canned, water)",cat:"fi",defG:100,k:116,p:26,c:0,f:0.8,m:{b12:2.5,vitD:50,selenium:80,b3:13,phosphorus:217,potassium:237,cholesterol:36,sodium:247}},
 {n:"Tilapia (cooked)",cat:"fi",defG:113,k:129,p:26,c:0,f:2.7,m:{b12:1.9,selenium:54,phosphorus:204,potassium:380,cholesterol:57,sodium:56}},
 {n:"Shrimp (cooked)",cat:"fi",defG:85,k:99,p:24,c:0.2,f:0.3,m:{b12:1.5,selenium:40,phosphorus:240,zinc:1.6,copper:0.2,iron:0.5,cholesterol:189,sodium:111}},
 {n:"Cod (cooked)",cat:"fi",defG:113,k:105,p:23,c:0,f:0.9,m:{b12:1.1,selenium:38,phosphorus:117,potassium:244,cholesterol:55,sodium:78}},
 {n:"Sardines (canned)",cat:"fi",defG:92,k:208,p:25,c:0,f:11,m:{vitD:193,b12:8.9,calcium:382,selenium:53,cholesterol:142,sodium:307,satfat:1.5}},
 // ----- Eggs & dairy -----
 {n:"Egg (whole)",cat:"eg",defG:50,k:143,p:13,c:1.1,f:9.5,m:{vitA:160,vitD:88,b2:0.5,b12:1.1,choline:294,selenium:31,phosphorus:198,satfat:3,cholesterol:372,sodium:142}},
 {n:"Egg White",cat:"eg",defG:33,k:52,p:11,c:0.7,f:0.2,m:{b2:0.4,selenium:20,potassium:163,sodium:166}},
 {n:"Milk 2%",cat:"da",defG:244,k:50,p:3.3,c:4.8,f:2,m:{calcium:120,vitD:49,b12:0.5,b2:0.17,phosphorus:92,potassium:140,satfat:1.3,cholesterol:8,sugar:4.8}},
 {n:"Whole Milk",cat:"da",defG:244,k:61,p:3.2,c:4.8,f:3.3,m:{calcium:113,vitD:51,b12:0.5,phosphorus:84,potassium:132,satfat:1.9,cholesterol:10,sugar:4.8}},
 {n:"Skim Milk",cat:"da",defG:244,k:34,p:3.4,c:5,f:0.1,m:{calcium:122,vitD:50,b12:0.5,potassium:156,sugar:5}},
 {n:"Greek Yogurt (plain, nonfat)",cat:"da",defG:170,k:59,p:10,c:3.6,f:0.4,m:{calcium:110,b12:0.75,b2:0.27,phosphorus:135,potassium:141,zinc:0.6,sugar:3.2}},
 {n:"Yogurt (whole)",cat:"da",defG:170,k:61,p:3.5,c:4.7,f:3.3,m:{calcium:121,b12:0.4,phosphorus:95,potassium:155,satfat:2,sugar:4.7}},
 {n:"Cheddar Cheese",cat:"da",defG:28,k:403,p:25,c:1.3,f:33,m:{calcium:721,vitA:265,b12:0.8,phosphorus:512,zinc:3.1,satfat:19,cholesterol:99,sodium:653}},
 {n:"Mozzarella",cat:"da",defG:28,k:280,p:28,c:3.1,f:17,m:{calcium:505,phosphorus:354,zinc:2.9,satfat:10,cholesterol:54,sodium:627}},
 {n:"Cottage Cheese (low-fat)",cat:"da",defG:113,k:98,p:11,c:3.4,f:4.3,m:{calcium:83,b12:0.4,phosphorus:159,selenium:9,satfat:2,cholesterol:17,sodium:364}},
 {n:"Butter",cat:"fa",defG:14,k:717,p:0.9,c:0.1,f:81,m:{vitA:684,satfat:51,cholesterol:215,sodium:11}},
 {n:"Cream Cheese",cat:"da",defG:30,k:342,p:6,c:4,f:34,m:{vitA:308,satfat:19,cholesterol:101,sodium:321}},
 {n:"Parmesan",cat:"da",defG:15,k:431,p:38,c:4,f:29,m:{calcium:1184,phosphorus:694,satfat:19,cholesterol:88,sodium:1529}},
 // ----- Fruits -----
 {n:"Banana",cat:"fr",defG:118,k:89,p:1.1,c:23,f:0.3,m:{potassium:358,vitC:8.7,b6:0.4,magnesium:27,manganese:0.27,fiber:2.6,sugar:12}},
 {n:"Apple",cat:"fr",defG:182,k:52,p:0.3,c:14,f:0.2,m:{vitC:4.6,potassium:107,fiber:2.4,sugar:10}},
 {n:"Orange",cat:"fr",defG:131,k:47,p:0.9,c:12,f:0.1,m:{vitC:53,folate:30,potassium:181,calcium:40,fiber:2.4,sugar:9}},
 {n:"Strawberries",cat:"fr",defG:144,k:32,p:0.7,c:7.7,f:0.3,m:{vitC:59,folate:24,potassium:153,manganese:0.39,fiber:2,sugar:4.9}},
 {n:"Blueberries",cat:"fr",defG:148,k:57,p:0.7,c:14,f:0.3,m:{vitC:9.7,vitK:19,manganese:0.34,fiber:2.4,sugar:10}},
 {n:"Grapes",cat:"fr",defG:151,k:69,p:0.7,c:18,f:0.2,m:{vitK:14.6,potassium:191,vitC:3.2,fiber:0.9,sugar:16}},
 {n:"Watermelon",cat:"fr",defG:152,k:30,p:0.6,c:8,f:0.2,m:{vitC:8.1,vitA:28,potassium:112,sugar:6.2}},
 {n:"Pineapple",cat:"fr",defG:165,k:50,p:0.5,c:13,f:0.1,m:{vitC:48,manganese:0.9,fiber:1.4,sugar:10}},
 {n:"Mango",cat:"fr",defG:165,k:60,p:0.8,c:15,f:0.4,m:{vitC:36,vitA:54,folate:43,fiber:1.6,sugar:14}},
 {n:"Avocado",cat:"fr",defG:100,k:160,p:2,c:9,f:15,m:{vitK:21,folate:81,potassium:485,vitC:10,vitE:2.1,magnesium:29,fiber:7,satfat:2.1}},
 {n:"Peach",cat:"fr",defG:150,k:39,p:0.9,c:10,f:0.3,m:{vitC:6.6,vitA:16,potassium:190,fiber:1.5,sugar:8.4}},
 {n:"Pear",cat:"fr",defG:178,k:57,p:0.4,c:15,f:0.1,m:{vitC:4.3,potassium:116,fiber:3.1,sugar:10}},
 {n:"Kiwi",cat:"fr",defG:75,k:61,p:1.1,c:15,f:0.5,m:{vitC:93,vitK:40,potassium:312,fiber:3,sugar:9}},
 {n:"Raspberries",cat:"fr",defG:123,k:52,p:1.2,c:12,f:0.7,m:{vitC:26,manganese:0.7,fiber:6.5,sugar:4.4}},
 {n:"Blackberries",cat:"fr",defG:144,k:43,p:1.4,c:10,f:0.5,m:{vitC:21,vitK:20,manganese:0.6,fiber:5.3,sugar:4.9}},
 // ----- Vegetables -----
 {n:"Broccoli (cooked)",cat:"ve",defG:91,k:34,p:2.8,c:7,f:0.4,m:{vitC:65,vitK:101,folate:108,potassium:293,calcium:47,vitA:31,fiber:2.6}},
 {n:"Spinach (raw)",cat:"ve",defG:30,k:23,p:2.9,c:3.6,f:0.4,m:{vitK:483,vitA:469,folate:194,vitC:28,iron:2.7,magnesium:79,potassium:558,fiber:2.2}},
 {n:"Carrot",cat:"ve",defG:61,k:41,p:0.9,c:10,f:0.2,m:{vitA:835,vitK:13,potassium:320,vitC:5.9,fiber:2.8}},
 {n:"Sweet Potato (baked)",cat:"ve",defG:130,k:90,p:2,c:21,f:0.1,m:{vitA:961,vitC:20,potassium:475,manganese:0.5,b6:0.29,fiber:3.3}},
 {n:"Potato (baked)",cat:"ve",defG:173,k:93,p:2.5,c:21,f:0.1,m:{vitC:9.6,potassium:535,b6:0.3,magnesium:28,fiber:2.2}},
 {n:"Tomato",cat:"ve",defG:123,k:18,p:0.9,c:3.9,f:0.2,m:{vitC:14,vitA:42,potassium:237,vitK:7.9,fiber:1.2}},
 {n:"Cucumber",cat:"ve",defG:104,k:15,p:0.7,c:3.6,f:0.1,m:{vitK:16,potassium:147,vitC:2.8}},
 {n:"Bell Pepper",cat:"ve",defG:119,k:31,p:1,c:6,f:0.3,m:{vitC:128,vitA:157,b6:0.29,folate:46,vitE:1.6,fiber:2.1}},
 {n:"Onion",cat:"ve",defG:110,k:40,p:1.1,c:9,f:0.1,m:{vitC:7.4,b6:0.12,potassium:146,fiber:1.7}},
 {n:"Kale (raw)",cat:"ve",defG:67,k:49,p:4.3,c:9,f:0.9,m:{vitK:390,vitA:500,vitC:120,calcium:150,potassium:491,fiber:3.6}},
 {n:"Green Beans (cooked)",cat:"ve",defG:125,k:35,p:1.9,c:7.9,f:0.3,m:{vitK:48,vitC:9.7,folate:33,potassium:240,fiber:3.2}},
 {n:"Cauliflower",cat:"ve",defG:107,k:25,p:1.9,c:5,f:0.3,m:{vitC:48,vitK:15,folate:57,potassium:299,fiber:2}},
 {n:"Mushrooms",cat:"ve",defG:70,k:22,p:3.1,c:3.3,f:0.3,m:{b3:3.6,b5:1.5,selenium:9,potassium:318,b2:0.4}},
 {n:"Asparagus (cooked)",cat:"ve",defG:90,k:22,p:2.4,c:4.1,f:0.2,m:{vitK:50,folate:149,vitA:50,vitC:7.7,fiber:2}},
 {n:"Corn (cooked)",cat:"ve",defG:154,k:96,p:3.4,c:21,f:1.5,m:{vitC:5.5,folate:42,potassium:218,magnesium:26,fiber:2.4,sugar:4.5}},
 {n:"Green Peas (cooked)",cat:"ve",defG:160,k:84,p:5.4,c:16,f:0.2,m:{vitK:24,vitC:14,folate:65,iron:1.5,fiber:5.5,sugar:6}},
 {n:"Lettuce (romaine)",cat:"ve",defG:47,k:17,p:1.2,c:3.3,f:0.3,m:{vitK:103,vitA:436,folate:136,fiber:2.1}},
 // ----- Grains / carbs / breads -----
 {n:"White Rice (cooked)",cat:"gr",defG:158,k:130,p:2.7,c:28,f:0.3,m:{manganese:0.5,selenium:7.5,folate:58,iron:1.2,fiber:0.4}},
 {n:"Brown Rice (cooked)",cat:"gr",defG:158,k:123,p:2.7,c:26,f:1,m:{manganese:1.1,magnesium:39,selenium:5.8,phosphorus:103,b3:1.5,fiber:1.6}},
 {n:"Quinoa (cooked)",cat:"gr",defG:185,k:120,p:4.4,c:21,f:1.9,m:{manganese:0.6,magnesium:64,folate:42,iron:1.5,phosphorus:152,fiber:2.8}},
 {n:"Oats (dry)",cat:"gr",defG:40,k:389,p:17,c:66,f:7,m:{manganese:4.9,magnesium:177,phosphorus:523,iron:4.7,zinc:4,b1:0.76,fiber:10.6}},
 {n:"Pasta (cooked)",cat:"gr",defG:140,k:158,p:6,c:31,f:0.9,m:{selenium:26,manganese:0.3,folate:18,iron:0.5,fiber:1.8}},
 {n:"White Bread",cat:"br",defG:28,k:266,p:9,c:49,f:3.2,m:{selenium:28,manganese:0.5,folate:171,iron:3.6,calcium:144,sodium:490,fiber:2.7}},
 {n:"Whole Wheat Bread",cat:"br",defG:28,k:247,p:13,c:41,f:3.4,m:{manganese:2.3,selenium:31,magnesium:82,iron:2.5,fiber:7,sodium:450}},
 {n:"Bagel (plain)",cat:"br",defG:90,k:250,p:10,c:49,f:1.5,m:{selenium:30,folate:88,iron:3,manganese:0.5,sodium:430,fiber:2}},
 {n:"Flour Tortilla",cat:"br",defG:49,k:218,p:6,c:36,f:5,m:{calcium:140,iron:3,selenium:14,sodium:480,fiber:2.3}},
 {n:"Couscous (cooked)",cat:"gr",defG:157,k:112,p:3.8,c:23,f:0.2,m:{selenium:28,folate:15,manganese:0.08,fiber:1.4}},
 {n:"Corn Flakes Cereal",cat:"gr",defG:30,k:357,p:7,c:84,f:0.4,m:{iron:28,b6:5,folate:200,vitC:21,sugar:9,sodium:729,fiber:3}},
 {n:"Pancake",cat:"br",defG:77,k:227,p:6,c:28,f:9,m:{calcium:198,iron:1.7,sodium:439,satfat:2,sugar:6}},
 // ----- Legumes / nuts / seeds -----
 {n:"Black Beans (cooked)",cat:"le",defG:172,k:132,p:8.9,c:24,f:0.5,m:{folate:149,magnesium:70,iron:2.1,potassium:355,phosphorus:140,zinc:1.1,manganese:0.4,fiber:8.7}},
 {n:"Chickpeas (cooked)",cat:"le",defG:164,k:164,p:8.9,c:27,f:2.6,m:{folate:172,iron:2.9,magnesium:48,zinc:1.5,manganese:1,fiber:7.6}},
 {n:"Lentils (cooked)",cat:"le",defG:198,k:116,p:9,c:20,f:0.4,m:{folate:181,iron:3.3,potassium:369,magnesium:36,zinc:1.3,manganese:0.5,fiber:7.9}},
 {n:"Kidney Beans (cooked)",cat:"le",defG:177,k:127,p:8.7,c:23,f:0.5,m:{folate:130,iron:2.9,potassium:405,magnesium:45,fiber:6.4}},
 {n:"Almonds",cat:"nu",defG:28,k:579,p:21,c:22,f:50,m:{vitE:25.6,magnesium:270,manganese:2.2,calcium:269,phosphorus:481,b2:1.1,fiber:12.5,satfat:3.8}},
 {n:"Peanuts",cat:"nu",defG:28,k:567,p:26,c:16,f:49,m:{b3:12,vitE:8.3,magnesium:168,folate:240,manganese:1.9,fiber:8.5,satfat:6.3}},
 {n:"Walnuts",cat:"nu",defG:28,k:654,p:15,c:14,f:65,m:{manganese:3.4,magnesium:158,copper:1.6,vitE:0.7,fiber:6.7,satfat:6.1}},
 {n:"Cashews",cat:"nu",defG:28,k:553,p:18,c:30,f:44,m:{magnesium:292,copper:2.2,zinc:5.8,iron:6.7,manganese:1.7,fiber:3.3,satfat:7.8}},
 {n:"Peanut Butter",cat:"nu",defG:32,k:588,p:25,c:20,f:50,m:{vitE:9,b3:13,magnesium:154,potassium:649,manganese:1.5,fiber:6,satfat:10,sodium:459}},
 {n:"Chia Seeds",cat:"nu",defG:28,k:486,p:17,c:42,f:31,m:{calcium:631,magnesium:335,phosphorus:860,iron:7.7,fiber:34}},
 // ----- Oils / fats -----
 {n:"Olive Oil",cat:"fa",defG:14,k:884,p:0,c:0,f:100,m:{vitE:14,vitK:60,satfat:14}},
 {n:"Coconut Oil",cat:"fa",defG:14,k:862,p:0,c:0,f:100,m:{satfat:87}},
 {n:"Vegetable Oil",cat:"fa",defG:14,k:884,p:0,c:0,f:100,m:{vitE:15,satfat:15}},
 {n:"Avocado Oil",cat:"fa",defG:14,k:884,p:0,c:0,f:100,m:{vitE:13,satfat:12}},
 {n:"Mayonnaise",cat:"fa",defG:13,k:680,p:1,c:0.6,f:75,m:{vitK:73,satfat:12,cholesterol:42,sodium:635}},
 // ----- Beverages / other -----
 {n:"Coffee (black)",cat:"be",defG:240,k:1,p:0.1,c:0,f:0,m:{potassium:49,b2:0.08,magnesium:3}},
 {n:"Orange Juice",cat:"be",defG:248,k:45,p:0.7,c:10,f:0.2,m:{vitC:50,folate:30,potassium:200,sugar:8.4}},
 {n:"Cola",cat:"be",defG:248,k:42,p:0,c:11,f:0,m:{sugar:11,sodium:4}},
 {n:"Beer",cat:"be",defG:356,k:43,p:0.5,c:3.6,f:0,m:{sodium:4,potassium:27}},
 {n:"Whey Protein Powder",cat:"ot",defG:31,k:400,p:80,c:10,f:6.7,m:{calcium:500,b12:3,phosphorus:300,sodium:300,sugar:5}},
 {n:"Honey",cat:"sw",defG:21,k:304,p:0.3,c:82,f:0,m:{sugar:82,potassium:52}},
 {n:"Dark Chocolate 70%",cat:"sw",defG:28,k:546,p:4.9,c:61,f:31,m:{iron:8,magnesium:146,copper:1.8,manganese:1.9,potassium:559,fiber:7,satfat:18,sugar:24}},
 {n:"Hummus",cat:"le",defG:30,k:166,p:8,c:14,f:10,m:{folate:83,iron:2.4,magnesium:71,manganese:0.6,fiber:6,sodium:379}},
 {n:"Granola",cat:"gr",defG:55,k:471,p:10,c:64,f:20,m:{iron:3,magnesium:90,manganese:2,fiber:7,sugar:24,satfat:3}},
 {n:"Ketchup",cat:"ot",defG:17,k:101,p:1,c:27,f:0.1,m:{sodium:907,sugar:22,potassium:281}}
];

/* ---------- Activity & goals ---------- */
const ACTIVITY = {
  sed:{label:"Sedentary",f:1.2,d:"Little/no exercise"},
  light:{label:"Light",f:1.375,d:"1–3 days/wk"},
  mod:{label:"Moderate",f:1.55,d:"3–5 days/wk"},
  high:{label:"Very active",f:1.725,d:"6–7 days/wk"},
  ath:{label:"Athlete",f:1.9,d:"2x/day, hard training"}
};

/* ---------- State ---------- */
const LS="kut_state_v2";
let S = load();
function load(){try{const r=JSON.parse(localStorage.getItem(LS));if(r&&r.profile)return r;}catch(e){}return null;}
function save(){if(S)localStorage.setItem(LS,JSON.stringify(S));}

/* Mifflin-St Jeor BMR + activity -> TDEE; deficit from cut goal */
function mifflin(sex,kg,cm,age){return 10*kg+6.25*cm-5*age+(sex==="m"?5:-161);}
function computeTargets(p){
  const bmr=mifflin(p.sex,p.kg,p.cm,p.age);
  const tdee=Math.round(bmr*ACTIVITY[p.activity].f);
  let cal=tdee, deficit=0;
  if(p.goal==="lose"){
    const totalDef=(p.lossLb||10)*3500;            // 3500 kcal ~ 1 lb fat
    deficit=Math.round(totalDef/((p.weeks||12)*7));
    deficit=Math.min(deficit,Math.round(tdee*0.25)); // cap at 25% deficit (safe)
    cal=tdee-deficit;
    const floor=p.sex==="m"?1500:1200; cal=Math.max(cal,floor);
  } else if(p.goal==="gain"){ cal=tdee+Math.round((p.surplus||350)); }
  const sp=p.split||{p:35,c:35,f:30};
  return {
    tdee,bmr:Math.round(bmr),deficit,cal,
    p:Math.round(cal*sp.p/100/4), c:Math.round(cal*sp.c/100/4), f:Math.round(cal*sp.f/100/9),
    split:sp
  };
}

/* ---------- Date helpers ---------- */
let viewDate=new Date();
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function todayKey(){return ymd(new Date());}
function dateKey(){return ymd(viewDate);}
function dayEntries(key){key=key||dateKey();return S.log[key]||[];}
function fmtDateLong(d){return d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});}

/* ---------- Totals & scaling ----------
 * entry = {n,cat,meal,perK,perP,perC,perF,perM:{},qty,unit,src,photo}
 * actual = per* × qty */
function entryK(e){return e.perK*e.qty;}
function totals(key){
  const e=dayEntries(key);const t={k:0,p:0,c:0,f:0,m:{}};
  e.forEach(x=>{const q=x.qty||1;t.k+=x.perK*q;t.p+=x.perP*q;t.c+=x.perC*q;t.f+=x.perF*q;
    if(x.perM)for(const mk in x.perM)t.m[mk]=(t.m[mk]||0)+x.perM[mk]*q;});
  return t;
}
function dbToEntry(f,grams,meal){
  const r=grams/100;
  const perM={};if(f.m)for(const k in f.m)perM[k]=f.m[k]/100;
  return {n:f.n,cat:f.cat,meal:meal||guessMeal(),perK:f.k/100,perP:f.p/100,perC:f.c/100,perF:f.f/100,perM,qty:grams,unit:"g",src:"db"};
}
function guessMeal(){const h=new Date().getHours();return h<11?"Breakfast":h<15?"Lunch":h<21?"Dinner":"Snack";}

/* ---------- Activity / calorie adjustment from wearables ---------- */
function burnAdjust(key){key=key||dateKey();const w=(S.wear&&S.wear[key])||0;return Math.round(w);} // extra kcal burned today
function calTarget(key){return S.targets.cal + (S.profile.adjust?burnAdjust(key):0);}

/* ---------- Streak ---------- */
function streak(){let s=0;let d=new Date();for(let i=0;i<400;i++){const k=ymd(d);if((S.log[k]||[]).length>0){s++;d.setDate(d.getDate()-1);}else{if(i===0){d.setDate(d.getDate()-1);continue;}break;}}return s;}

/* ---------- tiny SVG icon set (no emojis) ---------- */
const IC={
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
 edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h3l2-2h8l2 2h3v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 barcode:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5v14M7 5v14M11 5v10M11 17v2M15 5v14M19 5v14"/></svg>',
 label:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
 target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6M10 21h4"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 watch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M9 7l.5-3h5L15 7M9 17l.5 3h5l.5-3"/></svg>',
 scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8l2 4H10z"/></svg>',
 water:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3s6 6 6 11a6 6 0 01-12 0c0-5 6-11 6-11z"/></svg>',
 chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16l4-5 3 3 5-7"/></svg>',
 cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 01-.8-7.9 5 5 0 019.6-1.4A3.5 3.5 0 1117.5 18z"/></svg>',
 down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
};
function fiLetter(n){return (n||"?").trim()[0].toUpperCase();}

/* ===================== RENDER ===================== */
let activeNav="home";
function render(){
  renderTopbar();
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.nav===activeNav));
  const sc=document.getElementById("screen");sc.className="fade-in";
  if(activeNav==="home")sc.innerHTML=homeHTML();
  else if(activeNav==="diary")sc.innerHTML=diaryHTML();
  else if(activeNav==="meals")sc.innerHTML=mealsHTML();
  else if(activeNav==="profile")sc.innerHTML=profileHTML();
  postRender();save();
}
function renderTopbar(){
  const tb=document.getElementById("topbar");
  if(activeNav==="home"||activeNav==="diary"){
    tb.innerHTML=`<div class="brand"><div class="brand-name">Kut</div><div class="streak-pill">${streak()} day streak</div></div>
      <div class="subhead">${fmtDateLong(viewDate)}</div>${weekHTML()}`;
    bindWeek();
  }else{
    const titles={meals:["Meals","Save & reuse your go-to meals"],profile:["Profile","Goals, sync, reminders & data"]};
    const[t,s]=titles[activeNav];
    tb.innerHTML=`<div class="brand"><div class="brand-name">${t}</div></div><div class="subhead">${s}</div>`;
  }
}
function weekHTML(){
  let h='<div class="week">';const base=new Date(viewDate);const sun=new Date(base);sun.setDate(base.getDate()-base.getDay());
  const L=["S","M","T","W","T","F","S"];
  for(let i=0;i<7;i++){const d=new Date(sun);d.setDate(sun.getDate()+i);const k=ymd(d);
    h+=`<button class="day${k===dateKey()?" active":""}${k===todayKey()?" today":""}" data-d="${k}"><div class="dow">${L[i]}</div><div class="dnum">${d.getDate()}</div></button>`;}
  return h+"</div>";
}
function bindWeek(){document.querySelectorAll(".day").forEach(b=>b.onclick=()=>{const[y,m,da]=b.dataset.d.split("-");viewDate=new Date(y,m-1,da);render();});}

function ring(consumed,target){
  const R=92,C=2*Math.PI*R;const pct=target>0?Math.min(consumed/target,1):0;const off=C*(1-pct);
  const over=consumed>target;const left=Math.round(target-consumed);
  return `<div class="ring-wrap"><svg viewBox="0 0 208 208" width="208" height="208">
    <circle cx="104" cy="104" r="${R}" fill="none" stroke="var(--gray-200)" stroke-width="16"/>
    <circle cx="104" cy="104" r="${R}" fill="none" stroke="${over?'var(--carb)':'var(--green-2)'}" stroke-width="16" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 104 104)" style="transition:stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"/></svg>
    <div class="ring-center"><div class="big">${Math.abs(left)}</div><div class="lbl">${left>=0?"Calories left":"Over budget"}</div></div></div>`;
}

/* ---------- HOME ---------- */
const MEALS=[{k:"Breakfast"},{k:"Lunch"},{k:"Dinner"},{k:"Snack"}];
function homeHTML(){
  const t=totals();const tg=S.targets;const adj=S.profile.adjust?burnAdjust():0;const calT=calTarget();
  const macro=(name,cls,val,tgt)=>{const pct=tgt>0?Math.min(val/tgt*100,100):0;
    return `<div class="macro"><div class="mk"><span class="dot-${cls}">● ${name}</span></div>
      <div class="mv">${Math.round(val)}<span>/${tgt}g</span></div><div class="track"><div class="fill fill-${cls}" style="width:${pct}%"></div></div></div>`;};
  return `<div class="page">
    <div class="card ring-card">${ring(t.k,calT)}
      <div class="ring-stats">
        <div class="ring-stat"><div class="v">${calT}</div><div class="k">Target</div></div>
        <div class="ring-stat"><div class="v">${Math.round(t.k)}</div><div class="k">Eaten</div></div>
        <div class="ring-stat"><div class="v">${dayEntries().length}</div><div class="k">Items</div></div>
      </div>
      ${adj>0?`<div class="adj">+${adj} kcal from activity today</div>`:""}
    </div>
    <div class="macros">${macro("Protein","p",t.p,tg.p)}${macro("Carbs","c",t.c,tg.c)}${macro("Fat","f",t.f,tg.f)}</div>
    <div class="micro-btns">
      <button class="micro-btn" data-micro="vit">Vitamins<span class="chev">›</span></button>
      <button class="micro-btn" data-micro="min">Minerals<span class="chev">›</span></button>
    </div>
    ${flagsHTML(t)}
    <div style="margin:18px 0 10px"><div class="chips">${HEALTH_TAGS.map(x=>`<div class="chip">${x}</div>`).join("")}</div></div>
    <div class="section-title">Today's food</div>
    ${dayMealsHTML()}
  </div>`;
}
function dayMealsHTML(){
  const e=dayEntries();
  if(e.length===0)return `<div class="empty">Nothing logged yet.<br>Tap <b>+</b> to add your first food.</div>`;
  let h="";
  MEALS.forEach(m=>{
    const items=e.map((x,i)=>({...x,i})).filter(x=>x.meal===m.k);if(!items.length)return;
    const cal=items.reduce((a,x)=>a+entryK(x),0);
    h+=`<div class="meal-group"><div class="meal-head"><div class="mt">${m.k}</div><div class="mc">${Math.round(cal)} cal</div></div>`;
    items.forEach(x=>{h+=`<div class="food-row" data-edit="${x.i}"><div class="fi cat-${x.cat||'ot'}">${fiLetter(x.n)}</div>
      <div class="fmeta"><div class="fn">${x.n}</div><div class="fs">${Math.round(x.qty)}${x.unit==='g'?' g':' × serving'}</div></div>
      <div class="fk">${Math.round(entryK(x))}<small>cal</small></div></div>`;});
    h+=`</div>`;
  });
  return h;
}

/* ---------- Health flags (general + metabolic) ---------- */
function flagsHTML(t){
  const m=t.m;const metabolic=S.profile.focus&&S.profile.focus.includes("metabolic");
  const out=[];
  const sugarLimit=metabolic?METRICS.sugar.metabolic:METRICS.sugar.goal;
  const checks=[
    {key:"sodium",val:m.sodium||0,limit:METRICS.sodium.goal,name:"Sodium",unit:"mg"},
    {key:"satfat",val:m.satfat||0,limit:METRICS.satfat.goal,name:"Saturated fat",unit:"g"},
    {key:"sugar",val:m.sugar||0,limit:sugarLimit,name:"Sugar",unit:"g"}
  ];
  checks.forEach(c=>{const r=c.val/c.limit;
    if(r>=1)out.push({cls:"bad",t:`${c.name} over limit`,b:`${Math.round(c.val)} / ${c.limit} ${c.unit} today.`});
    else if(r>=0.8)out.push({cls:"warn",t:`${c.name} getting high`,b:`${Math.round(c.val)} / ${c.limit} ${c.unit} — go easy.`});
  });
  const fiber=m.fiber||0;
  if(dayEntries().length>=3&&fiber<METRICS.fiber.goal*0.5)out.push({cls:"warn",t:"Low on fiber",b:`${Math.round(fiber)} / ${METRICS.fiber.goal} g — add fruit, veg or beans.`});
  const t2=totals();if(t2.p>=S.targets.p)out.push({cls:"good",t:"Protein goal hit",b:`Great for a cut — keeps muscle while you lose fat.`});
  if(out.length===0)return "";
  return `<div class="flags">${out.slice(0,3).map(f=>`<div class="flag ${f.cls==='good'?'':f.cls}"><div><div class="ft">${f.t}</div><div class="fb">${f.b}</div></div></div>`).join("")}</div>`;
}

/* ---------- DIARY ---------- */
function diaryHTML(){
  const t=totals();const calT=calTarget();const m=t.m;
  const metricRow=(key)=>{const meta=METRICS[key];const val=m[key]||0;const lim=key==='sugar'&&S.profile.focus&&S.profile.focus.includes('metabolic')?meta.metabolic:meta.goal;
    const pct=Math.min(val/lim*100,100);const over=val>lim&&meta.dir==='down';
    return `<div class="micro-row ${over?'over':''}"><div class="top"><span class="name">${meta.name}</span><span><span class="amt">${val.toFixed(0)}/${lim} ${meta.unit}</span><span class="pct" style="color:${over?'var(--red)':'var(--green-2)'}">${Math.round(val/lim*100)}%</span></span></div><div class="track"><div class="fill" style="width:${pct}%;background:${over?'var(--red)':'var(--green-2)'}"></div></div></div>`;};
  return `<div class="page">
    <div class="stat-grid">
      <div class="stat-c"><div class="sv">${Math.round(t.k)}</div><div class="sl">Calories eaten</div></div>
      <div class="stat-c"><div class="sv">${Math.max(0,Math.round(calT-t.k))}</div><div class="sl">Calories left</div></div>
      <div class="stat-c"><div class="sv">${Math.round(t.p)}g</div><div class="sl">Protein</div></div>
      <div class="stat-c"><div class="sv">${Math.round(t.c)}g</div><div class="sl">Carbs</div></div>
    </div>
    <div class="section-title" style="margin-top:20px">Health metrics</div>
    ${metricRow('fiber')}${metricRow('sugar')}${metricRow('satfat')}${metricRow('sodium')}
    <div class="section-title" style="margin-top:20px">Meals — ${fmtDateLong(viewDate)}</div>
    ${dayMealsHTML()}
  </div>`;
}

/* ---------- MICRO DETAIL ---------- */
function microHTML(type){
  const list=type==="vit"?VITAMINS:MINERALS;const t=totals();
  const rows=list.map(x=>{const have=t.m[x.k]||0;const pct=x.rda>0?have/x.rda*100:0;
    const overUL=x.ul&&have>x.ul;const color=overUL?'var(--red)':'var(--green-2)';
    return `<div class="micro-row"><div class="top"><span class="name">${x.name}${overUL?' ⚠':''}</span>
      <span><span class="amt">${have.toFixed(1)}/${x.rda} ${x.unit}</span><span class="pct" style="color:${color}">${Math.round(pct)}%</span></span></div>
      <div class="track"><div class="fill" style="width:${Math.min(pct,100)}%;background:${color}"></div></div></div>`;}).join("");
  return rows+`<div class="disclaimer">Estimated from your logged foods${CLOUD_BASE?' and USDA data':''}. Missing data may affect accuracy. Not medical advice. ⚠ = above safe upper limit. Targets: NIH/USDA DRI (adult).</div>`;
}

/* ---------- MEALS TAB ---------- */
function mealsHTML(){
  const meals=S.meals||[];
  let list = meals.length===0
    ? `<div class="empty">No saved meals yet.<br>Build a meal once, then add it to any day in one tap.</div>`
    : meals.map(meal=>{
        const cal=meal.items.reduce((a,x)=>a+x.perK*x.qty,0);
        const names=meal.items.map(x=>x.n).join(", ");
        return `<div class="food-row" data-meal="${meal.id}"><div class="fi cat-ot">${fiLetter(meal.name)}</div>
          <div class="fmeta"><div class="fn">${meal.name}</div><div class="fs">${meal.items.length} items · ${names}</div></div>
          <div class="fk">${Math.round(cal)}<small>cal</small></div></div>`;
      }).join("");
  return `<div class="page">
    <button class="btn green" id="newMeal" style="margin-bottom:14px">+ Create a meal</button>
    <div class="section-title">Your saved meals</div>
    ${list}
    <div class="cloud-banner">Tip: on the Diary or Home screen you can also save a whole day's meal group as a reusable meal.</div>
  </div>`;
}

/* ---------- PROFILE ---------- */
function profileHTML(){
  const p=S.profile,n=S.notif,tg=S.targets;
  const initials=(p.name||"You").trim().slice(0,2).toUpperCase();
  const w=S.wear||{};const lastW=w[todayKey()];
  return `<div class="page">
    <div class="prof-head"><div class="prof-av">${initials}</div>
      <div><div class="pn">${p.name||"You"}</div><div class="pg">${({lose:"Losing weight",maintain:"Maintaining",gain:"Building muscle",track:"Tracking"})[p.goal]||"Tracking"} · ${tg.cal} cal/day</div></div></div>

    <div class="section-title" style="margin-top:18px">Targets</div>
    <div class="list-card">
      <div class="li" data-act="goals"><div class="li-ic">${IC.target}</div><div class="li-t">Calories & goal</div><div class="li-v">${tg.cal} cal</div><span class="chev">›</span></div>
      <div class="li" data-act="macros"><div class="li-ic">${IC.chart}</div><div class="li-t">Macro split</div><div class="li-v">P${tg.split.p} C${tg.split.c} F${tg.split.f}%</div><span class="chev">›</span></div>
    </div>

    <div class="section-title" style="margin-top:18px">Activity sync</div>
    <div class="list-card">
      <div class="li"><div class="li-ic">${IC.watch}</div><div class="li-t">Auto-adjust calories from activity</div><div class="toggle ${p.adjust?"on":""}" id="adjToggle"></div></div>
      <div class="li" data-act="whoop"><div class="li-ic">${IC.chart}</div><div class="li-t">Whoop</div><div class="li-v">${S.cloud&&S.cloud.whoop?"Connected":"Connect"}</div><span class="chev">›</span></div>
      <div class="li" data-act="applewatch"><div class="li-ic">${IC.watch}</div><div class="li-t">Apple Watch / Health</div><div class="li-v">${lastW?Math.round(lastW)+" kcal":"Set up"}</div><span class="chev">›</span></div>
    </div>

    <div class="section-title" style="margin-top:18px">Tracking</div>
    <div class="list-card">
      <div class="li" data-act="weight"><div class="li-ic">${IC.scale}</div><div class="li-t">Weight & trend</div><div class="li-v">${p.kg?Math.round(p.kg/0.4536)+" lb":"Log"}</div><span class="chev">›</span></div>
      <div class="li" data-act="water"><div class="li-ic">${IC.water}</div><div class="li-t">Water</div><div class="li-v">${((S.water||{})[todayKey()]||0)} cups</div><span class="chev">›</span></div>
    </div>

    <div class="section-title" style="margin-top:18px">Reminders</div>
    <div class="list-card">
      <div class="li"><div class="li-ic">${IC.bell}</div><div class="li-t">Meal notifications</div><div class="toggle ${n.enabled?"on":""}" id="notifToggle"></div></div>
      <div class="li" data-act="remtimes"><div class="li-ic">${IC.clock}</div><div class="li-t">Reminder times</div><div class="li-v">${n.breakfast} · ${n.lunch} · ${n.dinner}</div><span class="chev">›</span></div>
      <div class="li" data-act="testnotif"><div class="li-ic">${IC.bell}</div><div class="li-t">Send a test notification</div><span class="chev">›</span></div>
    </div>

    <div class="section-title" style="margin-top:18px">Cloud features</div>
    <div class="list-card">
      <div class="li" data-act="cloud"><div class="li-ic">${IC.cloud}</div><div class="li-t">AI photo, USDA & push</div><div class="li-v">${CLOUD_BASE?"On":"Set up"}</div><span class="chev">›</span></div>
    </div>

    <div class="section-title" style="margin-top:18px">Data</div>
    <div class="list-card">
      <div class="li" data-act="export"><div class="li-ic">${IC.down}</div><div class="li-t">Export my data (JSON)</div><span class="chev">›</span></div>
      <div class="li" data-act="reset"><div class="li-ic">${IC.trash}</div><div class="li-t" style="color:var(--red)">Reset all data</div><span class="chev">›</span></div>
    </div>
    <div class="disclaimer">Kut estimates nutrients from your inputs, a built-in database${CLOUD_BASE?", USDA FoodData Central":""} and Open Food Facts. Values may be incomplete and are not medical advice. Targets use NIH/USDA DRI and AHA limits. Your log is stored on this device${CLOUD_BASE?"; only push subscriptions and activity sync use the cloud":""}.</div>
    <div style="height:8px"></div>
  </div>`;
}

/* ===================== SHEET PLUMBING ===================== */
const scrim=document.getElementById("scrim"),sheet=document.getElementById("sheet");
function openSheet(title,html){document.getElementById("sheetTitle").textContent=title;document.getElementById("sheetBody").innerHTML=html;scrim.classList.add("show");sheet.classList.add("show");}
function closeSheet(){scrim.classList.remove("show");sheet.classList.remove("show");}
document.getElementById("sheetClose").onclick=closeSheet;scrim.onclick=closeSheet;
function val(id){const el=document.getElementById(id);return el?el.value:"";}
let toastT;function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),2000);}
async function api(path,opts){if(!CLOUD_BASE)throw new Error("cloud not configured");const r=await fetch(CLOUD_BASE.replace(/\/$/,"")+path,opts);if(!r.ok)throw new Error("api "+r.status);return r.json();}

/* ===================== ADD MENU ===================== */
function openAddMenu(){
  openSheet("Log food",`<div class="log-methods">
    <button class="lm" data-method="search"><div class="lm-ic">${IC.search}</div><div class="lm-t">Search food</div><div class="lm-d">Database + online</div></button>
    <button class="lm navy" data-method="manual"><div class="lm-ic">${IC.edit}</div><div class="lm-t">Custom entry</div><div class="lm-d">Your own meal</div></button>
    <button class="lm" data-method="voice"><div class="lm-ic">${IC.mic}</div><div class="lm-t">Voice log<span class="beta">BETA</span></div><div class="lm-d">Say what you ate</div></button>
    <button class="lm navy" data-method="scan"><div class="lm-ic">${IC.cam}</div><div class="lm-t">Meal photo</div><div class="lm-d">${CLOUD_BASE?"AI scan":"Snap + confirm"}</div></button>
    <button class="lm" data-method="barcode"><div class="lm-ic">${IC.barcode}</div><div class="lm-t">Barcode</div><div class="lm-d">Scan a package</div></button>
    <button class="lm navy" data-method="meals"><div class="lm-ic">${IC.label}</div><div class="lm-t">Saved meals</div><div class="lm-d">Re-add a meal</div></button>
  </div>`);
}
function routeMethod(m){
  if(m==="search")openSearch();
  else if(m==="manual")openManual();
  else if(m==="voice")openVoice();
  else if(m==="scan")openPhoto();
  else if(m==="barcode")openBarcode();
  else if(m==="meals"){closeSheet();activeNav="meals";render();}
}

/* ===================== FOOD SEARCH (built-in + Open Food Facts) ===================== */
let searchTarget="day";   // 'day' or 'builder'
function openSearch(target){
  searchTarget=target||"day";
  openSheet("Search food",`<div class="search">${IC.search}<input id="foodSearch" placeholder="venison, oat milk, a brand…" autocomplete="off"></div>
    <div id="searchResults">${builtinResults("")}</div>`);
  const inp=document.getElementById("foodSearch");inp.focus();
  let timer;
  inp.oninput=()=>{const q=inp.value;document.getElementById("searchResults").innerHTML=builtinResults(q);bindResults();
    clearTimeout(timer);if(q.trim().length>=2)timer=setTimeout(()=>onlineSearch(q),450);};
  bindResults();
}
function builtinResults(q){
  q=q.trim().toLowerCase();
  const toks=q.split(/\s+/).filter(Boolean);
  const list=q?FOODDB.filter(f=>{const n=f.n.toLowerCase();return n.includes(q)||toks.every(t=>n.includes(t));}):FOODDB.slice(0,18);
  const head=q?`<div class="src-tag">Built-in database</div>`:`<div class="src-tag">Common foods</div>`;
  const rows=list.length?list.map(f=>foodRow(f,"db")).join(""):`<div class="empty">No built-in match — checking online…</div>`;
  const online=q.length>=2?`<div class="src-tag">Online (Open Food Facts${CLOUD_BASE?" + USDA":""})</div><div id="onlineResults"><div class="spinner"></div></div>`:"";
  return head+rows+online;
}
function foodRow(f,src){
  const id=src+"|"+encodeURIComponent(JSON.stringify({n:f.n,cat:f.cat,defG:f.defG,k:f.k,p:f.p,c:f.c,f:f.f,m:f.m||{}}));
  return `<div class="food-row" data-food="${id}"><div class="fi cat-${f.cat||'ot'}">${fiLetter(f.n)}</div>
    <div class="fmeta"><div class="fn">${f.n}</div><div class="fs">${f.defG||100} g · ${Math.round(f.k*(f.defG||100)/100)} cal · P${Math.round(f.p*(f.defG||100)/100)} C${Math.round(f.c*(f.defG||100)/100)} F${Math.round(f.f*(f.defG||100)/100)}</div></div>
    <div class="fk">${f.k}<small>/100g</small></div></div>`;
}
function bindResults(){document.querySelectorAll("[data-food]").forEach(r=>r.onclick=()=>{
  const[src,json]=r.dataset.food.split("|");const f=JSON.parse(decodeURIComponent(json));pickFood(f);});}
function pickFood(f){ if(searchTarget==="builder")addToBuilder(f); else openFoodLog(f); }

async function onlineSearch(q){
  const box=document.getElementById("onlineResults");if(!box)return;
  try{
    let foods=[];
    if(CLOUD_BASE){ try{const d=await api("/api/food-search?q="+encodeURIComponent(q));foods=d.foods||[];}catch(e){} }
    if(!foods.length)foods=await offSearch(q);
    if(!box.isConnected)return;
    box.innerHTML=foods.length?foods.map(f=>foodRow(f,"off")).join(""):`<div class="empty">No online results. Use <b>Custom entry</b> to add it.</div>`;
    bindResults();
  }catch(e){if(box.isConnected)box.innerHTML=`<div class="empty">Couldn't reach the food server. Try Custom entry.</div>`;}
}
async function offSearch(q){
  const url="https://world.openfoodfacts.org/cgi/search.pl?search_terms="+encodeURIComponent(q)+"&search_simple=1&action=process&json=1&page_size=24&sort_by=unique_scans_n&fields=product_name,brands,nutriments,serving_quantity";
  const r=await fetch(url);const d=await r.json();
  return (d.products||[]).map(offToFood).filter(Boolean).slice(0,15);
}
function offToFood(p){
  const nu=p.nutriments||{};let k=nu["energy-kcal_100g"];if(k==null&&nu["energy_100g"]!=null)k=nu["energy_100g"]/4.184;if(!p.product_name||k==null)return null;
  const m={};
  const map={proteins:null,carbohydrates:null,fat:null};
  if(nu["fiber_100g"]!=null)m.fiber=nu["fiber_100g"];
  if(nu["sugars_100g"]!=null)m.sugar=nu["sugars_100g"];
  if(nu["saturated-fat_100g"]!=null)m.satfat=nu["saturated-fat_100g"];
  if(nu["sodium_100g"]!=null)m.sodium=nu["sodium_100g"]*1000; else if(nu["salt_100g"]!=null)m.sodium=nu["salt_100g"]*400;
  if(nu["potassium_100g"]!=null)m.potassium=nu["potassium_100g"]*1000;
  if(nu["calcium_100g"]!=null)m.calcium=nu["calcium_100g"]*1000;
  if(nu["iron_100g"]!=null)m.iron=nu["iron_100g"]*1000;
  if(nu["cholesterol_100g"]!=null)m.cholesterol=nu["cholesterol_100g"]*1000;
  const name=(p.brands?p.brands.split(",")[0]+" ":"")+p.product_name;
  return {n:name.slice(0,48),cat:"ot",defG:p.serving_quantity?+p.serving_quantity:100,k:Math.round(k),p:nu["proteins_100g"]||0,c:nu["carbohydrates_100g"]||0,f:nu["fat_100g"]||0,m};
}

/* ===================== LIVE-SCALING FOOD LOG ===================== */
function openFoodLog(f,onSave){
  let grams=f.defG||100;let meal=guessMeal();
  const calc=g=>({k:Math.round(f.k*g/100),p:+(f.p*g/100).toFixed(1),c:+(f.c*g/100).toFixed(1),fa:+(f.f*g/100).toFixed(1)});
  openSheet(f.n,`
    <div class="preview" id="lpv"></div>
    <div class="field"><label>Amount <span class="hint">(grams)</span></label>
      <div class="stepper"><button id="gMinus">–</button><input id="gAmt" type="number" inputmode="decimal" value="${grams}"><button id="gPlus">+</button></div>
      <div class="qchips" id="qchips"></div>
    </div>
    <div class="field"><label>Meal</label><div class="seg" id="mealSeg">${MEALS.map(m=>`<button data-m="${m.k}" class="${m.k===meal?"on":""}">${m.k}</button>`).join("")}</div></div>
    <button class="btn green" id="saveLog">Add to diary</button>`);
  const pv=()=>{const c=calc(grams);document.getElementById("lpv").innerHTML=`<div><div class="pk">${c.k}<small> cal</small></div></div><div class="pm">Protein ${c.p} g<br>Carbs ${c.c} g · Fat ${c.fa} g</div>`;};
  const chips=[["½ serving",(f.defG||100)/2],["1 serving",f.defG||100],["2 servings",(f.defG||100)*2],["100 g",100]];
  document.getElementById("qchips").innerHTML=chips.map((c,i)=>`<button class="qchip" data-g="${c[1]}">${c[0]}</button>`).join("");
  const setG=g=>{grams=Math.max(1,Math.round(g));document.getElementById("gAmt").value=grams;pv();};
  document.querySelectorAll("#qchips .qchip").forEach(b=>b.onclick=()=>setG(+b.dataset.g));
  document.getElementById("gMinus").onclick=()=>setG(grams-10);
  document.getElementById("gPlus").onclick=()=>setG(grams+10);
  document.getElementById("gAmt").oninput=e=>{grams=+e.target.value||0;pv();};
  document.querySelectorAll("#mealSeg button").forEach(b=>b.onclick=()=>{meal=b.dataset.m;document.querySelectorAll("#mealSeg button").forEach(x=>x.classList.toggle("on",x===b));});
  pv();
  document.getElementById("saveLog").onclick=()=>{const entry=dbToEntry(f,grams,meal);
    if(onSave)onSave(entry); else{addEntryToDay(entry);closeSheet();render();toast("Added ✓");}};
}

/* ===================== CUSTOM / EDIT ENTRY ===================== */
function openManual(prefill,editIdx){
  const isEdit=editIdx!=null;const e=prefill||{n:"",unit:"serving",perK:"",perP:"",perC:"",perF:"",perM:{},qty:1,meal:guessMeal(),cat:"ot"};
  const unit=e.unit||"serving";
  openSheet(isEdit?"Edit entry":"Custom entry",`
    <div class="preview" id="cpv"></div>
    <div class="field"><label>Name</label><input id="c_n" value="${e.n||""}" placeholder="e.g. Grandma's chili"></div>
    <div class="field"><label>${unit==='g'?'Calories per 100 g':'Calories per serving'}</label><input id="c_k" type="number" inputmode="decimal" value="${unit==='g'?(e.perK*100||""):(e.perK||"")}"></div>
    <div class="row3">
      <div class="field"><label>Protein g</label><input id="c_p" type="number" value="${unit==='g'?+(e.perP*100).toFixed(1)||"":(e.perP||"")}"></div>
      <div class="field"><label>Carbs g</label><input id="c_c" type="number" value="${unit==='g'?+(e.perC*100).toFixed(1)||"":(e.perC||"")}"></div>
      <div class="field"><label>Fat g</label><input id="c_f" type="number" value="${unit==='g'?+(e.perF*100).toFixed(1)||"":(e.perF||"")}"></div>
    </div>
    <div class="field"><label>${unit==='g'?'Amount eaten (g)':'Servings eaten'}</label>
      <div class="stepper"><button id="qMinus">–</button><input id="c_qty" type="number" inputmode="decimal" step="${unit==='g'?'10':'0.5'}" value="${e.qty||1}"><button id="qPlus">+</button></div></div>
    <div class="field"><label>Meal</label><div class="seg" id="cMealSeg">${MEALS.map(m=>`<button data-m="${m.k}" class="${m.k===(e.meal||guessMeal())?"on":""}">${m.k}</button>`).join("")}</div></div>
    <button class="btn green" id="cSave">${isEdit?"Update":"Add to diary"}</button>
    ${isEdit?`<button class="btn danger" id="cDel">Delete</button>`:""}
  `);
  let meal=e.meal||guessMeal();
  const per=()=>{const base=unit==='g'?100:1;return{k:(+val("c_k")||0)/base,p:(+val("c_p")||0)/base,c:(+val("c_c")||0)/base,f:(+val("c_f")||0)/base};};
  const pv=()=>{const p=per();const q=+val("c_qty")||0;document.getElementById("cpv").innerHTML=`<div><div class="pk">${Math.round(p.k*q)}<small> cal</small></div></div><div class="pm">Protein ${(p.p*q).toFixed(1)} g<br>Carbs ${(p.c*q).toFixed(1)} g · Fat ${(p.f*q).toFixed(1)} g</div>`;};
  ["c_k","c_p","c_c","c_f","c_qty"].forEach(id=>document.getElementById(id).oninput=pv);
  document.getElementById("qMinus").onclick=()=>{const i=document.getElementById("c_qty");i.value=Math.max(0,(+i.value||0)-(unit==='g'?10:0.5));pv();};
  document.getElementById("qPlus").onclick=()=>{const i=document.getElementById("c_qty");i.value=(+i.value||0)+(unit==='g'?10:0.5);pv();};
  document.querySelectorAll("#cMealSeg button").forEach(b=>b.onclick=()=>{meal=b.dataset.m;document.querySelectorAll("#cMealSeg button").forEach(x=>x.classList.toggle("on",x===b));});
  pv();
  document.getElementById("cSave").onclick=()=>{
    if(!val("c_n")){toast("Add a name");return;}
    const p=per();const qty=+val("c_qty")||1;
    const entry={n:val("c_n"),cat:e.cat||"ot",meal,perK:p.k,perP:p.p,perC:p.c,perF:p.f,perM:e.perM||{},qty,unit,src:e.src||"manual",photo:e.photo};
    if(isEdit){S.log[dateKey()][editIdx]=entry;toast("Updated ✓");}else{addEntryToDay(entry);toast("Added ✓");}
    closeSheet();render();
  };
  const del=document.getElementById("cDel");if(del)del.onclick=()=>{S.log[dateKey()].splice(editIdx,1);closeSheet();render();toast("Deleted");};
}
function addEntryToDay(entry){const k=dateKey();S.log[k]=S.log[k]||[];S.log[k].push(entry);}

/* ===================== VOICE LOG ===================== */
const NUMWORDS={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,half:0.5};
function openVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  openSheet("Voice log",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:4px">Tap the mic and say what you ate — e.g. <i>"two eggs and a banana"</i>.</p>
    <div class="voice-anim" id="vAnim" style="visibility:hidden"><span></span><span></span><span></span><span></span><span></span></div>
    <button class="btn green" id="vStart">${SR?"Start listening":"Type instead"}</button>
    <div id="vHeard" style="margin:14px 0 4px;font-weight:800;color:var(--navy);text-align:center;min-height:18px"></div>
    <div id="vMatches"></div>`);
  const start=document.getElementById("vStart");
  if(!SR){start.onclick=()=>openManual();return;}
  start.onclick=()=>{const rec=new SR();rec.lang="en-US";rec.interimResults=false;
    document.getElementById("vAnim").style.visibility="visible";start.textContent="Listening…";
    rec.onresult=ev=>{const txt=ev.results[0][0].transcript;document.getElementById("vHeard").textContent='"'+txt+'"';matchSpeech(txt);};
    rec.onerror=()=>{document.getElementById("vHeard").textContent="Didn't catch that — try again.";};
    rec.onend=()=>{document.getElementById("vAnim").style.visibility="hidden";start.textContent="Start listening";};
    try{rec.start();}catch(e){}};
}
function matchSpeech(txt){
  const words=txt.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/);
  const hits=[];
  FOODDB.forEach(f=>{const key=f.n.toLowerCase().split(/[\s(]/)[0];const idx=words.indexOf(key);
    if(idx>=0){let qty=1;const prev=words[idx-1];if(prev&&NUMWORDS[prev])qty=NUMWORDS[prev];else if(prev&&+prev)qty=+prev;hits.push({f,qty});}});
  const wrap=document.getElementById("vMatches");
  if(!hits.length){wrap.innerHTML=`<div class="empty">No match found. <a id="vManual">Add manually ›</a></div>`;document.getElementById("vManual").onclick=()=>openManual({n:txt});return;}
  wrap.innerHTML=`<div class="src-tag">Tap to log (×qty detected)</div>`+hits.map((h,i)=>{const g=(h.f.defG||100)*h.qty;
    return `<div class="food-row" data-vi="${i}"><div class="fi cat-${h.f.cat}">${fiLetter(h.f.n)}</div><div class="fmeta"><div class="fn">${h.f.n}</div><div class="fs">${h.qty} × ${h.f.defG||100} g</div></div><div class="fk">${Math.round(h.f.k*g/100)}<small>cal</small></div></div>`;}).join("")
    +`<button class="btn green" id="vLogAll" style="margin-top:12px">Log all ${hits.length} items</button>`;
  wrap.querySelectorAll("[data-vi]").forEach(r=>r.onclick=()=>{const h=hits[+r.dataset.vi];openFoodLog({...h.f,defG:(h.f.defG||100)*h.qty});});
  document.getElementById("vLogAll").onclick=()=>{hits.forEach(h=>addEntryToDay(dbToEntry(h.f,(h.f.defG||100)*h.qty,guessMeal())));closeSheet();render();toast(`Logged ${hits.length} items ✓`);};
}

/* ===================== PHOTO / AI ===================== */
function openPhoto(){
  openSheet("Meal photo",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:12px">${CLOUD_BASE?"Snap your plate — AI will identify the foods and estimate nutrition. You confirm before logging.":"Snap your plate, then confirm the foods and nutrition below."}</p>
    <label class="lm navy" style="flex-direction:row;align-items:center;gap:12px;cursor:pointer"><div class="lm-ic">${IC.cam}</div><div><div class="lm-t">Take / choose photo</div><div class="lm-d">Opens your camera</div></div><input type="file" accept="image/*" capture="environment" id="capIn" style="display:none"></label>
    <div id="capPrev" style="margin:12px 0"></div><div id="aiOut"></div>
    <button class="btn ghost" id="capManual" style="margin-top:6px">Enter manually instead</button>`);
  document.getElementById("capManual").onclick=()=>openManual();
  document.getElementById("capIn").onchange=async ev=>{const file=ev.target.files[0];if(!file)return;
    const thumb=await downscale(file,420);
    document.getElementById("capPrev").innerHTML=`<img src="${thumb}" style="width:100%;border-radius:14px;max-height:240px;object-fit:cover">`;
    if(CLOUD_BASE){runAIPhoto(thumb);}else{toast("Photo captured ✓");setTimeout(()=>openManual({n:"Meal from photo",photo:thumb}),350);}
  };
}
async function runAIPhoto(dataUrl){
  const out=document.getElementById("aiOut");out.innerHTML=`<div class="spinner"></div><p style="text-align:center;color:var(--gray-500);font-size:13px">Analysing your plate…</p>`;
  try{const d=await api("/api/ai-photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:dataUrl})});
    const items=d.items||[];if(!items.length){out.innerHTML=`<div class="empty">Couldn't identify the food. <a id="aiM">Add manually ›</a></div>`;document.getElementById("aiM").onclick=()=>openManual();return;}
    out.innerHTML=`<div class="src-tag">AI estimate — tap to adjust & log</div>`+items.map((it,i)=>`<div class="food-row" data-ai="${i}"><div class="fi cat-ot">${fiLetter(it.name)}</div><div class="fmeta"><div class="fn">${it.name}</div><div class="fs">${it.grams||100} g · P${Math.round(it.p||0)} C${Math.round(it.c||0)} F${Math.round(it.f||0)}</div></div><div class="fk">${Math.round(it.k||0)}<small>cal</small></div></div>`).join("")+`<button class="btn green" id="aiAll" style="margin-top:12px">Log all</button>`;
    const toFood=it=>({n:it.name,cat:"ot",defG:it.grams||100,k:Math.round((it.k||0)/((it.grams||100)/100)),p:(it.p||0)/((it.grams||100)/100),c:(it.c||0)/((it.grams||100)/100),f:(it.f||0)/((it.grams||100)/100),m:it.m||{}});
    out.querySelectorAll("[data-ai]").forEach(r=>r.onclick=()=>openFoodLog(toFood(items[+r.dataset.ai])));
    document.getElementById("aiAll").onclick=()=>{items.forEach(it=>addEntryToDay(dbToEntry(toFood(it),it.grams||100,guessMeal())));closeSheet();render();toast("Logged ✓");};
  }catch(e){out.innerHTML=`<div class="empty">AI scan unavailable. <a id="aiM2">Add manually ›</a></div>`;document.getElementById("aiM2").onclick=()=>openManual();}
}
function downscale(file,max){return new Promise(res=>{const img=new Image();const fr=new FileReader();
  fr.onload=()=>{img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const cv=document.createElement("canvas");cv.width=img.width*s;cv.height=img.height*s;cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);res(cv.toDataURL("image/jpeg",0.8));};img.src=fr.result;};fr.readAsDataURL(file);});}

/* ===================== BARCODE ===================== */
function openBarcode(){
  openSheet("Barcode",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:12px">Type or scan the barcode number to look it up in Open Food Facts (millions of products).</p>
    <div class="field"><label>Barcode (UPC/EAN)</label><input id="bc" inputmode="numeric" placeholder="e.g. 009800895007"></div>
    <button class="btn green" id="bcGo">Look up</button><div id="bcOut" style="margin-top:12px"></div>`);
  document.getElementById("bcGo").onclick=async()=>{const code=val("bc").replace(/\D/g,"");if(!code)return;
    const out=document.getElementById("bcOut");out.innerHTML=`<div class="spinner"></div>`;
    try{const r=await fetch("https://world.openfoodfacts.org/api/v2/product/"+code+".json?fields=product_name,brands,nutriments,serving_quantity");const d=await r.json();
      if(d.status!==1){out.innerHTML=`<div class="empty">Not found. Use <b>Custom entry</b>.</div>`;return;}
      const f=offToFood(d.product);if(!f){out.innerHTML=`<div class="empty">No nutrition data. Use Custom entry.</div>`;return;}
      out.innerHTML=foodRow(f,"off");out.querySelector("[data-food]").onclick=()=>openFoodLog(f);
    }catch(e){out.innerHTML=`<div class="empty">Lookup failed. Use Custom entry.</div>`;}
  };
}

/* ===================== SAVED MEALS ===================== */
let mealBuilder=[];
function openMealBuilder(existing){
  mealBuilder=existing?existing.items.map(x=>({...x})):[];
  const name=existing?existing.name:"";
  renderBuilder(name,existing&&existing.id);
}
function renderBuilder(name,editId){
  const cal=mealBuilder.reduce((a,x)=>a+x.perK*x.qty,0);
  openSheet(editId?"Edit meal":"Create a meal",`
    <div class="field"><label>Meal name</label><input id="mb_n" value="${name||""}" placeholder="e.g. Post-workout shake"></div>
    <div class="preview"><div><div class="pk">${Math.round(cal)}<small> cal</small></div></div><div class="pm">${mealBuilder.length} items</div></div>
    <button class="btn ghost" id="mbAdd">+ Add a food</button>
    <div style="margin-top:12px">${mealBuilder.length?mealBuilder.map((x,i)=>`<div class="food-row"><div class="fi cat-${x.cat||'ot'}">${fiLetter(x.n)}</div><div class="fmeta"><div class="fn">${x.n}</div><div class="fs">${Math.round(x.qty)}${x.unit==='g'?' g':' serv'} · ${Math.round(x.perK*x.qty)} cal</div></div><button class="qchip" data-rm="${i}">Remove</button></div>`).join(""):`<div class="empty">No foods yet — add some.</div>`}</div>
    <button class="btn green" id="mbSave" style="margin-top:8px">Save meal</button>`);
  document.getElementById("mbAdd").onclick=()=>openSearch("builder");
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{mealBuilder.splice(+b.dataset.rm,1);renderBuilder(val("mb_n"),editId);});
  document.getElementById("mbSave").onclick=()=>{const nm=val("mb_n");if(!nm){toast("Name your meal");return;}if(!mealBuilder.length){toast("Add at least one food");return;}
    S.meals=S.meals||[];if(editId){const m=S.meals.find(x=>x.id===editId);m.name=nm;m.items=mealBuilder;}else S.meals.push({id:Date.now().toString(36),name:nm,items:mealBuilder});
    closeSheet();render();toast("Meal saved ✓");};
}
function addToBuilder(f){const grams=f.defG||100;mealBuilder.push(dbToEntry(f,grams,null));renderBuilder(val("mb_n")||"");}
function openSavedMeal(id){
  const meal=(S.meals||[]).find(m=>m.id===id);if(!meal)return;
  const cal=meal.items.reduce((a,x)=>a+x.perK*x.qty,0);
  openSheet(meal.name,`<div class="preview"><div><div class="pk">${Math.round(cal)}<small> cal</small></div></div><div class="pm">${meal.items.length} items</div></div>
    <div class="field"><label>Add to which meal?</label><div class="seg" id="amSeg">${MEALS.map((m,i)=>`<button data-m="${m.k}" class="${i===0?'on':''}">${m.k}</button>`).join("")}</div></div>
    <button class="btn green" id="amAdd">Add to today</button>
    <button class="btn ghost" id="amEdit">Edit meal</button>
    <button class="btn danger" id="amDel">Delete meal</button>`);
  let slot="Breakfast";document.querySelectorAll("#amSeg button").forEach(b=>b.onclick=()=>{slot=b.dataset.m;document.querySelectorAll("#amSeg button").forEach(x=>x.classList.toggle("on",x===b));});
  document.getElementById("amAdd").onclick=()=>{meal.items.forEach(x=>addEntryToDay({...x,meal:slot}));closeSheet();activeNav="home";render();toast(`Added ${meal.name} ✓`);};
  document.getElementById("amEdit").onclick=()=>openMealBuilder(meal);
  document.getElementById("amDel").onclick=()=>{S.meals=S.meals.filter(m=>m.id!==id);closeSheet();render();toast("Deleted");};
}

/* ===================== GOALS / MACROS ===================== */
function openGoals(){
  const p=S.profile;
  openSheet("Calories & goal",`
    <div class="field"><label>Your name</label><input id="g_name" value="${p.name||""}"></div>
    <div class="row2">
      <div class="field"><label>Goal</label><select id="g_goal">${[["lose","Lose weight"],["maintain","Maintain"],["gain","Build muscle"]].map(o=>`<option value="${o[0]}" ${p.goal===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></div>
      <div class="field"><label>Activity</label><select id="g_act">${Object.keys(ACTIVITY).map(k=>`<option value="${k}" ${p.activity===k?"selected":""}>${ACTIVITY[k].label}</option>`).join("")}</select></div>
    </div>
    <div class="row3">
      <div class="field"><label>Age</label><input id="g_age" type="number" value="${p.age||""}"></div>
      <div class="field"><label>Height (in)</label><input id="g_h" type="number" value="${p.cm?Math.round(p.cm/2.54):""}"></div>
      <div class="field"><label>Weight (lb)</label><input id="g_w" type="number" value="${p.kg?Math.round(p.kg/0.4536):""}"></div>
    </div>
    <div id="g_cut" class="${p.goal==='lose'?'':'hide'}"><div class="row2">
      <div class="field"><label>Lose (lb)</label><input id="g_loss" type="number" value="${p.lossLb||10}"></div>
      <div class="field"><label>Over (weeks)</label><input id="g_wk" type="number" value="${p.weeks||12}"></div>
    </div></div>
    <div class="result" style="background:var(--navy);color:#fff;border-radius:14px;padding:16px;margin-bottom:14px"><div id="g_res"></div></div>
    <button class="btn green" id="g_save">Save</button>`);
  const recompute=()=>{
    const np={...p,sex:p.sex||"m",age:+val("g_age")||30,cm:Math.round((+val("g_h")||69)*2.54),kg:+( (+val("g_w")||170)*0.4536),activity:val("g_act"),goal:val("g_goal"),lossLb:+val("g_loss")||10,weeks:+val("g_wk")||12,split:S.targets.split};
    const t=computeTargets(np);document.getElementById("g_res").innerHTML=`<div style="font-size:30px;font-weight:800;letter-spacing:-1px">${t.cal} <span style="font-size:14px;color:#A9B6CE">cal/day</span></div><div style="color:#C7D2E5;font-size:13px;margin-top:4px">TDEE ${t.tdee}${t.deficit?` · −${t.deficit}/day deficit`:""} · P ${t.p}g C ${t.c}g F ${t.f}g</div>`;
    return {np,t};
  };
  document.getElementById("g_goal").onchange=()=>{document.getElementById("g_cut").classList.toggle("hide",val("g_goal")!=="lose");recompute();};
  ["g_act","g_age","g_h","g_w","g_loss","g_wk"].forEach(id=>document.getElementById(id).oninput=recompute);
  recompute();
  document.getElementById("g_save").onclick=()=>{const{np,t}=recompute();np.name=val("g_name")||"You";S.profile=np;S.targets=t;closeSheet();scheduleReminders();render();toast("Goals updated ✓");};
}
function openMacros(){
  const sp={...S.targets.split};
  openSheet("Macro split",`<p style="color:var(--gray-500);font-size:13px;margin-bottom:12px">Set the % of calories from each macro. They'll auto-balance to 100%.</p>
    <div class="field"><label>Protein <span class="hint" id="mp_g"></span></label><input id="m_p" type="number" value="${sp.p}"></div>
    <div class="field"><label>Carbs <span class="hint" id="mc_g"></span></label><input id="m_c" type="number" value="${sp.c}"></div>
    <div class="field"><label>Fat <span class="hint" id="mf_g"></span></label><input id="m_f" type="number" value="${sp.f}"></div>
    <div id="m_sum" style="font-weight:800;color:var(--navy);margin-bottom:12px"></div>
    <button class="btn green" id="m_save">Save split</button>`);
  const upd=()=>{const P=+val("m_p")||0,C=+val("m_c")||0,F=+val("m_f")||0,sum=P+C+F;
    document.getElementById("m_sum").textContent=`Total: ${sum}% ${sum===100?"✓":"(will be normalized)"}`;
    const cal=S.targets.cal;document.getElementById("mp_g").textContent=`≈ ${Math.round(cal*P/100/4)} g`;document.getElementById("mc_g").textContent=`≈ ${Math.round(cal*C/100/4)} g`;document.getElementById("mf_g").textContent=`≈ ${Math.round(cal*F/100/9)} g`;};
  ["m_p","m_c","m_f"].forEach(id=>document.getElementById(id).oninput=upd);upd();
  document.getElementById("m_save").onclick=()=>{let P=+val("m_p")||0,C=+val("m_c")||0,F=+val("m_f")||0,sum=P+C+F||1;P=Math.round(P/sum*100);C=Math.round(C/sum*100);F=100-P-C;
    S.profile.split={p:P,c:C,f:F};S.targets=computeTargets(S.profile);closeSheet();render();toast("Macros updated ✓");};
}

/* ===================== WEIGHT / WATER ===================== */
function spark(vals){if(vals.length<2)return"";const w=280,h=60,mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rng)*(h-8)-4}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}"><polyline points="${pts}" fill="none" stroke="var(--green-2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function openWeight(){
  const ws=S.weights||{};const keys=Object.keys(ws).sort();const vals=keys.map(k=>ws[k]/0.4536);
  const cur=S.profile.kg?Math.round(S.profile.kg/0.4536):"";
  openSheet("Weight & trend",`
    <div class="field"><label>Today's weight (lb)</label><div class="stepper"><button id="wMinus">–</button><input id="w_v" type="number" inputmode="decimal" value="${cur}"><button id="wPlus">+</button></div></div>
    <button class="btn green" id="w_save">Log weight</button>
    ${vals.length?`<div class="chart-card"><h4>Trend (${keys.length} entries)</h4>${spark(vals)}<div style="display:flex;justify-content:space-between;color:var(--gray-500);font-size:12px;font-weight:700;margin-top:6px"><span>${Math.round(vals[0])} lb</span><span>${Math.round(vals[vals.length-1])} lb</span></div></div>`:""}`);
  document.getElementById("wMinus").onclick=()=>{const i=document.getElementById("w_v");i.value=(+i.value||0)-1;};
  document.getElementById("wPlus").onclick=()=>{const i=document.getElementById("w_v");i.value=(+i.value||0)+1;};
  document.getElementById("w_save").onclick=()=>{const lb=+val("w_v");if(!lb)return;const kg=lb*0.4536;S.weights=S.weights||{};S.weights[todayKey()]=kg;S.profile.kg=kg;S.targets=computeTargets(S.profile);closeSheet();render();toast("Weight logged · targets updated ✓");};
}
function openWater(){
  const k=todayKey();const cups=(S.water||{})[k]||0;const goal=8;
  openSheet("Water",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:6px">Goal: ${goal} cups (≈2 L) a day.</p>
    <div class="preview"><div><div class="pk">${cups}<small> / ${goal} cups</small></div></div><div class="pm">${Math.round(cups/goal*100)}%</div></div>
    <div class="water-grid">${Array.from({length:goal}).map((_,i)=>`<div class="cup ${i<cups?'full':''}"></div>`).join("")}</div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn ghost" id="wMinus">– Remove</button><button class="btn green" id="wAdd">+ Add cup</button></div>`);
  const set=n=>{S.water=S.water||{};S.water[k]=Math.max(0,n);openWater();render();};
  document.getElementById("wAdd").onclick=()=>set(cups+1);
  document.getElementById("wMinus").onclick=()=>set(cups-1);
}

/* ===================== WEARABLES ===================== */
function openWhoop(){
  const connected=S.cloud&&S.cloud.whoop;
  openSheet("Whoop",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:12px">Connect Whoop to pull each day's calories burned and auto-adjust your target.</p>
    ${!CLOUD_BASE?`<div class="cloud-banner">Set up <b>Cloud features</b> first (it needs the backend).</div>`:connected?`<div class="cloud-banner">Connected. Your daily burn syncs automatically.</div><button class="btn green" id="whSync">Sync today now</button><button class="btn danger" id="whOff">Disconnect</button>`:`<button class="btn green" id="whGo">Connect Whoop</button>`}`);
  const go=document.getElementById("whGo");if(go)go.onclick=()=>{location.href=CLOUD_BASE.replace(/\/$/,"")+"/api/whoop/auth";};
  const sync=document.getElementById("whSync");if(sync)sync.onclick=async()=>{try{const d=await api("/api/whoop/sync");S.wear=S.wear||{};S.wear[todayKey()]=d.kcal||0;closeSheet();render();toast(`Synced ${Math.round(d.kcal||0)} kcal ✓`);}catch(e){toast("Sync failed");}};
  const off=document.getElementById("whOff");if(off)off.onclick=()=>{S.cloud.whoop=false;closeSheet();render();};
}
function openAppleWatch(){
  const token=(S.cloud&&S.cloud.token)||"(set up cloud first)";
  const ep=CLOUD_BASE?CLOUD_BASE.replace(/\/$/,"")+"/api/health-sync":"(your-backend)/api/health-sync";
  openSheet("Apple Watch / Health",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:10px">iPhone web apps can't read Apple Health directly, so we use a free <b>Shortcuts automation</b> that sends your daily Active Energy to Kut. One-time setup (~2 min):</p>
    <ol style="color:var(--gray-700);font-size:13px;line-height:1.7;padding-left:18px;margin-bottom:12px">
      <li>Open <b>Shortcuts</b> → Automation → <b>+</b> → Time of Day → 11:30 PM, daily.</li>
      <li>Add action <b>Find Health Samples</b> → Active Energy, Today, sum.</li>
      <li>Add <b>Get Contents of URL</b>: POST to the endpoint below, JSON body <code>{"kcal": [Health Result], "token":"${token}"}</code>.</li>
      <li>Turn off "Ask Before Running".</li>
    </ol>
    <div class="field"><label>Endpoint</label><input value="${ep}" readonly onclick="this.select()"></div>
    <div class="field"><label>Or log today's active calories manually</label><input id="aw_v" type="number" inputmode="numeric" placeholder="e.g. 540"></div>
    <button class="btn green" id="aw_save">Save today's burn</button>`);
  document.getElementById("aw_save").onclick=()=>{const v=+val("aw_v");if(!v)return;S.wear=S.wear||{};S.wear[todayKey()]=v;closeSheet();render();toast("Activity saved ✓");};
}

/* ===================== CLOUD SETUP ===================== */
function openCloud(){
  openSheet("Cloud features",`<p style="color:var(--gray-500);font-size:14px;margin-bottom:12px">Paste your deployed backend URL to turn on AI photo scan, USDA micronutrients, real push notifications, and Whoop sync. See <b>README-SETUP</b> for the 10-minute deploy.</p>
    <div class="field"><label>Backend URL</label><input id="cl_url" placeholder="https://kut-xxxx.vercel.app" value="${(S.cloud&&S.cloud.base)||""}"></div>
    <button class="btn green" id="cl_save">Save & test</button>
    <div id="cl_out" style="margin-top:12px"></div>
    <div class="cloud-banner">Until you deploy, Kut still works fully: built-in database, Open Food Facts online search, barcode lookup, voice, photo capture, and in-app reminders while open.</div>`);
  document.getElementById("cl_save").onclick=async()=>{const u=val("cl_url").trim().replace(/\/$/,"");S.cloud=S.cloud||{};S.cloud.base=u;CLOUD_BASE=u;
    const out=document.getElementById("cl_out");out.innerHTML=`<div class="spinner"></div>`;
    try{await fetch(u+"/api/health-sync",{method:"OPTIONS"});out.innerHTML=`<div class="flag"><div><div class="ft">Connected ✓</div><div class="fb">Cloud features are on.</div></div></div>`;}
    catch(e){out.innerHTML=`<div class="flag warn"><div><div class="ft">Saved, but couldn't reach it</div><div class="fb">Double-check the URL and that it's deployed.</div></div></div>`;}
    save();render();};
}

/* ===================== NOTIFICATIONS (local + push) ===================== */
let reminderTimers=[];
async function toggleNotif(){
  if(!S.notif.enabled){
    if(!("Notification" in window)){toast("Notifications not supported here");return;}
    let perm=Notification.permission;if(perm!=="granted")perm=await Notification.requestPermission();
    if(perm!=="granted"){toast("Allow notifications in your browser settings");return;}
    S.notif.enabled=true;await subscribePush();scheduleReminders();fireNotif("Kut reminders on","I'll nudge you at meal times to stay on track.");toast("Reminders on ✓");
  }else{S.notif.enabled=false;clearReminders();toast("Reminders off");}
  render();
}
async function subscribePush(){
  if(!CLOUD_BASE||!("serviceWorker"in navigator)||!("PushManager"in window))return;
  try{const reg=await navigator.serviceWorker.ready;const{key}=await api("/api/push/key");
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToUint8(key)});
    await api("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub,reminders:S.notif,tzOffset:new Date().getTimezoneOffset()})});
  }catch(e){/* falls back to local timers */}
}
function urlB64ToUint8(b){const pad="=".repeat((4-b.length%4)%4);const s=(b+pad).replace(/-/g,"+").replace(/_/g,"/");const raw=atob(s);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
function clearReminders(){reminderTimers.forEach(t=>clearTimeout(t));reminderTimers=[];}
function scheduleReminders(){clearReminders();if(!S.notif.enabled||!("Notification"in window)||Notification.permission!=="granted")return;
  [["breakfast","Time for breakfast","Log your first meal to start the day on track."],["lunch","Lunch time","Don't forget to log your lunch in Kut."],["dinner","Dinner check-in","Log dinner and see your calories left."]].forEach(([key,title,body])=>{
    const[h,m]=S.notif[key].split(":").map(Number);const now=new Date();const t=new Date();t.setHours(h,m,0,0);if(t<=now)t.setDate(t.getDate()+1);const ms=t-now;
    if(ms<2147483647)reminderTimers.push(setTimeout(function f(){fireNotif(title,body);reminderTimers.push(setTimeout(f,864e5));},ms));});
  const eod=new Date();eod.setHours(21,0,0,0);if(eod<=new Date())eod.setDate(eod.getDate()+1);
  reminderTimers.push(setTimeout(function f(){const t=totals(todayKey()),left=Math.round(calTarget(todayKey())-t.k);fireNotif("Daily check-in",left>=0?`${left} calories left today — you're on track.`:`${Math.abs(left)} over today. Tomorrow's a fresh start.`);reminderTimers.push(setTimeout(f,864e5));},eod-new Date()));
}
function fireNotif(title,body){if(("Notification"in window)&&Notification.permission==="granted"){try{if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,icon:"icon-192.png",badge:"icon-192.png",tag:"kut"}));else new Notification(title,{body});}catch(e){}}}

/* ===================== POST-RENDER BINDINGS ===================== */
function postRender(){
  document.querySelectorAll("[data-micro]").forEach(b=>b.onclick=()=>openSheet(b.dataset.micro==="vit"?"Vitamins":"Minerals",microHTML(b.dataset.micro)));
  document.querySelectorAll("[data-edit]").forEach(r=>r.onclick=()=>openManual({...dayEntries()[+r.dataset.edit]},+r.dataset.edit));
  document.querySelectorAll("[data-meal]").forEach(r=>r.onclick=()=>openSavedMeal(r.dataset.meal));
  const nm=document.getElementById("newMeal");if(nm)nm.onclick=()=>openMealBuilder();
  document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>({goals:openGoals,macros:openMacros,remtimes:openRemTimes,testnotif:()=>{if(("Notification"in window)&&Notification.permission==="granted")fireNotif("Test notification","Looks good — Kut can reach you here.");else toast("Turn on Meal notifications first");},weight:openWeight,water:openWater,whoop:openWhoop,applewatch:openAppleWatch,cloud:openCloud,export:exportData,reset:resetData}[b.dataset.act]()));
  const at=document.getElementById("adjToggle");if(at)at.onclick=()=>{S.profile.adjust=!S.profile.adjust;render();toast(S.profile.adjust?"Auto-adjust on":"Auto-adjust off");};
  const nt=document.getElementById("notifToggle");if(nt)nt.onclick=toggleNotif;
}
function openRemTimes(){const n=S.notif;openSheet("Reminder times",`
  <div class="field"><label>Breakfast</label><input id="r_b" type="time" value="${n.breakfast}"></div>
  <div class="field"><label>Lunch</label><input id="r_l" type="time" value="${n.lunch}"></div>
  <div class="field"><label>Dinner</label><input id="r_d" type="time" value="${n.dinner}"></div>
  <button class="btn green" id="r_save">Save</button>`);
  document.getElementById("r_save").onclick=async()=>{S.notif.breakfast=val("r_b");S.notif.lunch=val("r_l");S.notif.dinner=val("r_d");if(S.notif.enabled){await subscribePush();scheduleReminders();}closeSheet();render();toast("Reminders updated ✓");};}

/* ===================== DATA ===================== */
function exportData(){const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kut-data-"+todayKey()+".json";a.click();toast("Exported ✓");}
function resetData(){openSheet("Reset all data",`<p style="color:var(--gray-500);margin-bottom:16px">This permanently deletes everything on this device and can't be undone.</p><button class="btn danger" id="rc">Yes, delete everything</button><button class="btn ghost" id="rx">Cancel</button>`);document.getElementById("rx").onclick=closeSheet;document.getElementById("rc").onclick=()=>{localStorage.removeItem(LS);location.reload();};}

/* ===================== NAV + INIT ===================== */
document.querySelectorAll(".nav-item").forEach(n=>n.onclick=()=>{activeNav=n.dataset.nav;render();window.scrollTo(0,0);});
document.getElementById("addBtn").onclick=openAddMenu;
document.addEventListener("click",e=>{const m=e.target.closest("[data-method]");if(m&&!m.dataset.bound){/* handled below */}});
document.getElementById("sheetBody").addEventListener("click",e=>{const m=e.target.closest("[data-method]");if(m)routeMethod(m.dataset.method);});

/* ---------- ONBOARDING (TDEE calculator) ---------- */
function showOnboarding(){
  const root=document.getElementById("onbRoot");
  root.innerHTML=`<div class="onb"><div class="brand-name" style="font-size:30px;margin-bottom:6px">Kut</div>
    <h1>Set your plan</h1><p>A few details to calculate your calories and macros. Editable anytime.</p>
    <div class="row2">
      <div class="field"><label>Sex</label><div class="seg" id="o_sex"><button data-v="m" class="on">Male</button><button data-v="f">Female</button></div></div>
      <div class="field"><label>Activity</label><select id="o_act">${Object.keys(ACTIVITY).map(k=>`<option value="${k}" ${k==='mod'?'selected':''}>${ACTIVITY[k].label}</option>`).join("")}</select></div>
    </div>
    <div class="row3">
      <div class="field"><label>Age</label><input id="o_age" type="number" placeholder="22"></div>
      <div class="field"><label>Height (in)</label><input id="o_h" type="number" placeholder="70"></div>
      <div class="field"><label>Weight (lb)</label><input id="o_w" type="number" placeholder="175"></div>
    </div>
    <div class="field"><label>Goal</label><div class="seg" id="o_goal"><button data-v="lose" class="on">Lose</button><button data-v="maintain">Maintain</button><button data-v="gain">Gain</button></div></div>
    <div id="o_cut" class="row2"><div class="field"><label>Lose (lb)</label><input id="o_loss" type="number" value="15"></div><div class="field"><label>Over (weeks)</label><input id="o_wk" type="number" value="12"></div></div>
    <div class="field"><label>Macro split (P / C / F %)</label><div class="row3"><input id="o_mp" type="number" value="35"><input id="o_mc" type="number" value="35"><input id="o_mf" type="number" value="30"></div></div>
    <div class="result"><div class="rc" id="o_cal">—</div><div class="rl" id="o_sub"></div><div class="rm" id="o_macros"></div></div>
    <button class="btn green" id="o_start">Start tracking</button></div>`;
  let sex="m",goal="lose";
  const seg=(id,set)=>root.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>{set(b.dataset.v);root.querySelectorAll("#"+id+" button").forEach(x=>x.classList.toggle("on",x===b));if(id==="o_goal")document.getElementById("o_cut").style.display=b.dataset.v==="lose"?"grid":"none";calc();});
  const prof=()=>{let mp=+val("o_mp")||0,mc=+val("o_mc")||0,mf=+val("o_mf")||0,s=mp+mc+mf||1;mp=Math.round(mp/s*100);mc=Math.round(mc/s*100);mf=100-mp-mc;
    return{name:"You",sex,age:+val("o_age")||25,cm:Math.round((+val("o_h")||69)*2.54),kg:(+val("o_w")||170)*0.4536,activity:val("o_act"),goal,lossLb:+val("o_loss")||15,weeks:+val("o_wk")||12,split:{p:mp,c:mc,f:mf},adjust:true,focus:["general","metabolic"]};};
  const calc=()=>{const p=prof();const t=computeTargets(p);document.getElementById("o_cal").textContent=t.cal+" cal";document.getElementById("o_sub").textContent=`TDEE ${t.tdee}${t.deficit?` · −${t.deficit}/day`:""}`;document.getElementById("o_macros").textContent=`Protein ${t.p}g · Carbs ${t.c}g · Fat ${t.f}g`;};
  seg("o_sex",v=>sex=v);seg("o_goal",v=>goal=v);
  ["o_act","o_age","o_h","o_w","o_loss","o_wk","o_mp","o_mc","o_mf"].forEach(id=>document.getElementById(id).oninput=calc);
  calc();
  document.getElementById("o_start").onclick=()=>{const p=prof();const t=computeTargets(p);
    S={profile:p,targets:t,notif:{enabled:false,breakfast:"08:00",lunch:"12:30",dinner:"18:30"},log:{},meals:[],weights:p.kg?{[todayKey()]:p.kg}:{},water:{},wear:{},cloud:{base:"",token:Math.random().toString(36).slice(2)},created:todayKey()};
    save();root.innerHTML="";render();toast("Welcome to Kut");};
}

/* ---------- boot ---------- */
function migrate(){if(S&&!S.targets){S.targets=computeTargets(S.profile||{sex:"m",age:25,cm:175,kg:80,activity:"mod",goal:"lose",split:{p:35,c:35,f:30}});}if(S){S.meals=S.meals||[];S.weights=S.weights||{};S.water=S.water||{};S.wear=S.wear||{};S.cloud=S.cloud||{base:"",token:Math.random().toString(36).slice(2)};if(S.cloud.base)CLOUD_BASE=S.cloud.base;}}
migrate();
/* pull wearable activity from backend (Apple Health via Shortcuts, and Whoop) */
async function syncActivity(){
  if(!S||!CLOUD_BASE||!S.profile.adjust)return;
  const today=todayKey();let changed=false;
  try{const d=await api("/api/health-sync?token="+encodeURIComponent(S.cloud.token)+"&date="+today);if(d&&d.kcal){S.wear[today]=Math.max(S.wear[today]||0,d.kcal);changed=true;}}catch(e){}
  if(S.cloud.whoop){try{const d=await api("/api/whoop/sync");if(d&&d.kcal){S.wear[today]=Math.max(S.wear[today]||0,d.kcal);changed=true;}}catch(e){}}
  if(changed){save();if(activeNav==="home")render();}
}
/* handle Whoop OAuth return */
if(S&&location.search.indexOf("whoop=connected")>=0){S.cloud.whoop=true;save();history.replaceState({},"",location.pathname);}
if(!S){showOnboarding();}else{render();if(S.notif&&S.notif.enabled)scheduleReminders();syncActivity();}
if("serviceWorker"in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
