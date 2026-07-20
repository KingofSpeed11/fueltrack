// Built-in nutrition database. Values are per one standard serving.
// This is what the app looks up after AI (or you) identifies a food.
// `aliases` are the words/phrases the meal-description parser looks for.
const FOOD_DB = [
  // ---- Proteins ----
  { id: "chicken_breast", name: "Grilled Chicken Breast", serving: "1 breast (170g)", grams: 170, calories: 280, protein: 53, carbs: 0, fat: 6, fiber: 0, sugar: 0, sodium: 130, aliases: ["grilled chicken breast", "chicken breast", "grilled chicken", "chicken"] },
  { id: "ground_beef_90", name: "Ground Beef (90/10)", serving: "4 oz cooked (113g)", grams: 113, calories: 230, protein: 24, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 75, aliases: ["ground beef", "beef"] },
  { id: "salmon", name: "Grilled Salmon", serving: "1 fillet (150g)", grams: 150, calories: 310, protein: 34, carbs: 0, fat: 18, fiber: 0, sugar: 0, sodium: 90, aliases: ["grilled salmon", "salmon"] },
  { id: "eggs", name: "Eggs", serving: "2 large", grams: 100, calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, sugar: 1, sodium: 140, aliases: ["eggs", "egg"] },
  { id: "greek_yogurt", name: "Greek Yogurt (plain)", serving: "1 cup (245g)", grams: 245, calories: 150, protein: 25, carbs: 9, fat: 4, fiber: 0, sugar: 9, sodium: 65, aliases: ["greek yogurt", "yogurt"] },
  { id: "protein_shake", name: "Protein Shake", serving: "1 scoop + water", grams: 40, calories: 150, protein: 25, carbs: 5, fat: 2, fiber: 1, sugar: 2, sodium: 120, aliases: ["protein shake", "protein powder"] },
  { id: "turkey", name: "Turkey Breast (sliced)", serving: "3 oz (85g)", grams: 85, calories: 115, protein: 24, carbs: 1, fat: 1, fiber: 0, sugar: 0, sodium: 550, aliases: ["turkey breast", "turkey"] },
  { id: "tuna", name: "Tuna (canned in water)", serving: "1 can (142g)", grams: 142, calories: 130, protein: 29, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 320, aliases: ["tuna"] },
  { id: "tofu", name: "Tofu (firm)", serving: "1/2 block (126g)", grams: 126, calories: 180, protein: 20, carbs: 4, fat: 10, fiber: 2, sugar: 1, sodium: 15, aliases: ["tofu"] },
  { id: "cottage_cheese", name: "Cottage Cheese", serving: "1 cup (226g)", grams: 226, calories: 220, protein: 25, carbs: 8, fat: 10, fiber: 0, sugar: 8, sodium: 700, aliases: ["cottage cheese"] },
  { id: "steak", name: "Grilled Steak (sirloin)", serving: "6 oz (170g)", grams: 170, calories: 350, protein: 48, carbs: 0, fat: 16, fiber: 0, sugar: 0, sodium: 105, aliases: ["steak"] },
  { id: "pork_chop", name: "Pork Chop", serving: "1 chop (170g)", grams: 170, calories: 330, protein: 40, carbs: 0, fat: 18, fiber: 0, sugar: 0, sodium: 90, aliases: ["pork chop", "pork"] },
  { id: "shrimp", name: "Shrimp (grilled)", serving: "12 large (100g)", grams: 100, calories: 100, protein: 21, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 190, aliases: ["shrimp"] },

  // ---- Carbs / grains ----
  { id: "white_rice", name: "White Rice (cooked)", serving: "1 cup (158g)", grams: 158, calories: 205, protein: 4, carbs: 45, fat: 0, fiber: 1, sugar: 0, sodium: 2, aliases: ["white rice", "rice"] },
  { id: "brown_rice", name: "Brown Rice (cooked)", serving: "1 cup (195g)", grams: 195, calories: 215, protein: 5, carbs: 45, fat: 2, fiber: 4, sugar: 0, sodium: 10, aliases: ["brown rice"] },
  { id: "oatmeal", name: "Oatmeal (cooked)", serving: "1 cup (234g)", grams: 234, calories: 165, protein: 6, carbs: 28, fat: 3, fiber: 4, sugar: 1, sodium: 9, aliases: ["oatmeal", "oats"] },
  { id: "bread_wheat", name: "Whole Wheat Bread", serving: "2 slices (56g)", grams: 56, calories: 140, protein: 6, carbs: 24, fat: 2, fiber: 4, sugar: 3, sodium: 260, aliases: ["whole wheat bread", "wheat bread"] },
  { id: "bread_white", name: "White Bread", serving: "2 slices (52g)", grams: 52, calories: 130, protein: 4, carbs: 24, fat: 1, fiber: 1, sugar: 2, sodium: 260, aliases: ["white bread", "toast", "bread"] },
  { id: "bagel", name: "Bagel", serving: "1 medium (105g)", grams: 105, calories: 275, protein: 11, carbs: 55, fat: 1, fiber: 2, sugar: 6, sodium: 500, aliases: ["bagel"] },
  { id: "pasta", name: "Pasta (cooked)", serving: "1 cup (140g)", grams: 140, calories: 220, protein: 8, carbs: 43, fat: 1, fiber: 3, sugar: 1, sodium: 1, aliases: ["pasta", "noodles"] },
  { id: "potato_baked", name: "Baked Potato", serving: "1 medium (173g)", grams: 173, calories: 160, protein: 4, carbs: 37, fat: 0, fiber: 4, sugar: 2, sodium: 15, aliases: ["baked potato", "potato"] },
  { id: "sweet_potato", name: "Sweet Potato (baked)", serving: "1 medium (150g)", grams: 150, calories: 130, protein: 2, carbs: 30, fat: 0, fiber: 4, sugar: 6, sodium: 55, aliases: ["sweet potato"] },
  { id: "tortilla", name: "Flour Tortilla", serving: "1 large (60g)", grams: 60, calories: 175, protein: 5, carbs: 29, fat: 4, fiber: 2, sugar: 1, sodium: 400, aliases: ["tortilla"] },
  { id: "cereal", name: "Cereal (dry)", serving: "1 cup (30g)", grams: 30, calories: 115, protein: 2, carbs: 25, fat: 1, fiber: 2, sugar: 10, sodium: 150, aliases: ["cereal"] },
  { id: "mashed_potato", name: "Mashed Potatoes", serving: "1 cup (210g)", grams: 210, calories: 240, protein: 4, carbs: 35, fat: 9, fiber: 3, sugar: 3, sodium: 640, aliases: ["mashed potatoes", "mashed potato"] },

  // ---- Fruit ----
  { id: "banana", name: "Banana", serving: "1 medium (118g)", grams: 118, calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14, sodium: 1, aliases: ["banana"] },
  { id: "apple", name: "Apple", serving: "1 medium (182g)", grams: 182, calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19, sodium: 2, aliases: ["apple"] },
  { id: "orange", name: "Orange", serving: "1 medium (131g)", grams: 131, calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3, sugar: 12, sodium: 0, aliases: ["orange"] },
  { id: "grapes", name: "Grapes", serving: "1 cup (151g)", grams: 151, calories: 104, protein: 1, carbs: 27, fat: 0, fiber: 1, sugar: 23, sodium: 3, aliases: ["grapes"] },
  { id: "strawberries", name: "Strawberries", serving: "1 cup (152g)", grams: 152, calories: 49, protein: 1, carbs: 12, fat: 0, fiber: 3, sugar: 7, sodium: 2, aliases: ["strawberries", "strawberry"] },
  { id: "blueberries", name: "Blueberries", serving: "1 cup (148g)", grams: 148, calories: 84, protein: 1, carbs: 21, fat: 0, fiber: 4, sugar: 15, sodium: 1, aliases: ["blueberries", "blueberry"] },
  { id: "pineapple", name: "Pineapple", serving: "1 cup (165g)", grams: 165, calories: 83, protein: 1, carbs: 22, fat: 0, fiber: 2, sugar: 16, sodium: 2, aliases: ["pineapple"] },
  { id: "lemon", name: "Lemon", serving: "1 medium (58g)", grams: 58, calories: 17, protein: 1, carbs: 5, fat: 0, fiber: 2, sugar: 1, sodium: 1, aliases: ["lemon"] },
  { id: "pomegranate", name: "Pomegranate", serving: "1/2 fruit (100g)", grams: 100, calories: 83, protein: 2, carbs: 19, fat: 1, fiber: 4, sugar: 14, sodium: 3, aliases: ["pomegranate"] },
  { id: "fig", name: "Fig", serving: "2 medium (100g)", grams: 100, calories: 74, protein: 1, carbs: 19, fat: 0, fiber: 3, sugar: 16, sodium: 1, aliases: ["figs", "fig"] },

  // ---- Vegetables ----
  { id: "broccoli", name: "Broccoli (steamed)", serving: "1 cup (156g)", grams: 156, calories: 55, protein: 4, carbs: 11, fat: 1, fiber: 5, sugar: 2, sodium: 32, aliases: ["broccoli"] },
  { id: "spinach", name: "Spinach (raw)", serving: "2 cups (60g)", grams: 60, calories: 14, protein: 2, carbs: 2, fat: 0, fiber: 1, sugar: 0, sodium: 47, aliases: ["spinach"] },
  { id: "salad", name: "Mixed Green Salad", serving: "2 cups (85g)", grams: 85, calories: 20, protein: 2, carbs: 4, fat: 0, fiber: 2, sugar: 1, sodium: 15, aliases: ["green salad", "salad"] },
  { id: "carrots", name: "Carrots", serving: "1 cup (128g)", grams: 128, calories: 52, protein: 1, carbs: 12, fat: 0, fiber: 4, sugar: 6, sodium: 88, aliases: ["carrots", "carrot"] },
  { id: "green_beans", name: "Green Beans", serving: "1 cup (125g)", grams: 125, calories: 35, protein: 2, carbs: 8, fat: 0, fiber: 4, sugar: 2, sodium: 6, aliases: ["green beans"] },
  { id: "corn", name: "Corn", serving: "1 cup (154g)", grams: 154, calories: 130, protein: 5, carbs: 29, fat: 2, fiber: 4, sugar: 5, sodium: 20, aliases: ["corn"] },
  { id: "cauliflower", name: "Cauliflower", serving: "1 cup (107g)", grams: 107, calories: 27, protein: 2, carbs: 5, fat: 0, fiber: 2, sugar: 2, sodium: 32, aliases: ["cauliflower"] },
  { id: "cucumber", name: "Cucumber", serving: "1 cup sliced (119g)", grams: 119, calories: 16, protein: 1, carbs: 4, fat: 0, fiber: 1, sugar: 2, sodium: 2, aliases: ["cucumber"] },
  { id: "mushroom", name: "Mushrooms", serving: "1 cup (96g)", grams: 96, calories: 21, protein: 3, carbs: 3, fat: 0, fiber: 1, sugar: 2, sodium: 4, aliases: ["mushrooms", "mushroom"] },
  { id: "bell_pepper", name: "Bell Pepper", serving: "1 medium (119g)", grams: 119, calories: 24, protein: 1, carbs: 6, fat: 0, fiber: 2, sugar: 3, sodium: 4, aliases: ["bell pepper"] },
  { id: "avocado", name: "Avocado", serving: "1/2 fruit (100g)", grams: 100, calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0, sodium: 7, aliases: ["avocado"] },
  { id: "guacamole", name: "Guacamole", serving: "1/4 cup (60g)", grams: 60, calories: 100, protein: 1, carbs: 6, fat: 9, fiber: 4, sugar: 0, sodium: 150, aliases: ["guacamole", "guac"] },

  // ---- Dairy ----
  { id: "milk_whole", name: "Milk (whole)", serving: "1 cup (244g)", grams: 244, calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12, sodium: 105, aliases: ["whole milk"] },
  { id: "milk_2", name: "Milk (2%)", serving: "1 cup (244g)", grams: 244, calories: 120, protein: 8, carbs: 12, fat: 5, fiber: 0, sugar: 12, sodium: 100, aliases: ["milk"] },
  { id: "cheese_slice", name: "Cheese Slice", serving: "1 slice (28g)", grams: 28, calories: 105, protein: 6, carbs: 1, fat: 9, fiber: 0, sugar: 0, sodium: 210, aliases: ["cheese slice", "cheese"] },
  { id: "string_cheese", name: "String Cheese", serving: "1 stick (28g)", grams: 28, calories: 80, protein: 7, carbs: 1, fat: 6, fiber: 0, sugar: 0, sodium: 200, aliases: ["string cheese"] },
  { id: "ice_cream", name: "Ice Cream", serving: "1/2 cup (66g)", grams: 66, calories: 145, protein: 3, carbs: 17, fat: 8, fiber: 1, sugar: 14, sodium: 55, aliases: ["ice cream"] },

  // ---- Fast food / meals ----
  { id: "cheeseburger", name: "Cheeseburger", serving: "1 burger (170g)", grams: 170, calories: 480, protein: 25, carbs: 34, fat: 27, fiber: 2, sugar: 7, sodium: 950, aliases: ["cheeseburger"] },
  { id: "hamburger", name: "Hamburger", serving: "1 burger (150g)", grams: 150, calories: 400, protein: 22, carbs: 33, fat: 20, fiber: 2, sugar: 6, sodium: 700, aliases: ["hamburger", "burger"] },
  { id: "pizza", name: "Pizza (cheese)", serving: "1 slice (107g)", grams: 107, calories: 270, protein: 12, carbs: 33, fat: 10, fiber: 2, sugar: 4, sodium: 550, aliases: ["pizza slice", "pizza"] },
  { id: "french_fries", name: "French Fries", serving: "medium (117g)", grams: 117, calories: 365, protein: 4, carbs: 48, fat: 17, fiber: 4, sugar: 0, sodium: 246, aliases: ["french fries", "fries"] },
  { id: "chicken_nuggets", name: "Chicken Nuggets", serving: "6 pieces (100g)", grams: 100, calories: 280, protein: 14, carbs: 17, fat: 18, fiber: 1, sugar: 0, sodium: 540, aliases: ["chicken nuggets", "nuggets"] },
  { id: "hotdog", name: "Hot Dog", serving: "1 with bun (98g)", grams: 98, calories: 290, protein: 10, carbs: 24, fat: 17, fiber: 1, sugar: 4, sodium: 810, aliases: ["hot dog", "hotdog"] },
  { id: "burrito", name: "Burrito (chicken)", serving: "1 burrito (280g)", grams: 280, calories: 550, protein: 30, carbs: 65, fat: 18, fiber: 8, sugar: 4, sodium: 1200, aliases: ["burrito"] },
  { id: "chicken_sandwich", name: "Chicken Sandwich", serving: "1 sandwich (220g)", grams: 220, calories: 500, protein: 28, carbs: 45, fat: 22, fiber: 2, sugar: 6, sodium: 1000, aliases: ["chicken sandwich"] },
  { id: "taco", name: "Taco", serving: "1 taco (110g)", grams: 110, calories: 210, protein: 10, carbs: 18, fat: 11, fiber: 3, sugar: 2, sodium: 400, aliases: ["tacos", "taco"] },
  { id: "spaghetti_meat", name: "Spaghetti with Meat Sauce", serving: "1.5 cups (300g)", grams: 300, calories: 450, protein: 22, carbs: 55, fat: 15, fiber: 5, sugar: 8, sodium: 800, aliases: ["spaghetti with meat sauce", "spaghetti"] },
  { id: "chicken_caesar", name: "Chicken Caesar Salad", serving: "1 bowl (300g)", grams: 300, calories: 470, protein: 35, carbs: 12, fat: 32, fiber: 3, sugar: 3, sodium: 1050, aliases: ["chicken caesar salad", "caesar salad"] },
  { id: "pbj", name: "PB&J Sandwich", serving: "1 sandwich (100g)", grams: 100, calories: 350, protein: 11, carbs: 45, fat: 15, fiber: 3, sugar: 17, sodium: 380, aliases: ["pb&j", "peanut butter and jelly", "pbj sandwich"] },
  { id: "chicken_rice_bowl", name: "Grilled Chicken & Rice Bowl", serving: "1 bowl (350g)", grams: 350, calories: 520, protein: 45, carbs: 55, fat: 12, fiber: 3, sugar: 2, sodium: 620, aliases: ["chicken and rice bowl", "chicken rice bowl"] },

  // ---- Snacks ----
  { id: "protein_bar", name: "Protein Bar", serving: "1 bar (60g)", grams: 60, calories: 220, protein: 20, carbs: 24, fat: 8, fiber: 3, sugar: 9, sodium: 200, aliases: ["protein bar"] },
  { id: "granola_bar", name: "Granola Bar", serving: "1 bar (28g)", grams: 28, calories: 120, protein: 2, carbs: 20, fat: 4, fiber: 1, sugar: 8, sodium: 65, aliases: ["granola bar"] },
  { id: "chips", name: "Potato Chips", serving: "1 oz (28g)", grams: 28, calories: 150, protein: 2, carbs: 15, fat: 10, fiber: 1, sugar: 0, sodium: 170, aliases: ["potato chips", "chips"] },
  { id: "popcorn", name: "Popcorn", serving: "3 cups (24g)", grams: 24, calories: 95, protein: 3, carbs: 19, fat: 1, fiber: 4, sugar: 0, sodium: 1, aliases: ["popcorn"] },
  { id: "pretzels", name: "Pretzels", serving: "1 oz (28g)", grams: 28, calories: 108, protein: 3, carbs: 22, fat: 1, fiber: 1, sugar: 1, sodium: 385, aliases: ["pretzels", "pretzel"] },
  { id: "peanut_butter", name: "Peanut Butter", serving: "2 tbsp (32g)", grams: 32, calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, sugar: 3, sodium: 150, aliases: ["peanut butter"] },
  { id: "almonds", name: "Almonds", serving: "1 oz / 23 nuts (28g)", grams: 28, calories: 165, protein: 6, carbs: 6, fat: 14, fiber: 4, sugar: 1, sodium: 0, aliases: ["almonds"] },
  { id: "trail_mix", name: "Trail Mix", serving: "1/4 cup (35g)", grams: 35, calories: 170, protein: 5, carbs: 15, fat: 11, fiber: 2, sugar: 9, sodium: 40, aliases: ["trail mix"] },

  // ---- Drinks ----
  { id: "gatorade", name: "Gatorade", serving: "20 oz bottle (591ml)", grams: 591, calories: 140, protein: 0, carbs: 36, fat: 0, fiber: 0, sugar: 34, sodium: 270, aliases: ["gatorade"] },
  { id: "water", name: "Water", serving: "1 bottle", grams: 500, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, aliases: ["water"] },
  { id: "soda", name: "Soda", serving: "12 oz can (355ml)", grams: 355, calories: 150, protein: 0, carbs: 39, fat: 0, fiber: 0, sugar: 39, sodium: 45, aliases: ["soda", "coke", "pop"] },
  { id: "orange_juice", name: "Orange Juice", serving: "1 cup (248g)", grams: 248, calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0, sugar: 21, sodium: 2, aliases: ["orange juice"] },
  { id: "chocolate_milk", name: "Chocolate Milk", serving: "1 cup (250g)", grams: 250, calories: 208, protein: 8, carbs: 26, fat: 8, fiber: 1, sugar: 24, sodium: 150, aliases: ["chocolate milk"] },
];

// Maps AI (MobileNet/ImageNet) label keywords to a food id in FOOD_DB.
// Matching is done by substring, case-insensitive, against the AI's predicted label.
const AI_KEYWORD_MAP = [
  ["cheeseburger", "cheeseburger"],
  ["hamburger", "hamburger"],
  ["hotdog", "hotdog"],
  ["hot dog", "hotdog"],
  ["pizza", "pizza"],
  ["burrito", "burrito"],
  ["guacamole", "guacamole"],
  ["mashed potato", "mashed_potato"],
  ["banana", "banana"],
  ["strawberry", "strawberries"],
  ["pineapple", "pineapple"],
  ["orange", "orange"],
  ["lemon", "lemon"],
  ["pomegranate", "pomegranate"],
  ["fig", "fig"],
  ["granny smith", "apple"],
  ["broccoli", "broccoli"],
  ["cauliflower", "cauliflower"],
  ["cucumber", "cucumber"],
  ["mushroom", "mushroom"],
  ["bell pepper", "bell_pepper"],
  ["french loaf", "bread_white"],
  ["bagel", "bagel"],
  ["pretzel", "pretzels"],
  ["ice cream", "ice_cream"],
  ["potpie", "chicken_rice_bowl"],
  ["meat loaf", "ground_beef_90"],
  ["carbonara", "pasta"],
  ["consomme", "chicken_rice_bowl"],
];

if (typeof module !== "undefined") {
  module.exports = { FOOD_DB, AI_KEYWORD_MAP };
}
