import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SKILLS_DATA = [
  // Programming & Tech
  { name: "JavaScript", category: "Programming" },
  { name: "TypeScript", category: "Programming" },
  { name: "React", category: "Programming" },
  { name: "Next.js", category: "Programming" },
  { name: "Node.js", category: "Programming" },
  { name: "Python", category: "Programming" },
  { name: "Django", category: "Programming" },
  { name: "Flask", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "Spring Boot", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "C#", category: "Programming" },
  { name: ".NET Core", category: "Programming" },
  { name: "Go (Golang)", category: "Programming" },
  { name: "Rust", category: "Programming" },
  { name: "Ruby on Rails", category: "Programming" },
  { name: "Swift", category: "Programming" },
  { name: "Kotlin", category: "Programming" },
  { name: "Flutter", category: "Programming" },
  { name: "React Native", category: "Programming" },
  { name: "PHP", category: "Programming" },
  { name: "Laravel", category: "Programming" },
  { name: "SQL", category: "Programming" },
  { name: "PostgreSQL", category: "Programming" },
  { name: "MongoDB", category: "Programming" },
  { name: "Redis", category: "Programming" },
  { name: "GraphQL", category: "Programming" },
  { name: "Docker", category: "DevOps & Cloud" },
  { name: "Kubernetes", category: "DevOps & Cloud" },
  { name: "AWS Cloud", category: "DevOps & Cloud" },
  { name: "Git & Version Control", category: "Programming" },
  { name: "Linux System Administration", category: "DevOps & Cloud" },
  { name: "Cybersecurity & Ethical Hacking", category: "Security" },
  { name: "Machine Learning", category: "Data Science & AI" },
  { name: "Data Science", category: "Data Science & AI" },
  { name: "Artificial Intelligence", category: "Data Science & AI" },
  { name: "Deep Learning", category: "Data Science & AI" },
  { name: "Computer Vision", category: "Data Science & AI" },
  { name: "Natural Language Processing", category: "Data Science & AI" },

  // Design & Multimedia
  { name: "UI/UX Design", category: "Design" },
  { name: "Figma", category: "Design" },
  { name: "Graphic Design", category: "Design" },
  { name: "Adobe Photoshop", category: "Design" },
  { name: "Adobe Illustrator", category: "Design" },
  { name: "Video Editing", category: "Multimedia" },
  { name: "Adobe Premiere Pro", category: "Multimedia" },
  { name: "After Effects & Motion Graphics", category: "Multimedia" },
  { name: "3D Modeling", category: "Design" },
  { name: "Blender 3D", category: "Design" },
  { name: "Brand Identity Design", category: "Design" },
  { name: "Typography & Layout", category: "Design" },
  { name: "Digital Photography", category: "Arts & Media" },
  { name: "Digital Illustration", category: "Arts & Media" },
  { name: "Wireframing & Prototyping", category: "Design" },
  { name: "User Research", category: "Design" },

  // Languages
  { name: "Spanish", category: "Languages" },
  { name: "French", category: "Languages" },
  { name: "German", category: "Languages" },
  { name: "Mandarin Chinese", category: "Languages" },
  { name: "Japanese", category: "Languages" },
  { name: "Korean", category: "Languages" },
  { name: "Italian", category: "Languages" },
  { name: "Portuguese", category: "Languages" },
  { name: "Russian", category: "Languages" },
  { name: "Arabic", category: "Languages" },
  { name: "Hindi", category: "Languages" },
  { name: "Dutch", category: "Languages" },
  { name: "Swedish", category: "Languages" },
  { name: "American Sign Language (ASL)", category: "Languages" },
  { name: "English (ESL / Accent Coaching)", category: "Languages" },

  // Music & Audio
  { name: "Acoustic Guitar", category: "Music" },
  { name: "Electric Guitar", category: "Music" },
  { name: "Piano & Keyboard", category: "Music" },
  { name: "Bass Guitar", category: "Music" },
  { name: "Drums & Percussion", category: "Music" },
  { name: "Violin", category: "Music" },
  { name: "Ukulele", category: "Music" },
  { name: "Vocal Technique & Singing", category: "Music" },
  { name: "Music Production", category: "Music" },
  { name: "Ableton Live", category: "Music" },
  { name: "FL Studio", category: "Music" },
  { name: "Logic Pro", category: "Music" },
  { name: "Audio Mixing & Mastering", category: "Music" },
  { name: "Songwriting & Composition", category: "Music" },
  { name: "DJing & Beatmatching", category: "Music" },

  // Business, Finance & Marketing
  { name: "Digital Marketing", category: "Business" },
  { name: "Search Engine Optimization (SEO)", category: "Marketing" },
  { name: "Content Strategy & Copywriting", category: "Marketing" },
  { name: "Social Media Growth", category: "Marketing" },
  { name: "Sales & Negotiation", category: "Business" },
  { name: "Public Speaking & Presentations", category: "Professional Skills" },
  { name: "Financial Modeling", category: "Finance" },
  { name: "Stock Market & Investing", category: "Finance" },
  { name: "Accounting & Bookkeeping", category: "Finance" },
  { name: "Project Management (Agile / Scrum)", category: "Business" },
  { name: "Product Management", category: "Business" },
  { name: "Advanced Excel & Data Analysis", category: "Business" },
  { name: "Startup Entrepreneurship", category: "Business" },

  // Health, Fitness & Wellness
  { name: "Yoga & Asana", category: "Wellness" },
  { name: "Pilates", category: "Wellness" },
  { name: "Strength & Resistance Training", category: "Fitness" },
  { name: "Calisthenics & Bodyweight Training", category: "Fitness" },
  { name: "Nutrition & Meal Planning", category: "Wellness" },
  { name: "Meditation & Mindfulness", category: "Wellness" },
  { name: "Martial Arts (Muay Thai / Kickboxing)", category: "Fitness" },
  { name: "Brazilian Jiu-Jitsu (BJJ)", category: "Fitness" },

  // Cooking & Culinary Arts
  { name: "Sourdough & Artisan Bread Baking", category: "Culinary" },
  { name: "Pastry & Dessert Making", category: "Culinary" },
  { name: "Italian Cooking & Pasta Making", category: "Culinary" },
  { name: "Asian Cuisine & Wok Techniques", category: "Culinary" },
  { name: "Specialty Coffee Brewing & Latte Art", category: "Culinary" },
  { name: "Wine Tasting & Sommelier Skills", category: "Culinary" },
  { name: "Cocktail Mixology", category: "Culinary" },
  { name: "Plant-Based & Vegan Cooking", category: "Culinary" },

  // Academics, Science & Strategy
  { name: "Calculus & Higher Mathematics", category: "Academics" },
  { name: "Statistics & Probability", category: "Academics" },
  { name: "Physics", category: "Academics" },
  { name: "Chemistry", category: "Academics" },
  { name: "Creative Writing & Storytelling", category: "Academics" },
  { name: "Chess Strategy & Tactics", category: "Strategy & Games" },
  { name: "Philosophy & Critical Thinking", category: "Academics" },

  // Crafts & Hands-On Hobbies
  { name: "Woodworking & Joinery", category: "Crafts" },
  { name: "Pottery & Handbuilt Ceramics", category: "Crafts" },
  { name: "Knitting & Crochet", category: "Crafts" },
  { name: "Gardening & Urban Horticulture", category: "Lifestyle" },
  { name: "Watercolor Painting", category: "Arts & Media" },
  { name: "Oil & Acrylic Painting", category: "Arts & Media" },
  { name: "Calligraphy & Hand Lettering", category: "Arts & Media" },
  { name: "Leathercrafting", category: "Crafts" },
];

async function seedSkills() {
  console.log(`Seeding ${SKILLS_DATA.length} standardized skills...`);
  let count = 0;
  for (const s of SKILLS_DATA) {
    await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category },
      create: { name: s.name, category: s.category },
    });
    count++;
  }
  console.log(`Successfully seeded ${count} skills into the database!`);
  await prisma.$disconnect();
}

seedSkills().catch((e) => {
  console.error(e);
  process.exit(1);
});
